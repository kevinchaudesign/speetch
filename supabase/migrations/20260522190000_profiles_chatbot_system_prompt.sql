-- ============================================================================
-- profiles.chatbot_system_prompt — system instructions custom du chatbot Yoda
--
-- Stocké sur la ligne owner (is_owner = true) uniquement. Si NULL, le
-- chatbot utilise le default hardcodé dans `lib/chatbot/system-prompt.ts`.
-- Si non-null, ce texte remplace intégralement le PRODUCT_BRIEF cacheable.
--
-- Motivation : Speetch se positionne comme un groupe de communication à
-- l'ère de l'IA. Le system prompt est un asset business modifiable (peut
-- pivoter la voix du chatbot d'un personnage à un autre selon les besoins),
-- pas une constante hardcodée.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chatbot_system_prompt TEXT NULL;

COMMENT ON COLUMN public.profiles.chatbot_system_prompt IS
  'System instructions custom du chatbot admin. NULL = default hardcodé. Stocké sur owner (is_owner=true) uniquement.';
