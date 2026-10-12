# Application Field Inventory

> Complete reference of every field used across the DCC (Demand & Collection Center) application, grouped by screen, plus an appendix of database-only columns not surfaced in any UI.

---

## Section 1: Screen Summary

| Screen ID | Screen Name | Route / Access | Purpose | Applicable Roles |
|---|---|---|---|---|
| SCR_LANDING | Landing Page | `/` | Marketing landing page with overview and CTA to login | All (public) |
| SCR_LOGIN | Login | `/login` | Email/password sign-in with demo role switcher | All (public) |
| SCR_DASHBOARD | DCC Dashboard | `/dashboard` | KPI tiles, demand list, client-wise view, chat, reports tab | public, dept_user, govt_official, manager, admin |
| SCR_RULE_SETUP | Demand Rule Setup | `/dcc/rule-setup` | Create/edit/delete payable criteria rules with all child specs | manager, admin |
| SCR_DEMAND_GEN | Demand Generation | `/dcc/generate` | Auto-generate demands from active rules, view run history | manager, admin |
| SCR_DEMAND_DETAIL | Demand Detail Modal | Overlay from dashboard / generation | View demand, record payment, manage installments, disputes, audit log | All roles (permissions vary) |
| SCR_PAYMENT | Payment Modal | Overlay from demand detail | Record or simulate payment with method selection | All roles (managers record, others simulate) |
| SCR_INSTALLMENT | Installment Plan Form | Tab within demand detail | Create installment schedule with editable rows | manager, admin |
| SCR_DISPUTE | Dispute Form | Tab within demand detail | Raise dispute with date, reason, remarks | govt_official, manager, admin |
| SCR_AUDIT | Audit Log Panel | Tab within demand detail | View field-level change history for a demand | All roles (read-only) |
| SCR_PROFILE | Profile | `/profile` | View and edit personal, employment, identification, contact, family, medical, service history | All authenticated |
| SCR_TXN_DRAWER | Transaction Types Drawer | Sidebar button | Demo showcase of transaction type categories | All authenticated |
| SCR_DCC_FILTER | Dashboard Filter Modal | Button on dashboard | Filter demands by region, object type, demand type, owner, status, dates | All authenticated |
| SCR_RULE_FILTER | Rule Filter Modal | Button on rule setup | Filter rules by object type, import source, owner, demand type, active status, GST | manager, admin |
| SCR_RUN_FILTER | Run History Filter Modal | Button on demand generation | Filter run history by source, demand type, date range, object ref | manager, admin |
| SCR_REPORTS | Reports / MIS Tab | Tab on dashboard | Generate and export reports by type, owner, overdue, or detailed ledger; schedule reports | manager, admin |
| SCR_CHAT | Demand Chat Panel | Side panel on dashboard | Send messages about a demand with delivery mode selection | manager, admin |
| SCR_CLIENT_VIEW | Client-Wise View | Toggle on dashboard | Group demands by owner with summary cards/list/table | All authenticated |
| SCR_OBJECT_SUMMARY | Object Summary Modal | From client-wise view | View all objects/demands for a specific client | All authenticated |
| SCR_OBJECT_DUE | Object Demand Due Screen | From object summary | View demands for a specific object | All authenticated |

---

## Section 2: Login Screen (SCR_LOGIN)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Email Address | `email` | text (email) | Yes | Yes | Valid email format | All | Default: `demo@fms.com` |
| 2 | Password | `password` | text (password) | Yes | Yes | Min length 1 | All | Default: `demo123` |
| 3 | Demo Role Switcher | `selectedRole` | enum | Yes | Yes | `public`, `govt_official`, `manager`, `dept_user`, `admin` | All | Grouped: Government (govt_official), Administration (manager, admin) |
| 4 | Sign In (button) | — | action | — | — | — | All | Triggers login |
| 5 | Demo credentials hint | — | display | — | No | — | All | Static text: `demo@fms.com / demo123` |

---

## Section 3: DCC Dashboard (SCR_DASHBOARD)

### 3a: Page Header

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | User avatar / initials | `user.fullName[0]` | display | — | No | — | All | Opens profile drawer |
| 2 | User full name | `user.fullName` | display | — | No | — | All | Shown in header |
| 3 | User role label | `user.role` | display | — | No | ROLE_LABELS mapping | All | e.g. "Estate Manager" |
| 4 | Logout (button) | — | action | — | — | — | All | Navigates to login |

### 3b: Main Tabs

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Dashboard | `mainTab: 'dashboard'` | tab | — | — | — | All | Default tab |
| 2 | Reports / MIS | `mainTab: 'reports'` | tab | — | — | — | manager, admin | Only for managers/admins |

### 3c: KPI Summary Cards

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Total Demands | `summary.total_paid` count / `tiles.length` | number | — | No | INR formatted | All | KPI card with icon |
| 2 | Total Paid | `summary.total_paid` | number (INR) | — | No | INR formatted | All | KPI card |
| 3 | Total Due | `summary.total_due` | number (INR) | — | No | INR formatted | All | KPI card |
| 4 | Total Overdue | `summary.total_overdue` | number (INR) | — | No | INR formatted | All | KPI card |
| 5 | Collection Rate | `collectionRate` | number (%) | — | No | Calculated: `(total_paid / total_amount) * 100` | All | KPI card |

### 3d: DP Filter Ribbon (All / Paid / Due / Overdue)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | All | `dpFilter: 'ALL'` | filter chip | — | Yes | — | All | Shows all demands |
| 2 | Paid | `dpFilter: 'PAID'` | filter chip | — | Yes | — | All | Filters to PAID status |
| 3 | Due | `dpFilter: 'DUE'` | filter chip | — | Yes | — | All | Filters to DUE status |
| 4 | Overdue | `dpFilter: 'OVERDUE'` | filter chip | — | Yes | — | All | Filters to OVERDUE status |
| 5 | Collection Rate | `dpFilter: 'RATE'` | filter chip | — | Yes | — | All | Shows rate view |

### 3e: Sub-DP Breakdown Ribbon

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Demand type label | `demand_type_label` or `demand_type_code` | display | — | No | — | All | One chip per demand type |
| 2 | Count | `breakdown[type].count` | number | — | No | — | All | Count of demands in that type |
| 3 | Amount | `breakdown[type].amount` | number (INR) | — | No | INR formatted | All | Sum amount for that type |

### 3f: View Mode Toggle

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Cards | `viewMode: 'card'` | toggle | — | Yes | — | All | Grid layout |
| 2 | Table | `viewMode: 'table'` | toggle | — | Yes | — | All | Table layout |
| 3 | List | `viewMode: 'list'` | toggle | — | Yes | — | All | Compact list (default) |

### 3g: Demand List Record (per row)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Object icon | `object_type` | display (icon) | — | No | Car, Home, Building, Loan, FileText, Landmark | All | Icon based on object type |
| 2 | Object | `object_description` or `object_ref` | display | — | No | — | All | Truncated with tooltip |
| 3 | Client | `owner_name` | display | — | No | — | All | Owner name |
| 4 | Run # | `run_number` | display | — | No | `RUN-###` format | All | Padded to 3 digits |
| 5 | Run Date | `demand_run_date` | display (date) | — | No | DD/MM/YYYY | All | Short date format |
| 6 | Due Date | `due_date` | display (date) | — | No | DD/MM/YYYY | All | Red if overdue |
| 7 | Base Amt | `total_amount` | display (INR) | — | No | INR formatted | All | Total demand amount |
| 8 | GST | `gst_amount` | display (INR) | — | No | INR or — | All | Only if `include_gst` and amount > 0 |
| 9 | Late Fee | `overdue_amount` | display (INR) | — | No | INR or — | All | Red if > 0 |
| 10 | Payable | `amount_due` | display (INR) | — | No | INR formatted | All | Red if > 0, green if 0 |
| 11 | Object Type badge | `object_type` | display (badge) | — | No | — | All | Small badge |
| 12 | Status badge | `status` | display (badge) | — | No | DUE / OVERDUE / PAID / EXEMPTED | All | With overdue days if applicable |
| 13 | Demand Type badge | `demand_type_label` | display (badge) | — | No | Color-coded by code | All | Small pill |
| 14 | Chat (button) | — | action | — | — | — | manager, admin | Opens chat panel |
| 15 | Edit (button) | — | action | — | — | — | manager, admin | Opens edit if run not approved |
| 16 | View Demand (button) | — | action | — | — | — | All | Opens demand detail modal |

---

## Section 4: Dashboard Filter Modal (SCR_DCC_FILTER)

### 4a: Region & Group Filter

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Region / State | `regions[]` | multi-select | No | Yes | Derived from tiles | All | Checkbox per region |
| 2 | Demands (per region) | `activeDemands` | number (display) | — | No | — | All | Computed from tiles |
| 3 | Total Value (per region) | `totalValue` | number (INR display) | — | No | — | All | Computed from tiles |
| 4 | Avg Due % | `avgDuePct` | number (%) display | — | No | — | All | Computed from tiles |
| 5 | Overdue (per region) | `overdueCount` | number display | — | No | — | All | Computed from tiles |
| 6 | Select / Selected | — | action | — | — | — | All | Toggle region selection |

### 4b: Object Type & Demand Type Filter

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Object Types | `objectTypes[]` | multi-select chips | No | Yes | Derived from tiles | All | Toggle chips |
| 2 | Demand Types | `demandTypeCodes[]` | multi-select chips | No | Yes | From `dcc_demand_types` | All | Select All / Clear All buttons |

### 4c: Owner & Transaction Date Filters

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Target Object Owner | `ownerIds[]` | multi-select dropdown | No | Yes | From `dcc_object_owners` | All | Searchable dropdown |
| 2 | Status | `statuses[]` | multi-select chips | No | Yes | DUE, OVERDUE, PAID, EXEMPTED | All | Toggle chips |
| 3 | Demand Run Date Range | `runDateFrom`, `runDateTo` | date range | No | Yes | This Month / Last Quarter / YTD / Custom | All | Preset + custom date pickers |
| 4 | Payment Date Range | `payDateFrom`, `payDateTo` | date range | No | Yes | This Month / Last Quarter / YTD / Custom | All | Preset + custom date pickers |

### 4d: Filter Actions

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Reset | — | action | — | — | — | All | Clears all filters |
| 2 | Search Now | — | action | — | — | — | All | Applies filters and closes modal |
| 3 | Active filter count | `countActiveFilters` | number display | — | No | — | All | Shown as badge on filter button |

---

## Section 5: Demand Rule Setup (SCR_RULE_SETUP)

### 5a: Rule List & Search

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Search | `search` | text input | No | Yes | Free text | manager, admin | Searches object type, owner name, demand type label, transaction type |
| 2 | Transaction Type Filter | `filterType` | select | No | Yes | ALL + PayableTransactionType values | manager, admin | Dropdown filter |
| 3 | Filter (button) | — | action | — | — | — | manager, admin | Opens rule filter modal |
| 4 | New Rule (button) | — | action | — | — | — | manager, admin | Opens blank form |
| 5 | Rule Number | `rule_number` | display | — | No | `R###` format | manager, admin | Padded to 3 digits |
| 6 | Transaction Type | `payable_transaction_type` | display | — | No | PAYABLE_TRANSACTION_TYPE_LABELS | manager, admin | Label |
| 7 | Object Type | `object_type` | display | — | No | PROPERTY, QUARTER, CAR, etc. | manager, admin | Badge |
| 8 | Owner | `object_owner_id` → owner name | display | — | No | — | manager, admin | Resolved from owners list |
| 9 | Demand Type | `demand_type_id` → label | display | — | No | — | manager, admin | Resolved from demand types |
| 10 | Source | `import_source` | display (badge) | — | No | TPA, EXCEL, AUTO, MANUAL | manager, admin | Color-coded badge |
| 11 | Active | `is_active` | display (toggle) | — | Yes (toggle) | Active / Inactive | manager, admin | Toggle button |
| 12 | Delete (button) | — | action | — | — | — | manager, admin | Confirm dialog |
| 13 | Select (row click) | — | action | — | — | — | manager, admin | Loads rule into form |

### 5b: Basic Information Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Dept | `dept` | text | Yes | Yes | Default: `DCC` | manager, admin | — |
| 2 | Subdept | `subdept` | text | No | Yes | — | manager, admin | — |
| 3 | Module ID | `module_id` | text | Yes | Yes | Default: `DCC` | manager, admin | — |
| 4 | Location | `location` | text | No | Yes | — | manager, admin | — |
| 5 | Grade / Designation | `grade_designation` | text | Yes | Yes | Default: `ALL` | manager, admin | — |
| 6 | Payable Transaction Type | `payable_transaction_type` | select | Yes | Yes | PP, TPF, EMD, SD, RENT, LEASE, MAINT, LOAN, PURCHASE, TAX, INSURANCE | manager, admin | Dropdown |
| 7 | First BTM Run Date | `first_btm_run_date` | date | No | Yes | DD/MM/YYYY | manager, admin | — |
| 8 | Subsequent BTM Run Day | `subsequent_btm_run_day` | text | Yes | Yes | Default: `1` | manager, admin | — |
| 9 | Next Run Date | `next_run_date` | date | No | Yes | DD/MM/YYYY | manager, admin | — |
| 10 | Available Payment Modes | `available_payment_modes` | multi-select | Yes | Yes | EPAY, MANUAL, SALARY_ADJUSTED, CHEQUE, DD, ONLINE | manager, admin | Toggle chips |
| 11 | Include GST | `include_gst` | boolean | Yes | Yes | Yes / No toggle | manager, admin | — |
| 12 | Is Active | `is_active` | boolean | Yes | Yes | Yes / No toggle | manager, admin | — |
| 13 | Demand Type | `demand_type_id` | select | No | Yes | From `dcc_demand_types` | manager, admin | Dropdown |
| 14 | Object Type | `object_type` | select | No | Yes | PROPERTY, QUARTER, CAR, LOAN, ASSET, OTHER | manager, admin | Dropdown |
| 15 | Object Owner | `object_owner_id` | select | No | Yes | From `dcc_object_owners` | manager, admin | Dropdown |
| 16 | Import Source | `import_source` | select | No | Yes | TPA, EXCEL, AUTO, MANUAL | manager, admin | Dropdown |
| 17 | Generation Frequency Code | `generation_frequency_code` | select | Yes | Yes | 1–30 (Monthly), 41–47 (Daily), 51–57 (Weekly), 70 (Fortnightly), 75 (Quarterly), 80–81 (Yearly), 89 (Fixed), 95 (Instalment), 98–99 (Ad hoc) | manager, admin | Dropdown with grouped options |
| 18 | Default Demand Amount | `default_demand_amount` | number | No | Yes | INR | manager, admin | — |
| 19 | Default GST % | `default_gst_pct` | number | No | Yes | Percentage | manager, admin | — |
| 20 | Due Date Reference | `due_date_reference` | select | No | Yes | TPA, Run, Next | manager, admin | Dropdown |
| 21 | Grace Period Days | `grace_period_days` | number | Yes | Yes | Default: 0 | manager, admin | — |
| 22 | TPA URL ID | `tpa_url_id` | text | No | Yes | — | manager, admin | — |

### 5c: Full Payment Spec Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Reference Date | `full_payment_spec.reference_date` | select | Yes | Yes | payable_generation_date, allotment_submitted_date, allotted_date, accepted_date, handover_date, calendar_year_beginning, fiscal_year_beginning | manager, admin | Dropdown |
| 2 | Days Offset | `full_payment_spec.days_offset` | number | Yes | Yes | Default: 0 | manager, admin | — |

### 5d: Discount Slabs (5 rows within Full Payment Spec)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Days Offset | `discount_slabs[i].days_offset` | number | Yes | Yes | — | manager, admin | Per slab row |
| 2 | Discount % | `discount_slabs[i].discount_pct` | number | Yes | Yes | Percentage | manager, admin | Per slab row |
| 3 | Discount Amount | `discount_slabs[i].discount_amount` | number | Yes | Yes | INR | manager, admin | Per slab row |
| 4 | Applicable Days | `discount_slabs[i].applicable_days` | number | Yes | Yes | — | manager, admin | Per slab row |

### 5e: Advance Spec Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Advance Type | `advance_spec.advance_type` | select | Yes | Yes | PERCENTAGE, AMOUNT | manager, admin | — |
| 2 | Advance Value | `advance_spec.advance_value` | number | Yes | Yes | — | manager, admin | — |
| 3 | Reference Date | `advance_spec.reference_date` | select | Yes | Yes | Same as full payment spec | manager, admin | — |
| 4 | Days Offset | `advance_spec.days_offset` | number | Yes | Yes | Default: 0 | manager, admin | — |

### 5f: Installment Spec Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Installment Type | `installment_spec.installment_type` | select | Yes | Yes | PERCENTAGE, AMOUNT | manager, admin | — |
| 2 | Installment Value | `installment_spec.installment_value` | number | Yes | Yes | — | manager, admin | — |
| 3 | Reference Date | `installment_spec.reference_date` | select | Yes | Yes | Same as full payment spec | manager, admin | — |
| 4 | Days Offset | `installment_spec.days_offset` | number | Yes | Yes | Default: 0 | manager, admin | — |
| 5 | Instalment Mode | `installment_spec.instalment_mode` | select | Yes | Yes | AUTO_CALC, MANUAL_LINES | manager, admin | — |
| 6 | Instalment Count | `installment_spec.instalment_count` | number | No | Yes | Null = auto-calculate | manager, admin | — |
| 7 | Interval Days | `installment_spec.interval_days` | number | Yes | Yes | Default: 30 | manager, admin | — |
| 8 | Default Interest % | `installment_spec.default_interest_pct` | number | Yes | Yes | Default: 0 | manager, admin | — |
| 9 | Default Defaulted Interest % | `installment_spec.default_defaulted_interest_pct` | number | Yes | Yes | Default: 0 | manager, admin | — |

### 5g: Instalment Lines (within Installment Spec, manual mode)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Seq | `instalment_lines[i].seq` | number | Yes | Yes | Sequential | manager, admin | — |
| 2 | Amount | `instalment_lines[i].amount` | number | Yes | Yes | INR | manager, admin | — |
| 3 | Due Date Reference | `instalment_lines[i].due_date_reference` | select | Yes | Yes | Same reference dates | manager, admin | — |
| 4 | Days Offset | `instalment_lines[i].days_offset` | number | Yes | Yes | — | manager, admin | — |
| 5 | Interest % | `instalment_lines[i].interest_pct` | number | Yes | Yes | — | manager, admin | — |
| 6 | Defaulted Interest % | `instalment_lines[i].defaulted_interest_pct` | number | Yes | Yes | — | manager, admin | — |

### 5h: Penalty Slabs (5 rows)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Slab Row | `penalty_slabs[i].slab_row` | number | Yes | No | 1–5 | manager, admin | Auto-assigned |
| 2 | Penalty Type | `penalty_slabs[i].penalty_type` | select | Yes | Yes | PERCENTAGE, AMOUNT | manager, admin | — |
| 3 | Penalty Value | `penalty_slabs[i].penalty_value` | number | Yes | Yes | — | manager, admin | — |
| 4 | Late Days | `penalty_slabs[i].late_days` | number | Yes | Yes | — | manager, admin | — |
| 5 | Interest % | `penalty_slabs[i].interest_pct` | number | Yes | Yes | — | manager, admin | — |
| 6 | Defaulted Interest % | `penalty_slabs[i].defaulted_interest_pct` | number | Yes | Yes | — | manager, admin | — |

### 5i: Alert Spec Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Days Before Due | `alert_spec.days_before_due` | number | Yes | Yes | Default: 7 | manager, admin | — |
| 2 | Message Hook | `alert_spec.message_hook` | text | No | Yes | — | manager, admin | — |

### 5j: Increase Spec Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Increase After Months | `increase_spec.increase_after_months` | number | Yes | Yes | Default: 12 | manager, admin | — |
| 2 | Increase % | `increase_spec.increase_pct` | number | Yes | Yes | — | manager, admin | — |
| 3 | Increase Min | `increase_spec.increase_min` | number | No | Yes | — | manager, admin | — |
| 4 | Increase Max | `increase_spec.increase_max` | number | No | Yes | — | manager, admin | — |
| 5 | Alert Message Hook | `increase_spec.alert_message_hook` | text | No | Yes | — | manager, admin | — |

### 5k: Instalment Grid (per row)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Object ID | `instalment_grid[i].object_id` | select | No | Yes | From objects list | manager, admin | — |
| 2 | Instalment Seq | `instalment_grid[i].instalment_seq` | number | Yes | Yes | Sequential | manager, admin | — |
| 3 | Instalment Date | `instalment_grid[i].instalment_date` | date | No | Yes | DD/MM/YYYY | manager, admin | — |
| 4 | Instalment Amount | `instalment_grid[i].instalment_amount` | number | Yes | Yes | INR | manager, admin | — |
| 5 | Next Run Date | `instalment_grid[i].next_run_date` | date | No | Yes | DD/MM/YYYY | manager, admin | — |

### 5l: Collection Exceptions (per row)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Exception Type | `collection_exceptions[i].exception_type` | display (badge) | Yes | No | Installment, Discount, Penalty, Alert | manager, admin | Fixed per row |
| 2 | Seq No | `collection_exceptions[i].seq_no` | number | Yes | No | Sequential | manager, admin | — |
| 3 | Slab Min | `collection_exceptions[i].demand_slab_min` | number | No | Yes | Placeholder: "Slab Min" | manager, admin | — |
| 4 | Slab Max | `collection_exceptions[i].demand_slab_max` | number | No | Yes | Placeholder: "Slab Max" | manager, admin | — |
| 5 | Offset Days | `collection_exceptions[i].offset_days` | number | No | Yes | Placeholder: "Offset Days" | manager, admin | — |
| 6 | App % | `collection_exceptions[i].applicable_pct` | number | No | Yes | Placeholder: "App %" | manager, admin | — |
| 7 | Pct Basis | `collection_exceptions[i].pct_basis` | select | Yes | Yes | Daily, Monthly, Yearly | manager, admin | Dropdown |
| 8 | Min | `collection_exceptions[i].pct_min` | number | No | Yes | Placeholder: "Min" | manager, admin | — |
| 9 | Max | `collection_exceptions[i].pct_max` | number | No | Yes | Placeholder: "Max" | manager, admin | — |
| 10 | Actual Amt | `collection_exceptions[i].actual_amount` | number | No | Yes | Placeholder: "Actual Amt" | manager, admin | — |
| 11 | Hook | `collection_exceptions[i].message_hook` | text | No | Yes | Placeholder: "Hook" | manager, admin | — |
| 12 | Remove (button) | — | action | — | — | — | manager, admin | Deletes exception row |

### 5m: Form Actions

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Save | — | action | — | — | — | manager, admin | Creates or updates rule |
| 2 | Cancel / Close | — | action | — | — | — | manager, admin | Closes form |

---

## Section 6: Rule Filter Modal (SCR_RULE_FILTER)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Object Types | `objectTypes[]` | multi-select chips | No | Yes | Derived from records | manager, admin | — |
| 2 | Import Sources | `importSources[]` | multi-select chips | No | Yes | AUTO, TPA, EXCEL, MANUAL | manager, admin | — |
| 3 | Demand Types | `demandTypeIds[]` | multi-select chips | No | Yes | From `dcc_demand_types` | manager, admin | — |
| 4 | Object Owner | `ownerIds[]` | multi-select dropdown | No | Yes | From `dcc_object_owners` | manager, admin | Searchable |
| 5 | Active Status | `activeOnly` | chip toggle | No | Yes | Active, Inactive | manager, admin | Single-select |
| 6 | GST | `includeGst` | chip toggle | No | Yes | GST Applied, No GST | manager, admin | Single-select |
| 7 | Reset | — | action | — | — | — | manager, admin | Clears all |
| 8 | Apply Filters | — | action | — | — | — | manager, admin | Applies and closes |

---

## Section 7: Demand Generation (SCR_DEMAND_GEN)

### 7a: Auto-Generate Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Run Date | `autoRunDate` | date | Yes | Yes | Default: today | manager, admin | — |
| 2 | Rule selection | `selectedRuleIds` | multi-select (checkboxes) | Yes | Yes | Active DCC rules only | manager, admin | One row per rule |
| 3 | Rule # | `rule_number` | display | — | No | `R###` format | manager, admin | Per rule row |
| 4 | Transaction Type | `payable_transaction_type` | display | — | No | Label from labels map | manager, admin | Per rule row |
| 5 | Object Type | `object_type` | display | — | No | — | manager, admin | Per rule row |
| 6 | Demand Type | `demand_type_id` → label | display | — | No | — | manager, admin | Per rule row |
| 7 | Amount | `autoAmount[ruleId]` | number | Yes | Yes | INR, default from rule | manager, admin | Editable per rule |
| 8 | Generate (button) | — | action | — | — | — | manager, admin | Triggers auto-generation |
| 9 | Created count | `success.created` | number display | — | No | — | manager, admin | After generation |
| 10 | Total amount | `success.totalAmount` | number (INR) display | — | No | — | manager, admin | After generation |

### 7b: Run History Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Run Number | `run_number` | display | — | No | `RUN-###` | manager, admin | — |
| 2 | Run Date | `run_date` | display (date) | — | No | DD/MM/YYYY | manager, admin | — |
| 3 | Source | `source` | display (badge) | — | No | TPA, EXCEL, AUTO, MANUAL | manager, admin | Color-coded |
| 4 | Demand Types | `runDemandTypesMap` | display (badges) | — | No | Multiple badges | manager, admin | Hover for all |
| 5 | Rule Numbers | `runRuleIdsMap` | display (badge) | — | No | `R###, R###` | manager, admin | — |
| 6 | Approval Status | `approval_status` | display (badge) | — | No | PENDING, APPROVED, AMENDED | manager, admin | Color-coded |
| 7 | Records Created | `records_created` | number display | — | No | — | manager, admin | — |
| 8 | Total Amount | `total_amount` | number (INR) display | — | No | INR | manager, admin | — |
| 9 | Duration | `duration_ms` | display | — | No | ms / s / m s format | manager, admin | — |
| 10 | Records Failed | `records_failed` | number display | — | No | — | manager, admin | — |
| 11 | Started At | `started_at` | display (datetime) | — | No | DD/MM/YYYY HH:MM | manager, admin | — |
| 12 | Ended At | `ended_at` | display (datetime) | — | No | DD/MM/YYYY HH:MM | manager, admin | — |
| 13 | View Details (button) | — | action | — | — | — | manager, admin | Opens run detail modal |
| 14 | Refresh (button) | — | action | — | — | — | manager, admin | Reloads history |

### 7c: Run Detail Modal (within Demand Generation)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Status filter | `statuses[]` | multi-select chips | No | Yes | DUE, OVERDUE, PAID, EXEMPTED | manager, admin | Filter within run |
| 2 | Search | `searchText` | text input | No | Yes | Free text | manager, admin | Search within run |
| 3 | Demand rows | `runDetails[logId]` | list display | — | No | DemandListRecord rows | manager, admin | Same fields as dashboard demand records |

---

## Section 8: Run History Filter Modal (SCR_RUN_FILTER)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Import Source | `source` | chip single-select | No | Yes | AUTO, TPA, EXCEL, MANUAL | manager, admin | — |
| 2 | Demand Types | `demandTypeId` | chip single-select | No | Yes | From `dcc_demand_types` | manager, admin | — |
| 3 | From | `dateFrom` | date | No | Yes | DD/MM/YYYY | manager, admin | Run date range start |
| 4 | To | `dateTo` | date | No | Yes | DD/MM/YYYY | manager, admin | Run date range end |
| 5 | Search by object reference | `objectRef` | text | No | Yes | Free text | manager, admin | Searches object_ref in run details |
| 6 | Reset | — | action | — | — | — | manager, admin | — |
| 7 | Apply Filters | — | action | — | — | — | manager, admin | — |

---

## Section 9: Demand Detail Modal (SCR_DEMAND_DETAIL)

### 9a: Header

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Object description / ref | `object_description` or `object_ref` | display | — | No | — | All | Title |
| 2 | Status badge | `status` | display (badge) | — | No | DCC_STATUS styling | All | Color-coded |
| 3 | Owner name | `owner_name` | display | — | No | — | All | Subtitle |
| 4 | Close (button) | — | action | — | — | — | All | Closes modal |

### 9b: Tabs

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Demand Due | `activeTab: 'demand_due'` | tab | — | — | — | All | Default for non-LOAN types |
| 2 | Instalment | `activeTab: 'installments'` | tab | — | — | — | All | Default for LOAN type |
| 3 | Paid History | `activeTab: 'paid_history'` | tab | — | — | — | All | Default if fully paid |
| 4 | Dispute | `activeTab: 'dispute'` | tab | — | — | — | All | Raise/view disputes |

### 9c: Object & Owner Summary Panel

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Object Ref | `object_ref` | display | — | No | — | All | — |
| 2 | Object Description | `object_description` | display | — | No | — | All | — |
| 3 | Object Type | `object_type` | display | — | No | — | All | — |
| 4 | Region | `region` | display | — | No | — | All | — |
| 5 | Group | `group_name` | display | — | No | — | All | — |
| 6 | Subgroup | `subgroup` | display | — | No | — | All | — |
| 7 | Owner Name | `owner_name` | display | — | No | — | All | — |
| 8 | Contact | `owner_contact` | display | — | No | — | All | — |
| 9 | Address | `owner_address` | display | — | No | — | All | Combined address, city, state, pincode |
| 10 | Demand Type | `demand_type_label` | display (badge) | — | No | — | All | — |
| 11 | Total Amount | `total_amount` | display (INR) | — | No | INR | All | — |
| 12 | Amount Paid | `amount_paid` | display (INR) | — | No | INR | All | — |
| 13 | Amount Due | `amount_due` | display (INR) | — | No | INR | All | — |
| 14 | Overdue Amount | `overdue_amount` | display (INR) | — | No | INR | All | — |
| 15 | Due Date | `due_date` | display (date) | — | No | DD/MM/YYYY | All | — |
| 16 | Run Date | `demand_run_date` | display (date) | — | No | DD/MM/YYYY | All | — |
| 17 | Run Number | `run_number` | display | — | No | `RUN-###` | All | — |
| 18 | Include GST | `include_gst` | display | — | No | Yes / No | All | — |
| 19 | GST % | `gst_pct` | display | — | No | Percentage | All | — |
| 20 | GST Type | `gst_type` | display | — | No | inclusive / exclusive | All | — |
| 21 | GST Amount | `gst_amount` | display (INR) | — | No | INR | All | — |
| 22 | Interest % | `interest_pct` | display | — | No | Percentage | All | — |
| 23 | Defaulted Interest % | `defaulted_interest_pct` | display | — | No | Percentage | All | — |
| 24 | Is Amended | `is_amended` | display | — | No | Yes / No | All | — |

### 9d: Demand Due Tab — Bill Breakdown (Line Items)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Line item label | `ComputedLineItem.label` | display | — | No | e.g. "Base Rent", "CAM", "Electricity Charges" | All | Config from demandComponents matrix |
| 2 | Line item amount | `ComputedLineItem.amount` | display (INR) | — | No | INR | All | Calculated: `baseAmount * ratio` |
| 3 | Subtotal | `ComputedBill.subtotal` | display (INR) | — | No | INR | All | Sum of line items |
| 4 | Penalty / Late Fee | `ComputedBill.penalty` | display (INR) | — | No | INR | All | 2% of amount_due if overdue |
| 5 | Early Payment Discount | `ComputedBill.discount` | display (INR) | — | No | INR | All | 5% if ≥15 days early, 2.5% if ≥7 days |
| 6 | Already Paid | `ComputedBill.alreadyPaid` | display (INR) | — | No | INR | All | — |
| 7 | Net Payable | `ComputedBill.netPayable` | display (INR) | — | No | INR | All | `subtotal + penalty - discount - alreadyPaid` |
| 8 | Gross Demand | `ComputedBill.grossDemand` | display (INR) | — | No | INR | All | `subtotal + penalty` |

### 9e: Payment Form (Demand Due Tab)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Pay Amount | `payAmount` | number | Yes | Yes | INR, default = amount_due | manager, admin | — |
| 2 | Payment Mode | `payMode` | select | Yes | Yes | EPAY, MANUAL, SALARY_ADJUSTED, CHEQUE, DD, ONLINE | manager, admin | — |
| 3 | Payment Date | `payDate` | date | Yes | Yes | Default: today | manager, admin | — |
| 4 | Reference Number | `payRef` | text | No | Yes | — | manager, admin | — |
| 5 | Remarks | `payRemarks` | text | No | Yes | — | manager, admin | — |
| 6 | Pay (button) | — | action | — | — | — | manager, admin | Records payment |
| 7 | Bulk Pay (button) | — | action | — | — | — | manager, admin | Pay selected rows |

### 9f: Payment Modal (Unified — managers and demo)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Payment Method | `payModalMode` | select | Yes | Yes | UPI, NETBANKING, CARD, WALLET, CHEQUE | All | Icons per method |
| 2 | Amount | `payModalAmount` | number (INR) | Yes | No | INR | All | Pre-filled |
| 3 | Label | `payModalLabel` | display | — | No | e.g. "Installment 1", "Full Payment" | All | — |
| 4 | Reference Number | `payModalRef` | text | No | Yes | — | manager, admin | — |
| 5 | Remarks | `payModalRemarks` | text | No | Yes | — | manager, admin | — |
| 6 | Payment Date | `payModalDate` | date | Yes | Yes | Default: today | manager, admin | — |
| 7 | Processing step | `payModalStep: 'processing'` | display | — | No | Spinner | All (non-managers) | Simulated 2s delay |
| 8 | Done step | `payModalStep: 'done'` | display | — | No | Success check | All (non-managers) | — |
| 9 | Confirm Pay (button) | — | action | — | — | — | All | Managers record; others simulate |

### 9g: Installment Tab — Plan Form

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Start Date | `instStartDate` | date | Yes | Yes | Default: today | manager, admin | — |
| 2 | No of Installments | `instNumInstallments` | number | Yes | Yes | Min 1 | manager, admin | — |
| 3 | Late Fee | `instLateFee` | number | Yes | Yes | Default: 0 | manager, admin | — |
| 4 | Due Days with Late Fee | `instDueDaysLate` | number | Yes | Yes | Default: 0 | manager, admin | — |
| 5 | Interest % p.a. | `instInterestPct` | number | Yes | Yes | Default: 0.00 | manager, admin | — |
| 6 | Defaulted Interest % | `instDefaultedInterestPct` | number | Yes | Yes | Default: 0.00 | manager, admin | — |
| 7 | Discount Full Payment % | `instDiscountFullPct` | number | Yes | Yes | Default: 0.00 | manager, admin | — |
| 8 | GST % | `instGstPct` | number | Yes | Yes | Default: 0.00 | manager, admin | — |
| 9 | GST Type | `instGstType` | select | Yes | Yes | inclusive, exclusive | manager, admin | — |
| 10 | Create Plan (button) | — | action | — | — | — | manager, admin | Validates percentages = 100% |

### 9h: Installment Schedule Rows (editable)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Row Number | `row_number` | number | — | No | 0 = Full Payment, 1+ = installments | manager, admin | — |
| 2 | Label | `label` | display | — | No | "Full Payment" or "Installment N" | manager, admin | — |
| 3 | Percentage | `percentage` | number | Yes | Yes | Must total 100% | manager, admin | — |
| 4 | Amount | `amount` | number (INR) | Yes | Yes | INR, must total balance | manager, admin | — |
| 5 | Discount | `discount` | number (INR) | — | No | INR | manager, admin | Auto for full payment |
| 6 | Penalty | `penalty` | number (INR) | — | No | INR | manager, admin | Late fee per installment |
| 7 | GST Amount | `gst_amount` | number (INR) | — | No | INR | manager, admin | If exclusive type |
| 8 | Net Payable | `net_payable` | number (INR) | — | No | INR | manager, admin | `amount + gst - discount` |
| 9 | Due Date | `due_date` | date | Yes | Yes | DD/MM/YYYY | manager, admin | — |
| 10 | Due With Late Fee | `due_with_late_fee` | date | — | No | DD/MM/YYYY | manager, admin | If due days > 0 |
| 11 | Percentage total validation | `instPctTotal` | display | — | No | Must = 100% | manager, admin | — |
| 12 | Amount total validation | `instAmtTotal` | display | — | No | Must = balance | manager, admin | — |

### 9i: Installment Plan Display (saved plan)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | No of Installments | `no_of_installments` | display | — | No | — | All | — |
| 2 | Installment Start Date | `installment_start_date` | display (date) | — | No | DD/MM/YYYY | All | — |
| 3 | Late Fee | `late_fee` | display (INR) | — | No | INR | All | — |
| 4 | Due Days with Late Fee | `due_days_with_late_fee` | display | — | No | — | All | — |
| 5 | Interest % p.a. | `interest_pct_pa` | display | — | No | — | All | — |
| 6 | Defaulted Interest % | `defaulted_interest_pct` | display | — | No | — | All | — |
| 7 | Discount Full Payment % | `discount_full_payment_pct` | display | — | No | — | All | — |
| 8 | GST % | `gst_pct` | display | — | No | — | All | — |
| 9 | GST Type | `gst_type` | display | — | No | inclusive / exclusive | All | — |
| 10 | Balance Payment | `balance_payment` | display (INR) | — | No | INR | All | — |
| 11 | Installments Paid | `installments_paid` | display | — | No | — | All | — |
| 12 | Installments Due | `installments_due` | display | — | No | — | All | — |

### 9j: Installment Row Display (per row in saved plan)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Row Number | `row_number` | display | — | No | — | All | — |
| 2 | Label | `label` | display | — | No | — | All | — |
| 3 | Percentage | `percentage` | display | — | No | — | All | — |
| 4 | Amount | `amount` | display (INR) | — | No | INR | All | — |
| 5 | Due Date | `due_date` | display (date) | — | No | DD/MM/YYYY | All | — |
| 6 | Due Date With Late Fee | `due_date_with_late_fee` | display (date) | — | No | DD/MM/YYYY | All | — |
| 7 | Paid Date | `paid_date` | display (date) | — | No | DD/MM/YYYY | All | — |
| 8 | Paid Amount | `paid_amt` | display (INR) | — | No | INR | All | — |
| 9 | Remaining Amount | `remaining_amount` | display (INR) | — | No | INR | All | — |
| 10 | Status | `status` | display (badge) | — | No | PAID, DUE, PENDING, OVERDUE, EXEMPTED | All | — |
| 11 | Late Fee | `late_fee` | display (INR) | — | No | INR | All | — |
| 12 | GST Amount | `gst_amount` | display (INR) | — | No | INR | All | — |
| 13 | Interest % | `interest_pct` | display | — | No | — | All | — |
| 14 | Defaulted Interest % | `defaulted_interest_pct` | display | — | No | — | All | — |
| 15 | Pay (button) | — | action | — | — | — | All | Opens payment modal for this row |
| 16 | Row filter | `instRowFilter` | select | — | Yes | ALL, PENDING | All | — |

### 9k: Paid History Tab

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Amount | `amount` | display (INR) | — | No | INR | All | Per payment row |
| 2 | Payment Mode | `payment_mode` | display | — | No | EPAY, MANUAL, etc. | All | Per payment row |
| 3 | Payment Date | `payment_date` | display (date) | — | No | DD/MM/YYYY | All | Per payment row |
| 4 | Reference Number | `reference_number` | display | — | No | — | All | Per payment row |
| 5 | Remarks | `remarks` | display | — | No | — | All | Per payment row |
| 6 | Receipt Number | computed | display | — | No | Generated format | All | From `receiptNumber()` |
| 7 | Download Receipt (button) | — | action | — | — | — | All | Downloads receipt |

### 9l: Dispute Tab

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Dispute Date | `dispute_date` | date | Yes | Yes | Default: today | govt_official, manager, admin | — |
| 2 | Reason | `dispute_reason` | text | Yes | Yes | Free text | govt_official, manager, admin | — |
| 3 | Remarks | `dispute_remarks` | text | No | Yes | — | govt_official, manager, admin | — |
| 4 | Submit Dispute (button) | — | action | — | — | — | govt_official, manager, admin | — |

### 9m: Dispute History (per dispute entry)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Dispute Date | `dispute_date` | display (date) | — | No | DD/MM/YYYY | All | — |
| 2 | Reason | `reason` | display | — | No | — | All | — |
| 3 | Remarks | `remarks` | display | — | No | — | All | — |
| 4 | Author Name | `author_name` | display | — | No | — | All | — |
| 5 | Created At | `created_at` | display (datetime) | — | No | DD/MM/YYYY HH:MM | All | — |
| 6 | Row Number | `row_number` | display | — | No | — | All | Which installment row |

### 9n: Audit Log Panel

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Event Type | `event_type` | display (badge) | — | No | CREATED, AMENDED | All | — |
| 2 | Changed Fields | `changed_fields` | display (list) | — | No | Field label mapping via AUDIT_FIELD_LABELS | All | — |
| 3 | Old Values | `old_values` | display (JSON) | — | No | Formatted | All | — |
| 4 | New Values | `new_values` | display (JSON) | — | No | Formatted | All | — |
| 5 | Actor Label | `actor_label` | display | — | No | — | All | Who made the change |
| 6 | Created At | `created_at` | display (datetime) | — | No | DD/MM/YYYY HH:MM | All | — |

### 9o: Run Log Info (within demand detail)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Run Number | `runLog.run_number` | display | — | No | `RUN-###` | All | — |
| 2 | Run Date | `runLog.run_date` | display (date) | — | No | DD/MM/YYYY | All | — |
| 3 | Source | `runLog.source` | display | — | No | TPA, EXCEL, AUTO, MANUAL | All | — |
| 4 | Approval Status | `runLog.approval_status` | display | — | No | PENDING, APPROVED, AMENDED | All | — |
| 5 | Approved At | `runLog.approved_at` | display (datetime) | — | No | DD/MM/YYYY HH:MM | All | — |
| 6 | Approved By | `runLog.approved_by` | display | — | No | — | All | — |
| 7 | Amended At | `runLog.amended_at` | display (datetime) | — | No | DD/MM/YYYY HH:MM | All | — |
| 8 | Amended By | `runLog.amended_by` | display | — | No | — | All | — |

---

## Section 10: Profile (SCR_PROFILE)

### 10a: Profile Header Card

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Avatar (initials) | `user.fullName[0]` | display | — | No | — | All | — |
| 2 | Full Name | `user.fullName` | display | — | No | — | All | — |
| 3 | Department | `user.govtDepartment` | display | — | No | — | All | — |
| 4 | Employee ID | `user.govtEmployeeId` | display | — | No | `EMP: XXX` | All | — |
| 5 | SAP ID | `user.sapId` | display | — | No | `SAP: XXX` | All | — |
| 6 | Project Location | `user.projectLocation` | display | — | No | — | All | — |
| 7 | Role | `user.role` | display | — | No | ROLE_LABELS mapping | All | Shown in header |

### 10b: Personal Information Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Full Name | `user.fullName` | display (read-only) | — | No | — | All | HR-managed |
| 2 | Father's Name | `metadata.fatherName` | display (read-only) | — | No | — | All | HR-managed |
| 3 | Date of Birth | `metadata.dateOfBirth` | display (read-only) | — | No | DD/MM/YYYY | All | HR-managed |
| 4 | Social Category | `metadata.socialCategory` | display (read-only) | — | No | — | All | HR-managed |
| 5 | Physical Status | `metadata.physicalStatus` | display (read-only) | — | No | — | All | HR-managed |
| 6 | BHK Entitlement | `user.bhkEntitlement` | display (read-only) | — | No | — | All | HR-managed |
| 7 | Current Address | `metadata.currentAddress` | textarea | No | Yes | — | All | Editable |
| 8 | Permanent Address | `metadata.permanentAddress` | textarea | No | Yes | — | All | Editable |

### 10c: Employment Details Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Department | `user.govtDepartment` | display (read-only) | — | No | — | All | HR-managed |
| 2 | Employee ID | `user.govtEmployeeId` | display (read-only) | — | No | — | All | HR-managed |
| 3 | Project Location | `user.projectLocation` | display (read-only) | — | No | — | All | HR-managed |
| 4 | Date of Joining | `metadata.dateOfJoining` | display (read-only) | — | No | DD/MM/YYYY | All | HR-managed |
| 5 | Date of Retirement | `metadata.dateOfRetirement` | display (read-only) | — | No | DD/MM/YYYY | All | HR-managed |
| 6 | HRMS ID | `metadata.hrmsId` | display (read-only) | — | No | — | All | HR-managed |
| 7 | PF Number | `metadata.pfNumber` | display (read-only) | — | No | — | All | HR-managed |

### 10d: Identification Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | SAP ID | `user.sapId` | display (read-only) | — | No | — | All | — |
| 2 | Employee ID | `user.govtEmployeeId` | display (read-only) | — | No | — | All | — |
| 3 | Aadhaar Number | `metadata.aadhaarNumber` | text | No | Yes | `XXXX XXXX XXXX` | All | Editable |
| 4 | PAN Number | `metadata.panNumber` | text | No | Yes | `ABCDE1234F` | All | Editable |

### 10e: Contact Details Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Official Email | `user.email` | display (read-only) | — | No | — | All | — |
| 2 | Mobile Number | `user.phone` | text (tel) | No | Yes | 10-digit mobile | All | Editable |
| 3 | Alternate Phone | `metadata.alternatePhone` | text (tel) | No | Yes | — | All | Editable |
| 4 | Alternate Email | `metadata.alternateEmail` | text (email) | No | Yes | — | All | Editable |

### 10f: Family Details Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Total Family Members | `metadata.familyCount` | select | No | Yes | 0–10 | All | Dropdown |
| 2 | Number of Dependents | `metadata.numDependents` | select | No | Yes | 0–10 | All | Dropdown |
| 3 | Dependent: Relation | `dependents[i].relation` | select | No | Yes | Spouse, Son, Daughter, Father, Mother, Brother, Sister, Other | All | Per dependent |
| 4 | Dependent: Age | `dependents[i].age` | number | No | Yes | — | All | Per dependent |

### 10g: Family Member in Employment Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Is any family member employed? | `metadata.familyEmployeeActive` | boolean toggle | No | Yes | Yes / No | All | — |
| 2 | Relation | `familyEmployeeDetails.relation` | select | No | Yes | Same as RELATION_OPTIONS | All | If yes |
| 3 | Name | `familyEmployeeDetails.name` | text | No | Yes | — | All | If yes |
| 4 | Designation | `familyEmployeeDetails.designation` | text | No | Yes | — | All | If yes |
| 5 | Location / Region | `familyEmployeeDetails.location` | text | No | Yes | — | All | If yes |
| 6 | Employee ID | `familyEmployeeDetails.empId` | text | No | Yes | `EMP-XXXXXX` | All | If yes |
| 7 | Phone | `familyEmployeeDetails.phone` | text (tel) | No | Yes | — | All | If yes |

### 10h: Medical Grounds Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Requesting on medical grounds? | `metadata.medicalGrounds.required` | boolean toggle | No | Yes | Yes / No | All | — |
| 2 | Reason | `metadata.medicalGrounds.reason` | select | No | Yes | Critical Illness, Post-Surgery Recovery, Disability, Chronic Condition, Other | All | If yes |
| 3 | Affected Member | `metadata.medicalGrounds.member` | text | No | Yes | e.g. "Self / Spouse / Son…" | All | If yes |
| 4 | Remarks | `metadata.medicalGrounds.remarks` | textarea | No | Yes | — | All | If yes |
| 5 | Medical Certificate upload | `metadata.medicalDocPath` | file upload | No | Yes | PDF, JPG, PNG up to 5MB | All | Click to upload, replace, view |

### 10i: Service History Section

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Date of Joining | `serviceHistory[i].dateJoining` | display (date) | — | No | DD/MM/YYYY | All | Read-only table |
| 2 | Date of Transfer | `serviceHistory[i].dateTransfer` | display (date) | — | No | DD/MM/YYYY or "Present" | All | Read-only table |
| 3 | Designation | `serviceHistory[i].designation` | display | — | No | — | All | Read-only table |
| 4 | Region | `serviceHistory[i].region` | display | — | No | — | All | Read-only table |
| 5 | Pay Scale | `serviceHistory[i].payScale` | display | — | No | — | All | Read-only table |

### 10j: Profile Actions

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Save Changes | — | action | — | — | — | All | Saves editable fields |

---

## Section 11: Transaction Types Drawer (SCR_TXN_DRAWER)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Loan Installment | `code: 'LOAN'` | display card | — | — | Recurring loan repayment installments | All | Demo only |
| 2 | Insurance | `code: 'INSURANCE'` | display card | — | — | Premium collections for insurance policies | All | Demo only |
| 3 | Property Tax | `code: 'PROPERTY_TAX'` | display card | — | — | Annual or quarterly property tax demands | All | Demo only |
| 4 | Maintenance | `code: 'MAINTENANCE'` | display card | — | — | Routine maintenance and upkeep charges | All | Demo only |
| 5 | Rent | `code: 'RENT'` | display card | — | — | Monthly rent collection for leased assets | All | Demo only |
| 6 | Security Deposit | `code: 'SECURITY'` | display card | — | — | Refundable security deposit demands | All | Demo only |
| 7 | Selected indicator | `selectedCode` | display | — | — | Check icon | All | Visual feedback only |
| 8 | Close (button) | — | action | — | — | — | All | Closes drawer |

---

## Section 12: Reports / MIS Tab (SCR_REPORTS)

### 12a: Report Type Selector

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | By Demand Type | `reportType: 'by_type'` | select card | — | Yes | Aggregate totals grouped by demand type | manager, admin | — |
| 2 | By Owner | `reportType: 'by_owner'` | select card | — | Yes | Collection breakdown per object owner | manager, admin | — |
| 3 | Overdue Exceptions | `reportType: 'overdue'` | select card | — | Yes | Only demands past their due date | manager, admin | — |
| 4 | Detailed Ledger | `reportType: 'detailed'` | select card | — | Yes | Row-by-row demand ledger with all fields | manager, admin | — |

### 12b: Report Criteria Fields

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Run Date From | `criteria.runDateFrom` | date | No | Yes | DD/MM/YYYY | manager, admin | — |
| 2 | Run Date To | `criteria.runDateTo` | date | No | Yes | DD/MM/YYYY | manager, admin | — |
| 3 | Payment Date From | `criteria.payDateFrom` | date | No | Yes | DD/MM/YYYY | manager, admin | — |
| 4 | Payment Date To | `criteria.payDateTo` | date | No | Yes | DD/MM/YYYY | manager, admin | — |
| 5 | Demand Type | `criteria.demandTypeCode` | select | No | Yes | All Types + from `dcc_demand_types` | manager, admin | — |
| 6 | Object Type | `criteria.objectType` | select | No | Yes | All Objects + derived from data | manager, admin | — |
| 7 | Owner | `criteria.ownerId` | select | No | Yes | All Owners + from `dcc_object_owners` | manager, admin | — |
| 8 | Status | `criteria.status` | select | No | Yes | All Statuses + DUE, OVERDUE, PAID, EXEMPTED | manager, admin | — |

### 12c: Report Actions

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Generate Report (button) | — | action | — | — | — | manager, admin | — |
| 2 | Reset Criteria (button) | — | action | — | — | — | manager, admin | — |
| 3 | Export (button) | — | action | — | — | — | manager, admin | Exports as HTML |
| 4 | Schedule Report (button) | — | action | — | — | — | manager, admin | Opens schedule modal |
| 5 | Criteria toggle | — | action | — | — | — | manager, admin | Show/hide criteria panel |

### 12d: By Type Report Table

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Demand Type | `demand_type_label` | display | — | No | — | manager, admin | — |
| 2 | Count | `demand_count` | number display | — | No | — | manager, admin | — |
| 3 | Total Demand | `total_demand` | display (INR) | — | No | INR | manager, admin | — |
| 4 | Collected | `total_collected` | display (INR) | — | No | INR | manager, admin | — |
| 5 | Outstanding | `total_outstanding` | display (INR) | — | No | INR | manager, admin | — |
| 6 | Overdue | `overdue_amount` | display (INR) | — | No | INR | manager, admin | — |
| 7 | Total GST | `total_gst` | display (INR) | — | No | INR | manager, admin | — |
| 8 | Rate | `collection_rate` | display (%) | — | No | Color-coded: ≥75% green, ≥50% amber, <50% red | manager, admin | — |

### 12e: By Owner Report Table

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Owner | `owner_name` | display | — | No | — | manager, admin | — |
| 2 | Demands | `demand_count` | number display | — | No | — | manager, admin | — |
| 3 | Total Demand | `total_demand` | display (INR) | — | No | INR | manager, admin | — |
| 4 | Collected | `total_collected` | display (INR) | — | No | INR | manager, admin | — |
| 5 | Outstanding | `total_outstanding` | display (INR) | — | No | INR | manager, admin | — |
| 6 | Overdue | `overdue_amount` | display (INR) | — | No | INR | manager, admin | — |
| 7 | Total GST | `total_gst` | display (INR) | — | No | INR | manager, admin | — |

### 12f: Detailed Ledger Table

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Object Ref | `object_ref` | display | — | No | — | manager, admin | — |
| 2 | Owner | `owner_name` | display | — | No | — | manager, admin | — |
| 3 | Demand Type | `demand_type_label` | display | — | No | — | manager, admin | — |
| 4 | Total | `total_amount` | display (INR) | — | No | INR | manager, admin | — |
| 5 | Paid | `amount_paid` | display (INR) | — | No | INR | manager, admin | — |
| 6 | Due | `amount_due` | display (INR) | — | No | INR | manager, admin | — |
| 7 | GST | `gst_amount` | display (INR) | — | No | INR or — | manager, admin | — |
| 8 | Due Date | `due_date` | display (date) | — | No | DD/MM/YYYY | manager, admin | — |
| 9 | Status | `status` | display (badge) | — | No | Color-coded | manager, admin | — |

### 12g: Schedule Report Modal

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Report Name | `name` | text | Yes | Yes | Free text | manager, admin | — |
| 2 | Recurrence | `recurrence` | select | Yes | Yes | one-time, daily, weekly, monthly | manager, admin | — |
| 3 | Report Type | `report_type` | display | — | No | From current criteria | manager, admin | Read-only |
| 4 | Run Date | `runDate` | date | Yes | Yes | Default: tomorrow | manager, admin | — |
| 5 | Run Time | `runTime` | time | Yes | Yes | Default: 09:00 | manager, admin | — |
| 6 | Criteria Summary | — | display | — | No | — | manager, admin | Shows active criteria |
| 7 | Save Schedule (button) | — | action | — | — | — | manager, admin | — |

### 12h: Scheduled Reports List

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Report Name | `name` | display | — | No | — | manager, admin | — |
| 2 | Recurrence badge | `recurrence` | display (badge) | — | No | one-time, daily, weekly, monthly | manager, admin | — |
| 3 | Paused badge | `is_active` | display (badge) | — | No | "Paused" if inactive | manager, admin | — |
| 4 | Report Type | `report_type` | display | — | No | Label from REPORT_TYPES | manager, admin | — |
| 5 | Next Run Date & Time | `next_run_at` | display (datetime) | — | No | DD/MM/YYYY HH:MM | manager, admin | — |
| 6 | Last Run Date | `last_run_at` | display (date) | — | No | DD/MM/YYYY | manager, admin | — |
| 7 | Pause/Resume (button) | — | action | — | — | — | manager, admin | Toggles active |
| 8 | Delete (button) | — | action | — | — | — | manager, admin | — |

---

## Section 13: Demand Chat Panel (SCR_CHAT)

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Object description / ref | `tile.object_description` or `tile.object_ref` | display | — | No | — | manager, admin | Chat header |
| 2 | Status badge | `tile.status` | display (badge) | — | No | — | manager, admin | — |
| 3 | Owner name | `tile.owner_name` | display | — | No | — | manager, admin | — |
| 4 | Message (incoming/outgoing) | `msg.message` | display | — | No | — | manager, admin | Per message |
| 5 | Sender label | `msg.sender_role` | display | — | No | "Owner" for incoming | manager, admin | — |
| 6 | Timestamp | `msg.created_at` | display | — | No | HH:MM | manager, admin | Per message |
| 7 | Delivery mode | `msg.delivery_mode` | display | — | No | IN_APP, EMAIL, SMS, WA | manager, admin | Per message |
| 8 | Date separator | `msg.created_at` (date) | display | — | No | DD/MM/YYYY | manager, admin | Between messages on different days |
| 9 | Delivery mode picker | `chatDeliveryModes` | multi-select | No | Yes | IN_APP, EMAIL, SMS, WA | manager, admin | ChatDeliveryModePicker component |
| 10 | Message input | `chatMsg` | textarea | No | Yes | Enter to send, Shift+Enter for newline | manager, admin | — |
| 11 | Send (button) | — | action | — | — | — | manager, admin | — |

---

## Section 14: Client-Wise View (SCR_CLIENT_VIEW)

### 14a: Client Card Layout

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Owner Name | `ownerName` | display | — | No | — | All | — |
| 2 | Overall Status | `overallStatus` | display (badge) | — | No | PAID, DUE, OVERDUE | All | — |
| 3 | Contact | `ownerContact` | display | — | No | — | All | — |
| 4 | Due Date range | `dueDateMin`–`dueDateMax` | display (date) | — | No | DD/MM/YYYY–DD/MM/YYYY | All | — |
| 5 | Total Demand | `totalDemand` | display (INR) | — | No | INR | All | — |
| 6 | Paid | `totalPaid` | display (INR) | — | No | INR | All | — |
| 7 | Penalty | `overdueAmount` | display (INR) | — | No | INR | All | — |
| 8 | Properties | `propertyCount` | number display | — | No | — | All | — |
| 9 | Outstanding | `totalOutstanding` | display (INR) | — | No | INR | All | — |
| 10 | Demand count | `demandCount` | number display | — | No | — | All | — |
| 11 | Collection % | `collectionPct` | display (%) | — | No | Calculated | All | — |
| 12 | View Objects (button) | — | action | — | — | — | All | Opens object summary |

### 14b: Client List Row Layout

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Owner initial avatar | `ownerName[0]` | display | — | No | — | All | — |
| 2 | Owner Name | `ownerName` | display | — | No | — | All | — |
| 3 | Contact | `ownerContact` | display | — | No | With phone icon | All | — |
| 4 | Props | `propertyCount` | number display | — | No | — | All | — |
| 5 | Demands | `demandCount` | number display | — | No | — | All | — |
| 6 | Run Date range | `runDateMin`–`runDateMax` | display (date) | — | No | — | All | — |
| 7 | Due Date range | `dueDateMin`–`dueDateMax` | display (date) | — | No | Red if overdue | All | — |
| 8 | Demand | `totalDemand` | display (INR) | — | No | INR | All | — |
| 9 | Paid | `totalPaid` | display (INR) | — | No | INR | All | — |
| 10 | Overdue | `overdueAmount` | display (INR) | — | No | INR, only if > 0 | All | — |
| 11 | Coll % | `collectionPct` | display (%) | — | No | — | All | — |
| 12 | Demand type badges | `demandTypes` | display (badges) | — | No | Up to 2 shown | All | — |
| 13 | Outstanding | `totalOutstanding` | display (INR) | — | No | INR, color-coded | All | — |
| 14 | View Object (button) | — | action | — | — | — | All | — |

### 14c: Client Table Layout

| # | Display Label | Internal Name | Type | Required | Editable | Options / Format | Role Visibility | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Client | `ownerName` | display | — | No | With initial avatar | All | — |
| 2 | Contact | `ownerContact` | display | — | No | — | All | — |
| 3 | Props | `propertyCount` | number display | — | No | — | All | — |
| 4 | Demands | `demandCount` | number display | — | No | — | All | — |
| 5 | Run Date | `runDateMin`–`runDateMax` | display (date) | — | No | — | All | — |
| 6 | Due Date | `dueDateMin`–`dueDateMax` | display (date) | — | No | Red if overdue | All | — |
| 7 | Total Demand | `totalDemand` | display (INR) | — | No | INR | All | — |
| 8 | Paid | `totalPaid` | display (INR) | — | No | INR | All | — |
| 9 | Overdue | `overdueAmount` | display (INR) | — | No | INR or — | All | — |
| 10 | Coll % | `collectionPct` | display (%) | — | No | — | All | — |
| 11 | Outstanding | `totalOutstanding` | display (INR) | — | No | INR | All | — |
| 12 | Status | `overallStatus` | display (badge) | — | No | PAID, DUE, OVERDUE | All | — |
| 13 | View (button) | — | action | — | — | — | All | — |

---

## Section 15: Shared Fields (used across multiple screens)

| # | Display Label | Internal Name | Type | Screens Used On | Notes |
|---|---|---|---|---|---|
| 1 | Owner Name | `owner_name` | display | Dashboard, Demand Detail, Client View, Reports, Chat | Resolved from `dcc_object_owners` |
| 2 | Object Ref | `object_ref` | display | Dashboard, Demand Detail, Client View, Reports | From `dcc_objects` |
| 3 | Object Description | `object_description` | display | Dashboard, Demand Detail, Chat | From `dcc_objects` |
| 4 | Object Type | `object_type` | display | Dashboard, Rule Setup, Reports, Filters | Badge |
| 5 | Demand Type Label | `demand_type_label` | display | Dashboard, Demand Detail, Reports, Filters | From `dcc_demand_types` |
| 6 | Demand Type Code | `demand_type_code` | display | Dashboard, Demand Detail | Used for badge styling |
| 7 | Status | `status` | display (badge) | Dashboard, Demand Detail, Reports, Client View | DUE/OVERDUE/PAID/EXEMPTED |
| 8 | Total Amount | `total_amount` | display (INR) | Dashboard, Demand Detail, Reports | — |
| 9 | Amount Paid | `amount_paid` | display (INR) | Dashboard, Demand Detail, Reports | — |
| 10 | Amount Due | `amount_due` | display (INR) | Dashboard, Demand Detail, Reports | Calculated: `amount - amount_paid` |
| 11 | Due Date | `due_date` | display (date) | Dashboard, Demand Detail, Reports | DD/MM/YYYY |
| 12 | Run Date | `demand_run_date` | display (date) | Dashboard, Demand Detail, Generation | DD/MM/YYYY |
| 13 | Run Number | `run_number` | display | Dashboard, Demand Detail, Generation | `RUN-###` |
| 14 | GST Amount | `gst_amount` | display (INR) | Dashboard, Demand Detail, Reports | — |
| 15 | Include GST | `include_gst` | boolean | Dashboard, Demand Detail, Rule Setup | — |
| 16 | GST % | `gst_pct` | number | Demand Detail, Rule Setup | — |
| 17 | GST Type | `gst_type` | enum | Demand Detail, Rule Setup | inclusive / exclusive |
| 18 | Region | `region` | display | Dashboard, Demand Detail, Filters | From `dcc_objects` |
| 19 | Group | `group_name` | display | Dashboard, Demand Detail | From `dcc_objects` |
| 20 | Subgroup | `subgroup` | display | Dashboard, Demand Detail | From `dcc_objects` |
| 21 | Owner Contact | `owner_contact` | display | Dashboard, Demand Detail, Client View | From `dcc_object_owners` |
| 22 | Owner Address | `owner_address` | display | Demand Detail, Client View | Combined: address, city, state, pincode |
| 23 | Overdue Amount | `overdue_amount` | display (INR) | Dashboard, Demand Detail, Client View | — |
| 24 | Avg Overdue Days | `avg_overdue_days` | number | Dashboard | Calculated |
| 25 | User Full Name | `user.fullName` | display | All screens (header) | — |
| 26 | User Role | `user.role` | display | All screens (header) | Via ROLE_LABELS |
| 27 | Interest % | `interest_pct` | number | Demand Detail, Installment | — |
| 28 | Defaulted Interest % | `defaulted_interest_pct` | number | Demand Detail, Installment | — |
| 29 | Is Amended | `is_amended` | boolean | Dashboard, Demand Detail | — |

---

## Section 16: Calculated and System-Managed Fields

| # | Field Name | Type | Screen | Calculation / Source | Notes |
|---|---|---|---|---|---|
| 1 | Collection Rate | number (%) | Dashboard | `(total_paid / total_amount) * 100` | Rounded |
| 2 | Amount Due | number (INR) | Dashboard, Demand Detail | `max(0, amount - amount_paid)` | — |
| 3 | Overdue Amount | number (INR) | Dashboard, Demand Detail | `status === 'OVERDUE' ? amount_due : 0` | — |
| 4 | Avg Overdue Days | number | Dashboard | `floor((today - due_date) / 86400000)` if OVERDUE | — |
| 5 | Early Payment Discount | number (INR) | Demand Detail | 5% if ≥15 days early, 2.5% if ≥7 days | Computed at payment time |
| 6 | Penalty / Late Fee | number (INR) | Demand Detail | `amount_due * 0.02` if overdue | 2% flat |
| 7 | Net Payable | number (INR) | Demand Detail | `subtotal + penalty - discount - alreadyPaid` | — |
| 8 | Gross Demand | number (INR) | Demand Detail | `subtotal + penalty` | — |
| 9 | Subtotal | number (INR) | Demand Detail | Sum of all line items | — |
| 10 | Line item amounts | number (INR) | Demand Detail | `baseAmount * ratio` per component | From demandComponents matrix |
| 11 | Collection % (client) | number (%) | Client View | `(totalPaid / totalDemand) * 100` | Per client group |
| 12 | Overall Status (client) | enum | Client View | OVERDUE if any, PAID if all paid, else DUE | Per client group |
| 13 | Run Number display | string | Multiple | `RUN-` + padded number | 3-digit padding |
| 14 | Rule Number display | string | Rule Setup, Generation | `R` + padded number | 3-digit padding |
| 15 | Receipt Number | string | Demand Detail | Generated by `receiptNumber()` | — |
| 16 | Sub-DP breakdown | Record | Dashboard | Per demand type: count + amount | — |
| 17 | Region stats | Record | Filter Modal | Per region: demands, value, due %, overdue | — |
| 18 | Next Run Date | date | Rule Setup | Computed from frequency code | Via `computeNextRunDate()` |
| 19 | Installment schedule rows | array | Demand Detail | Auto-generated from config | — |
| 20 | Percentage/amount totals | number | Installment Form | Sum validation | Must = 100% / balance |

---

## Appendix A: Database-Only Fields (Not Visible on Any Screen)

These columns exist in the database but are not displayed or editable in any current screen.

### A1: `dcc_demands`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `criteria_id` | uuid | YES | null | Links demand to its generating payable criteria rule | Used internally for rule linkage; not surfaced in UI |
| `generation_source` | text | NO | 'AUTO' | How the demand was generated (TPA/EXCEL/AUTO/MANUAL) | Shown on run log, not on individual demand |
| `run_log_id` | uuid | YES | null | Links to the run log that created this demand | Internal join key; not displayed on demand detail |

### A2: `dcc_demand_run_log`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `run_summary` | jsonb | YES | null | JSON summary of the run | Internal metadata; not rendered in UI |
| `demand_type_id` | uuid | YES | null | Demand type for this run | Shown via demand type badges, but column itself not directly displayed |

### A3: `dcc_object_owners`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `owner_type` | text | NO | 'PERSON' | PERSON or ORGANIZATION | Not displayed on any screen |
| `email` | text | YES | null | Owner email address | Not shown in any current view |
| `is_active` | boolean | NO | true | Whether owner is active | Not shown in UI |
| `created_at` | timestamptz | NO | now() | Record creation timestamp | System field |
| `updated_at` | timestamptz | NO | now() | Record update timestamp | System field |

### A4: `dcc_objects`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `details` | jsonb | YES | '{}' | Flexible JSON details per object type | Not rendered on any screen |
| `is_active` | boolean | NO | true | Whether object is active | Not shown in UI |
| `created_at` | timestamptz | NO | now() | Record creation timestamp | System field |
| `updated_at` | timestamptz | NO | now() | Record update timestamp | System field |

### A5: `dcc_demand_types`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `description` | text | YES | null | Long description of demand type | Not displayed (only label and code shown) |
| `is_active` | boolean | NO | true | Whether type is active | Not shown in UI |
| `created_at` | timestamptz | NO | now() | Record creation timestamp | System field |

### A6: `dcc_payments`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `object_id` | uuid | NO | null | Object the payment applies to | Used internally for joins; not shown in payment history display |

### A7: `dcc_installment_plans`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `installments_paid` | integer | NO | 0 | Count of paid installments | Shown as display but not as a separate editable field — system-maintained counter |
| `installments_due` | integer | NO | 0 | Count of due installments | Same as above |

### A8: `dcc_installment_rows`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `plan_id` | uuid | NO | null | Links to parent plan | Internal join key |
| `interest_pct` | numeric | YES | 0 | Per-row interest rate | Stored but not individually displayed per row |
| `defaulted_interest_pct` | numeric | YES | 0 | Per-row defaulted interest | Stored but not individually displayed per row |
| `created_at` | timestamptz | NO | now() | Record creation timestamp | System field |
| `updated_at` | timestamptz | NO | now() | Record update timestamp | System field |

### A9: `dcc_demand_chats`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `sender_role` | text | NO | — | Always 'manager' or 'owner' | Used for styling but not shown as a separate field label |

### A10: `dcc_demand_disputes`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `row_number` | integer | YES | null | Which installment row is disputed | Shown but only in dispute history context, not as a form field |

### A11: `dcc_demand_audit_log`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `actor_id` | uuid | YES | null | UUID of the user who made the change | Not displayed (only actor_label shown) |
| `demand_id` | uuid | NO | null | Links to the demand | Internal join key |

### A12: `dcc_report_schedules`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `user_id` | uuid | NO | null | User who created the schedule | Not displayed in the scheduled reports list |
| `criteria` | jsonb | YES | null | Stored filter criteria as JSON | Not displayed directly (summary shown instead) |

### A13: `payable_criteria_mt`

| Column | Data Type | Nullable | Default | Purpose | Why Not Shown |
|---|---|---|---|---|---|
| `created_by` | uuid | YES | null | User who created the rule | Not displayed in UI |
| `created_at` | timestamptz | NO | now() | Record creation timestamp | System field |
| `updated_at` | timestamptz | NO | now() | Record update timestamp | System field |
| `last_run_date` | date | YES | null | Last time this rule was run | Not shown in rule setup UI |
| `next_instalment_seq` | integer | YES | null | Next installment sequence number | Internal counter; not displayed |

### A14: Child Spec Tables (all)

These tables have `id`, `criteria_id`, `created_at`, and `updated_at` columns that are never shown in the UI:

| Table | Hidden Columns |
|---|---|
| `payable_full_payment_spec` | `id`, `criteria_id` |
| `payable_advance_spec` | `id`, `criteria_id` |
| `payable_installment_spec` | `id`, `criteria_id` |
| `payable_penalty_slab` | `id`, `criteria_id` |
| `payable_alert_spec` | `id`, `criteria_id` |
| `payable_increase_spec` | `id`, `criteria_id` |
| `payable_instalment_grid` | `id`, `criteria_id` |
| `payable_collection_exceptions` | `id`, `criteria_id` |
| `payable_instalment_lines` | `id`, `criteria_id` |

---

## Appendix B: Database Tables Without Dedicated Screens

These tables exist in the database but have no dedicated management screen:

| Table | Purpose | Current Access |
|---|---|---|
| `dcc_object_owners` | Stores object owners (clients) | Read-only via dropdowns/filters; no CRUD screen |
| `dcc_objects` | Stores demandable objects (properties, vehicles, etc.) | Read-only via demand displays; no CRUD screen |
| `dcc_demand_types` | Stores demand type catalog | Read-only via dropdowns/badges; no management screen |
| `dcc_demand_chats` | Stores demand chat messages | Written/read via chat panel but no admin/list view |
| `dcc_demand_disputes` | Stores dispute records | Written/read within demand detail but no standalone view |
| `dcc_demand_audit_log` | Stores audit trail | Read within demand detail but no admin/audit browser |
| `dcc_report_schedules` | Stores scheduled report configs | Managed within Reports tab but no dedicated admin screen |

---

*Document generated on 2026-10-12. This is a living reference — update when fields are added, removed, or changed.*
