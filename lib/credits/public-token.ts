/**
 * Tokens signés HMAC pour accès public à une pièce (devis/facture/avoir)
 * via un lien email — sans auth admin.
 *
 * Pattern : token = base64url(payload).hmacBase64url
 *  payload = "<type>:<id>:<exp_ts>"
 *  hmac    = HMAC-SHA256(payload, SECRET) en base64url
 *  SECRET  = SPEETCH_CLIENT_PASSWORD_PEPPER (réutilisé — déjà long et secret)
 *
 * Le token est totalement stateless — pas de stockage côté DB. Pour
 * révoquer un lien : régénérer (le précédent reste valide jusqu'à
 * expiration). Pour révoquer immédiatement il faudrait une table de
 * "revoked tokens" — v2.
 *
 * Expiration par défaut : 90 jours (suffisant pour qu'un client retrouve
 * un devis longtemps après réception).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 90 * 24 * 60 * 60;

function getSecret(): Buffer {
  const raw = process.env.SPEETCH_CLIENT_PASSWORD_PEPPER;
  if (!raw) {
    throw new Error(
      "SPEETCH_CLIENT_PASSWORD_PEPPER manquant — impossible de signer les tokens publics.",
    );
  }
  return Buffer.from(raw, "utf8");
}

function b64urlEncode(s: string | Buffer): string {
  const buf = typeof s === "string" ? Buffer.from(s, "utf8") : s;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecodeStr(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(
    s.replace(/-/g, "+").replace(/_/g, "/") + pad,
    "base64",
  ).toString("utf8");
}

function sign(payload: string): string {
  return b64urlEncode(
    createHmac("sha256", getSecret()).update(payload).digest(),
  );
}

export type CreditPieceType = "quote" | "invoice" | "credit_note";

export function signCreditToken(
  type: CreditPieceType,
  id: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${type}:${id}:${exp}`;
  const sig = sign(payload);
  return `${b64urlEncode(payload)}.${sig}`;
}

export type VerifiedToken =
  | { ok: true; type: CreditPieceType; id: string; exp: number }
  | { ok: false; error: string };

export function verifyCreditToken(
  token: string,
  expectedType?: CreditPieceType,
  expectedId?: string,
): VerifiedToken {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { ok: false, error: "Format de token invalide" };
  }
  const [payloadB64, sigB64] = parts;
  let payload: string;
  try {
    payload = b64urlDecodeStr(payloadB64);
  } catch {
    return { ok: false, error: "Token corrompu" };
  }
  const expectedSig = sign(payload);
  const a = Buffer.from(sigB64, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Signature invalide" };
  }
  const segs = payload.split(":");
  if (segs.length !== 3) {
    return { ok: false, error: "Payload mal formé" };
  }
  const [type, id, expStr] = segs;
  if (type !== "quote" && type !== "invoice" && type !== "credit_note") {
    return { ok: false, error: "Type inconnu" };
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp)) {
    return { ok: false, error: "Expiration invalide" };
  }
  if (exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: "Lien expiré" };
  }
  if (expectedType && type !== expectedType) {
    return { ok: false, error: "Type ne correspond pas" };
  }
  if (expectedId && id !== expectedId) {
    return { ok: false, error: "Identifiant ne correspond pas" };
  }
  return { ok: true, type, id, exp };
}

export function buildPublicCreditUrl(
  origin: string,
  type: CreditPieceType,
  id: string,
): string {
  const token = signCreditToken(type, id);
  return `${origin.replace(/\/$/, "")}/credits/public/${type}/${id}/${token}`;
}
