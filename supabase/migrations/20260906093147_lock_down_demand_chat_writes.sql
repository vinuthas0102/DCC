/*
  # Demand chat messages become append-only

  The table previously allowed any caller, signed in or not, to UPDATE or DELETE
  every message. The application only lists and inserts messages, so both verbs
  are removed entirely.
*/

DROP POLICY IF EXISTS "anon_update_dcc_demand_chats" ON public.dcc_demand_chats;
DROP POLICY IF EXISTS "anon_delete_dcc_demand_chats" ON public.dcc_demand_chats;

REVOKE UPDATE, DELETE ON public.dcc_demand_chats FROM anon, authenticated;
