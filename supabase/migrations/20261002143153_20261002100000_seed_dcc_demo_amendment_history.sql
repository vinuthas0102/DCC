/*
# Seed demonstration demand amendment history

1. Purpose
- Add realistic amendment activity to existing demonstration demands so the Demand History cards can be demonstrated with both creation and modification events.

2. Data Added
- Adds one amendment entry to each of three existing demonstration demands.
- Adds a second amendment entry to one demand to demonstrate multiple modifications on the same demand.
- Each entry stores changed field names plus the previous and updated values.
- The demonstration actors are labeled as "Demo Finance Review" and "Demo Collections Review".

3. Data Safety
- Existing demand amounts, statuses, due dates, payment records, and installment balances are not changed.
- Inserts are guarded so re-running this migration does not create duplicate demonstration entries.
- Existing audit history remains unchanged.

4. Security
- Uses the existing append-only `public.dcc_demand_audit_log` table and its current read policy.
- No new permissions or policies are introduced.

5. Important Notes
- These records are intentionally labeled as demonstration history.
- They exist only to make amendment history visible in the demo experience.
*/

INSERT INTO public.dcc_demand_audit_log (
  demand_id,
  event_type,
  changed_fields,
  old_values,
  new_values,
  actor_label,
  created_at
)
SELECT
  v.demand_id,
  'AMENDED',
  v.changed_fields,
  v.old_values,
  v.new_values,
  v.actor_label,
  v.created_at
FROM (
  VALUES
    (
      'a1b2c3d4-0001-4000-8000-000000000002'::uuid,
      ARRAY['due_date', 'include_gst']::text[],
      '{"due_date":"2026-12-15","include_gst":false}'::jsonb,
      '{"due_date":"2026-12-20","include_gst":true}'::jsonb,
      'Demo Finance Review'::text,
      '2026-09-18 10:30:00+00'::timestamptz
    ),
    (
      'a1b2c3d4-0001-4000-8000-000000000004'::uuid,
      ARRAY['amount', 'gst_amount']::text[],
      '{"amount":11250,"gst_amount":0}'::jsonb,
      '{"amount":11800,"gst_amount":550}'::jsonb,
      'Demo Collections Review'::text,
      '2026-09-22 14:15:00+00'::timestamptz
    ),
    (
      '956d393c-1b9a-4152-a34d-bf60a3449331'::uuid,
      ARRAY['status', 'amount_paid']::text[],
      '{"status":"DUE","amount_paid":0}'::jsonb,
      '{"status":"PAID","amount_paid":25000}'::jsonb,
      'Demo Collections Review'::text,
      '2026-09-26 09:45:00+00'::timestamptz
    ),
    (
      '956d393c-1b9a-4152-a34d-bf60a3449331'::uuid,
      ARRAY['due_date']::text[],
      '{"due_date":"2026-09-15"}'::jsonb,
      '{"due_date":"2026-09-20"}'::jsonb,
      'Demo Finance Review'::text,
      '2026-09-27 16:20:00+00'::timestamptz
    )
) AS v(demand_id, changed_fields, old_values, new_values, actor_label, created_at)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.dcc_demand_audit_log existing
  WHERE existing.demand_id = v.demand_id
    AND existing.event_type = 'AMENDED'
    AND existing.actor_label = v.actor_label
    AND existing.created_at = v.created_at
);