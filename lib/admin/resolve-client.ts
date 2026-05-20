const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Les routes /admin/clients/[id] acceptent un UUID ou un slug. Renvoie la
// colonne `profiles` à utiliser dans le `.eq(...)` selon le format reçu.
export function clientLookupColumn(rawId: string): "id" | "slug" {
  return UUID_REGEX.test(rawId) ? "id" : "slug";
}
