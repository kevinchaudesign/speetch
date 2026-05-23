/**
 * Chiffrement AES-256-GCM pour les mots de passe IMAP/SMTP stockés en BDD.
 *
 * Format encodé : base64(iv | authTag | ciphertext)
 *   - iv         : 12 bytes (nonce GCM standard)
 *   - authTag    : 16 bytes (tag d'intégrité)
 *   - ciphertext : longueur variable
 *
 * La clé maître vit dans la variable d'environnement
 * SPEETCH_EMAIL_ENCRYPTION_KEY : 32 bytes encodés en hex (64 caractères).
 *
 * Pour générer une clé en local :
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.SPEETCH_EMAIL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "SPEETCH_EMAIL_ENCRYPTION_KEY manquant. Génère une clé avec : node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) {
    throw new Error(
      "SPEETCH_EMAIL_ENCRYPTION_KEY doit faire 32 bytes (64 caractères hex).",
    );
  }
  return buf;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSecret(encoded: string): string {
  const data = Buffer.from(encoded, "base64");
  if (data.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("Payload chiffré invalide.");
  }
  const iv = data.subarray(0, IV_LEN);
  const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = data.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Indique si la clé de chiffrement est correctement configurée.
 * Pour afficher un message d'aide UI dans la page settings.
 */
export function isEncryptionKeyConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}
