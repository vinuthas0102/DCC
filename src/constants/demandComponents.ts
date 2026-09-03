// ── Demand Component Matrix ─────────────────────────────────────────────────
// Maps each (object_type, demand_type_code) combination to its specific
// line-item components. Each component has a key, label, and ratio (fraction
// of total_amount allocated to that component). The penalty/late-fee column
// is always added separately based on overdue status.

export interface DemandComponent {
  key: string;
  label: string;
  ratio: number;
}

export interface DemandComponentConfig {
  components: DemandComponent[];
  cadence: 'monthly' | 'single';
  /** Object-type display label for the bill header (e.g., "Property", "Vehicle") */
  objectLabel: string;
  /** Transaction-type display label for the bill header (e.g., "Rent", "Property Tax") */
  transactionLabel: string;
}

// ── Property / Quarter components ─────────────────────────────────────────────

const PROPERTY_RENT: DemandComponentConfig = {
  objectLabel: 'Property',
  transactionLabel: 'Rent',
  cadence: 'monthly',
  components: [
    { key: 'base_rent', label: 'Base Rent', ratio: 0.72 },
    { key: 'cam', label: 'Common Area Maintenance (CAM)', ratio: 0.10 },
    { key: 'water_utility', label: 'Water / Utility Charges', ratio: 0.10 },
    { key: 'parking', label: 'Parking Bay Charges', ratio: 0.08 },
  ],
};

const PROPERTY_TAX: DemandComponentConfig = {
  objectLabel: 'Property',
  transactionLabel: 'Property Tax',
  cadence: 'single',
  components: [
    { key: 'base_property_tax', label: 'Base Property Tax', ratio: 0.70 },
    { key: 'solid_waste_fee', label: 'Solid Waste User Fee', ratio: 0.08 },
    { key: 'urban_dev_cess', label: 'Urban Development Cess', ratio: 0.12 },
    { key: 'vacant_land_tax', label: 'Vacant Land Tax', ratio: 0.10 },
  ],
};

const PROPERTY_MAINTENANCE: DemandComponentConfig = {
  objectLabel: 'Property',
  transactionLabel: 'Maintenance',
  cadence: 'monthly',
  components: [
    { key: 'sinking_fund', label: 'Sinking Fund', ratio: 0.40 },
    { key: 'dg_power', label: 'DG Power Backup Fee', ratio: 0.35 },
    { key: 'security_upkeep', label: 'Security / Upkeep Charge', ratio: 0.25 },
  ],
};

// ── Vehicle / Car / Fleet components ──────────────────────────────────────────

const VEHICLE_RENT: DemandComponentConfig = {
  objectLabel: 'Vehicle',
  transactionLabel: 'Vehicle Rental',
  cadence: 'monthly',
  components: [
    { key: 'base_vehicle_rent', label: 'Base Vehicle Rental', ratio: 0.65 },
    { key: 'driver_allowance', label: 'Driver Allowance', ratio: 0.18 },
    { key: 'fastag_toll', label: 'Fastag / Toll Pass Charge', ratio: 0.07 },
    { key: 'mileage_excess', label: 'Mileage Excess Surcharge', ratio: 0.10 },
  ],
};

const VEHICLE_MAINTENANCE: DemandComponentConfig = {
  objectLabel: 'Vehicle',
  transactionLabel: 'Maintenance / Tax',
  cadence: 'single',
  components: [
    { key: 'scheduled_servicing', label: 'Scheduled Servicing Charge', ratio: 0.50 },
    { key: 'commercial_road_tax', label: 'Commercial Road Tax', ratio: 0.30 },
    { key: 'permit_renewal', label: 'Permit Renewal Fee', ratio: 0.20 },
  ],
};

// ── Equipment / Infrastructure / Machinery components ────────────────────────

const EQUIPMENT_RENT: DemandComponentConfig = {
  objectLabel: 'Equipment',
  transactionLabel: 'Hire / Rental',
  cadence: 'monthly',
  components: [
    { key: 'base_hire_rate', label: 'Base Hire Rate', ratio: 0.75 },
    { key: 'operator_fee', label: 'Operator Fee', ratio: 0.18 },
    { key: 'calibration', label: 'Calibration Charge', ratio: 0.07 },
  ],
};

// ── Generic fallbacks (for insurance, security deposit, advance, loan, etc.) ──

const GENERIC_SINGLE: DemandComponentConfig = {
  objectLabel: 'Asset',
  transactionLabel: 'Charge',
  cadence: 'single',
  components: [
    { key: 'amount', label: 'Total Amount', ratio: 1 },
  ],
};

const GENERIC_MONTHLY: DemandComponentConfig = {
  objectLabel: 'Asset',
  transactionLabel: 'Charge',
  cadence: 'monthly',
  components: [
    { key: 'amount', label: 'Monthly Amount', ratio: 1 },
  ],
};

// ── Loan instalment (special case) ────────────────────────────────────────────

const LOAN_INSTALMENT: DemandComponentConfig = {
  objectLabel: 'Property',
  transactionLabel: 'Loan Instalment',
  cadence: 'monthly',
  components: [
    { key: 'loan_instalment', label: 'Loan Instalment', ratio: 0.90 },
    { key: 'interest', label: 'Interest', ratio: 0.10 },
  ],
};

// ── Matrix lookup ─────────────────────────────────────────────────────────────

const isPropertyType = (objectType: string): boolean =>
  objectType === 'PROPERTY' || objectType === 'QUARTER';

const isVehicleType = (objectType: string): boolean =>
  objectType === 'VEHICLE' || objectType === 'CAR' || objectType === 'FLEET';

const isEquipmentType = (objectType: string): boolean =>
  objectType === 'EQUIPMENT' || objectType === 'MACHINERY' || objectType === 'INFRASTRUCTURE' || objectType === 'ASSET';

export const getDemandComponentConfig = (
  demandTypeCode: string,
  objectType: string,
): DemandComponentConfig => {
  const isProp = isPropertyType(objectType);
  const isVeh = isVehicleType(objectType);
  const isEquip = isEquipmentType(objectType);

  switch (demandTypeCode) {
    case 'RENT':
      if (isProp) return PROPERTY_RENT;
      if (isVeh) return VEHICLE_RENT;
      if (isEquip) return EQUIPMENT_RENT;
      return GENERIC_MONTHLY;

    case 'PROPERTY_TAX':
      return PROPERTY_TAX;

    case 'MAINTENANCE':
      if (isProp) return PROPERTY_MAINTENANCE;
      if (isVeh) return VEHICLE_MAINTENANCE;
      return GENERIC_MONTHLY;

    case 'LOAN':
      return LOAN_INSTALMENT;

    case 'INSURANCE':
    case 'SD':
    case 'ADVANCE':
      return GENERIC_SINGLE;

    default:
      return GENERIC_SINGLE;
  }
};

// ── Line-item computation ────────────────────────────────────────────────────

export interface ComputedLineItem {
  key: string;
  label: string;
  amount: number;
}

export interface ComputedBill {
  /** Asset line items (base + object-specific surcharges), before taxes/penalties */
  lineItems: ComputedLineItem[];
  /** Subtotal of all line items */
  subtotal: number;
  /** Penalty / late fee amount */
  penalty: number;
  /** Early payment discount amount */
  discount: number;
  /** Amount already paid */
  alreadyPaid: number;
  /** Net payable = subtotal + penalty - discount - alreadyPaid */
  netPayable: number;
  /** Gross demand = subtotal + penalty */
  grossDemand: number;
}

export const computeBill = (
  totalAmount: number,
  amountPaid: number,
  amountDue: number,
  isOverdue: boolean,
  discountAmount: number,
  config: DemandComponentConfig,
): ComputedBill => {
  const baseAmount = isOverdue ? amountDue : totalAmount;
  const lineItems: ComputedLineItem[] = config.components.map((c) => ({
    key: c.key,
    label: c.label,
    amount: Math.round(baseAmount * c.ratio),
  }));

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
  const penalty = isOverdue ? Math.round(amountDue * 0.02) : 0;
  const grossDemand = subtotal + penalty;
  const alreadyPaid = amountPaid;
  const netPayable = Math.max(0, grossDemand - discountAmount - alreadyPaid);

  return { lineItems, subtotal, penalty, discount: discountAmount, alreadyPaid, netPayable, grossDemand };
};
