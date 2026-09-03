export interface ChecklistItemTemplate {
  item_name: string;
  default_qty: number | null;
  qty_label: string | null;
}

export const CIVIL_CHECKLIST_ITEMS: ChecklistItemTemplate[] = [
  { item_name: 'Tap',                          default_qty: 4,    qty_label: 'Nos.' },
  { item_name: 'Wash basin complete',           default_qty: null, qty_label: null   },
  { item_name: 'Wash basin fittings with tap',  default_qty: null, qty_label: null   },
  { item_name: 'Fountain Shower',               default_qty: 1,    qty_label: 'No.'  },
  { item_name: 'Flusher',                       default_qty: 1,    qty_label: 'No.'  },
  { item_name: 'W.C. Pawn',                     default_qty: 1,    qty_label: 'No.'  },
  { item_name: 'Mirror',                        default_qty: null, qty_label: null   },
  { item_name: 'Mirror / Mirror stand',         default_qty: null, qty_label: null   },
  { item_name: 'Towel Stand',                   default_qty: null, qty_label: null   },
  { item_name: 'Brass stop cock',               default_qty: 1,    qty_label: 'No.'  },
  { item_name: 'Sea point',                     default_qty: 1,    qty_label: 'No.'  },
  { item_name: 'Water tank',                    default_qty: 1,    qty_label: 'No.'  },
  { item_name: 'Parade Rod',                    default_qty: null, qty_label: null   },
  { item_name: 'Wardrobe Rod',                  default_qty: null, qty_label: null   },
  { item_name: 'Central lock key',              default_qty: 3,    qty_label: 'Nos.' },
  { item_name: 'Door eye view',                 default_qty: 1,    qty_label: 'No.'  },
];

export const ELECTRICAL_CHECKLIST_ITEMS: ChecklistItemTemplate[] = [
  { item_name: 'Fan',                default_qty: 2,  qty_label: 'Nos.' },
  { item_name: 'Switch',             default_qty: 14, qty_label: 'Nos.' },
  { item_name: 'Plug point',         default_qty: 5,  qty_label: 'Nos.' },
  { item_name: 'Power plug point',   default_qty: 2,  qty_label: 'Nos.' },
  { item_name: 'Power plug switch',  default_qty: 2,  qty_label: 'Nos.' },
  { item_name: 'Tube light 4 feet',  default_qty: 2,  qty_label: 'Nos.' },
  { item_name: 'Tube light 2 feet',  default_qty: null, qty_label: null  },
  { item_name: 'Calling bell switch',default_qty: 1,  qty_label: 'No.'  },
  { item_name: 'Calling bell',       default_qty: 1,  qty_label: 'No.'  },
  { item_name: 'Light point',        default_qty: 8,  qty_label: 'No.'  },
  { item_name: 'Car shed',           default_qty: null, qty_label: null  },
  { item_name: 'Main switch',        default_qty: 1,  qty_label: 'No.'  },
  { item_name: 'Meter',              default_qty: 1,  qty_label: 'No.'  },
  { item_name: 'Meter reading',      default_qty: null, qty_label: null  },
  { item_name: 'Telephone',          default_qty: null, qty_label: null  },
  { item_name: 'Bulb head fitting',  default_qty: 1,  qty_label: 'No.'  },
  { item_name: 'Dimmer light',       default_qty: 1,  qty_label: 'No.'  },
];

export type ChecklistCategory = 'CIVIL' | 'ELECTRICAL';

export interface ChecklistItemDraft {
  category: ChecklistCategory;
  item_name: string;
  default_qty: number | null;
  actual_qty: number | null;
  qty_label: string | null;
  is_checked: boolean;
  remarks: string;
}

export function buildDefaultChecklist(): ChecklistItemDraft[] {
  return [
    ...CIVIL_CHECKLIST_ITEMS.map(t => ({
      category: 'CIVIL' as ChecklistCategory,
      item_name: t.item_name,
      default_qty: t.default_qty,
      actual_qty: t.default_qty,
      qty_label: t.qty_label,
      is_checked: false,
      remarks: '',
    })),
    ...ELECTRICAL_CHECKLIST_ITEMS.map(t => ({
      category: 'ELECTRICAL' as ChecklistCategory,
      item_name: t.item_name,
      default_qty: t.default_qty,
      actual_qty: t.default_qty,
      qty_label: t.qty_label,
      is_checked: false,
      remarks: '',
    })),
  ];
}
