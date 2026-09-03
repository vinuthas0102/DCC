/*
  # Migrate bhk_config and required_bhk_config to Quarter Type strings

  ## Summary
  Replaces legacy BHK notation (e.g. "1 BHK", "2BHK") in the quarters and
  quarter_requests tables with the official government quarter type designations
  (Type-I through Type-V).

  ## Changes
  ### quarters.bhk_config
  - "1 BHK" / "1BHK"  → "Type-I"
  - "2 BHK" / "2BHK"  → "Type-II"
  - "3 BHK" / "3BHK"  → "Type-III"
  - "4 BHK" / "4BHK"  → "Type-IV"
  - "5 BHK" / "5BHK"  → "Type-V"

  ### quarter_requests.required_bhk_config
  Same mapping applied.

  ## Notes
  - Non-destructive UPDATE only; no rows are deleted.
  - Values already in quarter-type format are unaffected.
*/

UPDATE quarters
SET bhk_config = CASE
  WHEN bhk_config IN ('1 BHK', '1BHK', '1-BHK') THEN 'Type-I'
  WHEN bhk_config IN ('2 BHK', '2BHK', '2-BHK') THEN 'Type-II'
  WHEN bhk_config IN ('3 BHK', '3BHK', '3-BHK') THEN 'Type-III'
  WHEN bhk_config IN ('4 BHK', '4BHK', '4-BHK') THEN 'Type-IV'
  WHEN bhk_config IN ('5 BHK', '5BHK', '5-BHK') THEN 'Type-V'
  ELSE bhk_config
END
WHERE bhk_config IN ('1 BHK','1BHK','1-BHK','2 BHK','2BHK','2-BHK','3 BHK','3BHK','3-BHK','4 BHK','4BHK','4-BHK','5 BHK','5BHK','5-BHK');

UPDATE quarter_requests
SET required_bhk_config = CASE
  WHEN required_bhk_config IN ('1 BHK', '1BHK', '1-BHK') THEN 'Type-I'
  WHEN required_bhk_config IN ('2 BHK', '2BHK', '2-BHK') THEN 'Type-II'
  WHEN required_bhk_config IN ('3 BHK', '3BHK', '3-BHK') THEN 'Type-III'
  WHEN required_bhk_config IN ('4 BHK', '4BHK', '4-BHK') THEN 'Type-IV'
  WHEN required_bhk_config IN ('5 BHK', '5BHK', '5-BHK') THEN 'Type-V'
  ELSE required_bhk_config
END
WHERE required_bhk_config IN ('1 BHK','1BHK','1-BHK','2 BHK','2BHK','2-BHK','3 BHK','3BHK','3-BHK','4 BHK','4BHK','4-BHK','5 BHK','5BHK','5-BHK');
