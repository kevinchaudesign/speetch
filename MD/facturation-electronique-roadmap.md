# Facturation électronique — Roadmap technique

Statut au commit `8a9407b` (mai 2026). Ce document décrit **ce qui est en
place**, **ce qui manque** et **comment plug** la suite, pour un dev qui
reprend le sujet à froid.

---

## 1. Contexte réglementaire (synthèse)

La réforme française impose la facturation électronique B2B via PDP
(Plateforme de Dématérialisation Partenaire) ou la plateforme publique
**Chorus Pro** :

| Échéance | Obligation |
|---|---|
| **1ᵉʳ sept. 2026** | Toutes les entreprises doivent **recevoir** leurs factures par PDP |
| **1ᵉʳ sept. 2026** | Grandes entreprises + ETI doivent **émettre** par PDP |
| **1ᵉʳ sept. 2027** | PME + TPE + micro-entreprises doivent **émettre** par PDP |
| B2C / hors UE | Pas concerné par les PDP, mais e-reporting obligatoire |

Format de transmission imposé : **Factur-X** (PDF/A-3 + XML CII embarqué),
ou **UBL**, ou **CII** XML pur. Le profil minimal acceptable par Chorus Pro
est **BASIC** (inclut les lignes).

Source officielle : <https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique>

---

## 2. État actuel du code

### ✅ Déjà fait

#### Structure DB
- `credit_quotes`, `credit_invoices`, `credit_notes`, `credit_sequences`, `credit_emitter_settings` (cf. `supabase/migrations/20260523040000_create_credits.sql`)
- RPC atomique `next_credit_number(year, kind, prefix)` → numérotation séquentielle sans trou
- Champs e-invoicing déjà sur `credit_invoices` :
  - `operation_type` (`B2B` / `B2C` / `B2G` / `export` / `intra_eu`)
  - `operation_nature` (`goods` / `services` / `mixed`)
  - `delivery_address` (si livraison ≠ facturation)
  - `lifecycle_status` (placeholder pour les retours PDP)
- Snapshot client complet (SIREN, TVA intra) figé à l'émission

#### Génération XML Factur-X
- `lib/credits/factur-x.ts` produit du **CII profil BASIC**, conforme EN 16931
- Tags : `factur-x.eu:1p0:basic` → recevable Chorus Pro
- Mapping complet : SellerTradeParty (SIREN schemeID 0002), BuyerTradeParty, lignes (unitCode C62), ventilation TVA, ExemptionReason + Code selon vat_exempt + operation_type, IBAN/BIC, échéance, monetary summation
- Endpoint download : `GET /admin/credits/factures/[id]/factur-x` → XML en attachment, garde owner
- Bouton « Télécharger Factur-X XML » sur la fiche facture
- Checkbox d'attachement automatique à l'email Brevo

#### Configuration émetteur
- Page `/admin/settings/emitter` (carte « Émetteur Crédits » dans Forge)
- Champs PDP préparés : `pdp_provider`, `pdp_id` (vides par défaut)

#### Stub adapter PDP
- `lib/credits/pdp/adapter.ts` définit `PdpAdapter` (`submitInvoice` + `fetchLifecycle`) et un `STUB_PDP_ADAPTER` qui renvoie « non configuré »
- `resolvePdpAdapter(pdpProvider)` switch ready à recevoir des cas réels

### ⏳ Reste à faire

| Brique | Statut | Effort estimé |
|---|---|---|
| Wrapper PDF/A-3 avec XML embarqué | Pas commencé | 1-3 jours selon approche |
| Adapter Chorus Pro (API REST) | Stub uniquement | 2-3 jours |
| Adapter PDP privé (Pennylane / Sellsy / autre) | Stub uniquement | 1-2 jours par PDP |
| Webhook lifecycle (statuts remontés par PDP) | Pas commencé | 1 jour + tests |
| Cron auto de récupération des statuts | Pas commencé | 0.5 jour |
| E-reporting B2C (transactions hors PDP) | Pas commencé | 1 jour |
| UI : badge `lifecycle_status` sur la liste factures | Pas commencé | 0.5 jour |

---

## 3. Plan d'attaque — du plus simple au plus complet

### Étape A — Wrapper PDF/A-3 (Factur-X complet)

Aujourd'hui on génère uniquement le **XML**. Un Factur-X complet =
**PDF/A-3 contenant le XML en pièce jointe interne** + métadonnées XMP
qui déclarent la conformité.

3 approches possibles :

#### A.1 — Puppeteer + pdf-lib (recommandé self-hosted)
```bash
npm install puppeteer pdf-lib
```
- Puppeteer rend `/admin/credits/print/invoice/[id]` en PDF
- `pdf-lib` post-traite : conversion PDF/A-3, embed du XML comme attachment, ajout XMP `<fx:DocumentType>INVOICE</fx:DocumentType>` etc.
- ⚠ Puppeteer ajoute ~200 MB à node_modules. Hostinger Node tolère, à vérifier sur l'instance.

Squelette :
```ts
// lib/credits/factur-x-pdf.ts
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

export async function buildFacturXPdf(invoice, emitter, baseUrl) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  // → besoin d'une variante PUBLIQUE de la print page (token signé) car puppeteer n'a pas la session admin
  await page.goto(`${baseUrl}/credits/public/invoice/${invoice.id}/${token}`, { waitUntil: "networkidle0" });
  const pdfBytes = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  const xml = buildFacturXXml(invoice, emitter);
  const pdf = await PDFDocument.load(pdfBytes);
  await pdf.attach(new TextEncoder().encode(xml), "factur-x.xml", {
    mimeType: "text/xml",
    description: "Factur-X invoice",
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: "Data",
  });
  // + ajouter XMP metadata PDF/A-3 conformance + Factur-X namespace
  return pdf.save();
}
```
**Attention** : `pdf-lib` ne génère pas du PDF/A-3 strict par défaut — il faut éditer le XMP à la main pour ajouter `<pdfaid:part>3</pdfaid:part><pdfaid:conformance>B</pdfaid:conformance>` et le namespace Factur-X. Voir <https://github.com/Hopding/pdf-lib/issues/178> pour l'exemple.

#### A.2 — Service externe (PDFShift, DocRaptor, Browserless)
```bash
npm install # rien — juste fetch
```
- 9-30 €/mois selon volume
- POST le HTML de la print page → reçoit du PDF
- Idem `pdf-lib` ensuite pour wrap PDF/A-3 + embed XML
- ✅ Pas d'infra
- ❌ Données qui transitent par un tiers (RGPD à vérifier pour les factures)

#### A.3 — Programmatic pdf-lib seul
- Reconstruire le layout en JS pur avec pdf-lib (drawText, drawRectangle…)
- ~500-800 LOC pour reproduire le layout Speetch
- ✅ Lightest, ~5 MB
- ❌ Long à coder + maintenir le visuel devient pénible

**Recommandation** : A.1 si Hostinger tolère puppeteer, sinon A.2.

### Étape B — Choisir le PDP

Décision **utilisateur** (cf. la page `/admin/settings/facturation-electronique`).
Options :
- **Chorus Pro** : gratuit, public, intégration via API REST
  - Docs : <https://communaute.chorus-pro.gouv.fr/documentation/>
  - Auth : OAuth 2.0 PISTE
  - Endpoint dépôt : `POST /factures/v1/deposer/flux`
- **Pennylane** : payant, intégrations compta sympas
  - API docs : <https://pennylane.readme.io/>
- **Sellsy**, **Dext**, **iPaidThat**, **Qonto**, etc. — chacun son SDK / API

### Étape C — Implémenter un adapter

Pour chaque PDP retenu :

```ts
// lib/credits/pdp/chorus-pro.ts
import type { PdpAdapter } from "./adapter";

export const CHORUS_PRO_ADAPTER: PdpAdapter = {
  key: "chorus-pro",
  displayName: "Chorus Pro",
  async submitInvoice({ xml, invoiceNumber, buyerSiren }) {
    const token = await getOAuthToken(); // PISTE OAuth
    const res = await fetch(
      "https://api.aife.economie.gouv.fr/cpro-factures/v1/deposer/flux",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "cpro-account": process.env.CHORUS_PRO_ACCOUNT_ID!,
        },
        body: JSON.stringify({
          fichierFlux: Buffer.from(xml).toString("base64"),
          nomFichier: `${invoiceNumber}.xml`,
          formatFlux: "IN_DP_E2_UBL_INVOICE", // ou CII
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: err };
    }
    const json = await res.json();
    return {
      ok: true,
      pdpInvoiceId: json.numeroFluxDepot,
      lifecycleStatus: "received",
    };
  },
  async fetchLifecycle(pdpInvoiceId) {
    // GET /cpro-factures/v1/consulter/flux/{id}
    // map les statuts Chorus → notre vocabulaire normalisé
    return [];
  },
};
```

Puis brancher dans `resolvePdpAdapter` :
```ts
import { CHORUS_PRO_ADAPTER } from "./chorus-pro";

export function resolvePdpAdapter(pdpProvider) {
  switch (pdpProvider) {
    case "chorus-pro": return CHORUS_PRO_ADAPTER;
    default: return STUB_PDP_ADAPTER;
  }
}
```

Variables d'env nécessaires (par PDP) → à ajouter dans `.env.local.example`
et dans la page Forge → Émetteur Crédits.

### Étape D — Bouton « Transmettre au PDP »

Sur la fiche facture (`app/admin/credits/factures/[id]/invoice-actions-bar.tsx`),
ajouter un bouton qui :
1. Génère le XML (ou Factur-X PDF si étape A faite)
2. Appelle l'adapter `submitInvoice`
3. Persiste `lifecycle_status` + un identifiant `pdp_invoice_id` (champ à
   ajouter à la table `credit_invoices`)
4. Affiche le résultat en toast

### Étape E — Webhook + cron lifecycle

Quand le client paye / accepte / refuse côté PDP :
- Soit le PDP push un webhook → route `/api/credits/pdp/webhook` qui met à
  jour `lifecycle_status` sur la facture
- Soit cron horaire qui appelle `fetchLifecycle` sur toutes les factures
  non-terminées

---

## 4. Checklist de mise en prod

- [ ] Génération XML validée par xmllint sur un exemple réel
- [ ] PDF/A-3 wrapper en place + embed `factur-x.xml`
- [ ] Adapter PDP implémenté + secrets dans .env.local et Hostinger
- [ ] Bouton « Transmettre au PDP » fonctionnel sur fiche facture
- [ ] `lifecycle_status` affiché dans la liste factures (badge)
- [ ] Webhook ou cron lifecycle en place
- [ ] Test end-to-end avec un client B2B réel (sandbox PDP d'abord)
- [ ] Doc utilisateur (page Forge) mise à jour avec le PDP choisi

---

## 5. Ressources

- Spec Factur-X 1.0.07 : <https://fnfe-mpe.org/factur-x/>
- EN 16931 (norme européenne facture électronique) : <https://www.cen.eu/work/areas/ICT/eBusiness/Pages/EN-16931.aspx>
- Chorus Pro API (PISTE) : <https://piste.gouv.fr/>
- Codes UNTDID 5305 (CategoryCode TVA) : <https://service.unece.org/trade/untdid/d16b/tred/tred5305.htm>
- Liste des PDP candidats : <https://www.impots.gouv.fr/portail-public-de-facturation-immatriculation-des-plateformes-de-dematerialisation>

---

**Contact** : Kevin (`clubabrazo@gmail.com` / `speetchapp@gmail.com`).
**Repo** : `github.com/speetchapp/speetch`, branch `main`.
