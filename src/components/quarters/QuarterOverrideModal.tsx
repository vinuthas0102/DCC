import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Search, CheckCircle, ArrowLeftRight, Star, Home, Plus, Shuffle, SendHorizontal as SendHorizonal, ChevronDown, AlertTriangle, RotateCcw, Ban, ArrowRight, Info } from 'lucide-react';
import { quartersService, QuarterAllotment, QuarterRequest, Quarter } from '../../services/quartersService';
import { useUIStore } from '../../stores/uiStore';

import { getImage, fmtINR } from './quarterShared';

// ── Types ────────────────────────────────────────────────────────────────────

type ActionType =
  | 'assignPref'
  | 'assignAvailable'
  | 'swapRequests'
  | 'bPrefToA_APrefToB'
  | 'bPropToA_AvailToB'
  | 'bPropToA_NextCycle'
  | 'bPropToA_CancelB';

type RightPanelMode = 'prefs_a' | 'quarter_preview' | 'swap_preview' | 'prefs_b_plus_a' | 'avail_b_plus_a' | 'outcome_next_cycle' | 'outcome_cancel';

interface ActionMeta {
  key: ActionType;
  label: string;
  icon: React.ReactNode;
  desc: string;
  rightPanelMode: RightPanelMode;
  rightPanelTitle: string;
}

const ACTIONS: ActionMeta[] = [
  {
    key: 'assignPref',
    label: 'Assign a Preference to Requestor',
    icon: <Star size={14} />,
    desc: "Select one of Request A's saved preferences and allot that quarter. The currently allotted property is released back to the available pool.",
    rightPanelMode: 'prefs_a',
    rightPanelTitle: 'Preference Change Preview',
  },
  {
    key: 'assignAvailable',
    label: 'Assign a New Available Property to Requestor',
    icon: <Plus size={14} />,
    desc: 'Search and pick any available quarter from the pool and assign it directly to Request A.',
    rightPanelMode: 'quarter_preview',
    rightPanelTitle: 'Property Assignment Preview',
  },
  {
    key: 'swapRequests',
    label: 'Swap Request A with Request B',
    icon: <ArrowLeftRight size={14} />,
    desc: 'Select Request B from the left panel. A and B will swap their allotted quarters. Equivalent to a mutual exchange.',
    rightPanelMode: 'swap_preview',
    rightPanelTitle: 'Swap Preview',
  },
  {
    key: 'bPrefToA_APrefToB',
    label: "Assign B's Allocated Property to A & Assign B to One of B's Preferences",
    icon: <Shuffle size={14} />,
    desc: "A receives B's currently allotted quarter. B is then re-allotted to one of B's saved preferences. Select Request B on the left, then choose B's new preference on the right.",
    rightPanelMode: 'prefs_b_plus_a',
    rightPanelTitle: "Assignment + B's New Preference",
  },
  {
    key: 'bPropToA_AvailToB',
    label: "Assign B's Property to A & Allot an Available Property to B",
    icon: <Home size={14} />,
    desc: "A receives B's currently allotted quarter. B is then assigned a fresh available quarter from the pool. Select Request B on the left, then pick B's new quarter on the right.",
    rightPanelMode: 'avail_b_plus_a',
    rightPanelTitle: 'Assignment + Available Quarter for B',
  },
  {
    key: 'bPropToA_NextCycle',
    label: "Assign B's Property to A & Send B to Next Cycle",
    icon: <RotateCcw size={14} />,
    desc: "A receives B's allotted quarter (status: Allotted). B's request_status is reset to Submitted so the system allocation picks it up in the next cycle run. B's prior allotment is released.",
    rightPanelMode: 'outcome_next_cycle',
    rightPanelTitle: 'Outcome: A Allotted, B to Next Cycle',
  },
  {
    key: 'bPropToA_CancelB',
    label: "Assign B's Property to A & Cancel Request B",
    icon: <Ban size={14} />,
    desc: "A receives B's allotted quarter. B's request is cancelled. Optionally release A's previously allotted quarter back to the available pool.",
    rightPanelMode: 'outcome_cancel',
    rightPanelTitle: 'Outcome: A Allotted, B Cancelled',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allotment: QuarterAllotment | null;
  allCycleAllotments: QuarterAllotment[];
  eoAuthId: string;
  onOverrideSaved: () => void;
  initialAction?: string;
}

// ── Small reusable card components ──────────────────────────────────────────

const QuarterPickCard = ({
  quarter, index, selected, onClick, accentClass = 'border-blue-400 bg-blue-50',
}: {
  quarter: Quarter; index: number; selected: boolean; onClick: () => void; accentClass?: string;
}) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer border transition-all ${
      selected ? `${accentClass} shadow-sm` : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
    }`}
  >
    <img src={getImage(quarter, index)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-sm text-gray-900">{quarter.quarter_number}</div>
      <div className="text-xs text-gray-500 truncate">{quarter.address || quarter.block_name}</div>
      <div className="flex gap-3 text-xs text-gray-500 mt-1">
        <span>{quarter.bhk_config}</span>
        <span>{quarter.area_sqft} sq.ft</span>
        <span className="font-semibold text-gray-800">{fmtINR(quarter.monthly_rent)}/mo</span>
      </div>
    </div>
    {selected && <CheckCircle size={16} className="text-blue-600 shrink-0" />}
  </div>
);

const AllotmentPickCard = ({ allotment: a, selected, onClick }: {
  allotment: QuarterAllotment; selected: boolean; onClick: () => void;
}) => {
  const q = a.quarter as Quarter | undefined;
  const r = a.request as QuarterRequest | undefined;
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer border transition-all ${
        selected ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
      }`}
    >
      {q && <img src={getImage(q, 0)} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900">{q?.quarter_number ?? '—'}</div>
        <div className="text-xs font-mono text-gray-500">{r?.request_number}</div>
        <div className="text-xs text-gray-500 mt-1">{q?.bhk_config} · {fmtINR(q?.monthly_rent ?? 0)}/mo</div>
      </div>
      {selected && <CheckCircle size={16} className="text-blue-600 shrink-0" />}
    </div>
  );
};

const QuarterCompareCard = ({
  quarter, label, labelCls, index = 0,
}: { quarter: Quarter | undefined; label: string; labelCls: string; index?: number }) => (
  <div className={`rounded-xl border overflow-hidden flex-1 min-w-0 ${quarter ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50'}`}>
    <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${labelCls}`}>{label}</div>
    {quarter ? (
      <div className="p-3">
        <img src={getImage(quarter, index)} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
        <div className="font-semibold text-sm text-gray-900">{quarter.quarter_number}</div>
        <div className="text-xs text-gray-500 truncate">{quarter.address || quarter.block_name}</div>
        <div className="flex gap-2 text-xs text-gray-500 mt-1">
          <span>{quarter.bhk_config}</span>
          <span className="font-semibold text-gray-800">{fmtINR(quarter.monthly_rent)}/mo</span>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Home size={22} className="text-gray-300 mb-1" />
        <p className="text-xs text-gray-400">Not yet selected</p>
      </div>
    )}
  </div>
);

// ── Main Modal ────────────────────────────────────────────────────────────────

export const QuarterOverrideModal: React.FC<Props> = ({
  isOpen, onClose, allotment, allCycleAllotments, eoAuthId, onOverrideSaved, initialAction,
}) => {
  const addToast = useUIStore(s => s.addToast);

  const [action, setAction] = useState<ActionType>('assignPref');
  const [justification, setJustification] = useState('');
  const [leftSearch, setLeftSearch] = useState('');

  const [selectedAvailableId, setSelectedAvailableId] = useState<string | null>(null);
  const [selectedBAllotmentId, setSelectedBAllotmentId] = useState<string | null>(null);
  const [selectedPrefRank, setSelectedPrefRank] = useState<number | null>(null);
  const [selectedBPrefRank, setSelectedBPrefRank] = useState<number | null>(null);
  const [selectedAvailForBId, setSelectedAvailForBId] = useState<string | null>(null);
  const [releaseAQuarter, setReleaseAQuarter] = useState(false);

  const [availableQuarters, setAvailableQuarters] = useState<Quarter[]>([]);
  const [availForBQuarters, setAvailForBQuarters] = useState<Quarter[]>([]);
  const [saving, setSaving] = useState(false);

  const meta = ACTIONS.find(a => a.key === action)!;
  const reqA = allotment?.request as QuarterRequest | undefined;
  const reqAPrefs = (reqA?.preferences ?? []).sort((a, b) => a.preference_rank - b.preference_rank);
  const allottedQuarterId = allotment?.quarter?.id;
  const reqAAllottedQ = allotment?.quarter as Quarter | undefined;

  const selectedBAllotment = allCycleAllotments.find(a => a.id === selectedBAllotmentId);
  const reqB = selectedBAllotment?.request as QuarterRequest | undefined;
  const reqBPrefs = (reqB?.preferences ?? []).sort((a, b) => a.preference_rank - b.preference_rank);
  const reqBAllottedQ = selectedBAllotment?.quarter as Quarter | undefined;

  useEffect(() => {
    if (!isOpen) return;
    const validKeys = ACTIONS.map(a => a.key);
    const defaultAction = (initialAction && validKeys.includes(initialAction as ActionType))
      ? initialAction as ActionType : 'assignPref';
    setAction(defaultAction);
    setJustification('');
    setLeftSearch('');
    setSelectedAvailableId(null);
    setSelectedBAllotmentId(null);
    setSelectedPrefRank(null);
    setSelectedBPrefRank(null);
    setSelectedAvailForBId(null);
    setReleaseAQuarter(false);
  }, [isOpen, allotment?.id, initialAction]);

  const loadAvailable = useCallback(async () => {
    try {
      const data = await quartersService.getQuarters({ occupancy_status: 'AVAILABLE', search: leftSearch || undefined });
      setAvailableQuarters(data);
    } catch { /* silent */ }
  }, [leftSearch]);

  useEffect(() => {
    if (isOpen && action === 'assignAvailable') {
      const t = setTimeout(loadAvailable, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, action, loadAvailable]);

  const loadAvailForB = useCallback(async () => {
    try {
      const data = await quartersService.getQuarters({ occupancy_status: 'AVAILABLE' });
      setAvailForBQuarters(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (isOpen && action === 'bPropToA_AvailToB' && selectedBAllotmentId) loadAvailForB();
  }, [isOpen, action, selectedBAllotmentId, loadAvailForB]);

  if (!isOpen || !allotment) return null;

  const canApply = (() => {
    if (!justification.trim()) return false;
    switch (action) {
      case 'assignPref': return selectedPrefRank !== null;
      case 'assignAvailable': return !!selectedAvailableId;
      case 'swapRequests': return !!selectedBAllotmentId;
      case 'bPrefToA_APrefToB': return !!selectedBAllotmentId && selectedBPrefRank !== null;
      case 'bPropToA_AvailToB': return !!selectedBAllotmentId && !!selectedAvailForBId;
      case 'bPropToA_NextCycle': return !!selectedBAllotmentId;
      case 'bPropToA_CancelB': return !!selectedBAllotmentId;
      default: return false;
    }
  })();

  const handleApply = async () => {
    if (!canApply || !allotment || !reqA) return;
    setSaving(true);
    try {
      let newQuarterId: string | undefined;
      if (action === 'assignAvailable') newQuarterId = selectedAvailableId ?? undefined;
      if (action === 'assignPref') {
        const pref = reqAPrefs.find(p => p.preference_rank === selectedPrefRank);
        newQuarterId = pref?.quarter_id;
      }
      await quartersService.saveOverride(eoAuthId, {
        allotment_id: allotment.id,
        request_a_id: reqA.id,
        request_b_id: selectedBAllotment ? reqB?.id : undefined,
        action_type: action.toUpperCase(),
        justification,
        new_quarter_id: newQuarterId,
        b_new_quarter_id: action === 'bPropToA_AvailToB' ? (selectedAvailForBId ?? undefined) : undefined,
        b_new_pref_rank: action === 'bPrefToA_APrefToB' ? (selectedBPrefRank ?? undefined) : undefined,
        release_a_quarter: action === 'bPropToA_CancelB' ? releaseAQuarter : undefined,
      });
      addToast('Override applied successfully', 'success');
      onOverrideSaved();
      onClose();
    } catch {
      addToast('Failed to apply override', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Left Panel ──────────────────────────────────────────────────────────────
  const renderLeftPanel = () => {
    if (action === 'assignPref') {
      const filtered = reqAPrefs.filter(p => {
        if (!leftSearch) return true;
        const q = p.quarter as Quarter | undefined;
        return q?.quarter_number.toLowerCase().includes(leftSearch.toLowerCase()) ||
          q?.address?.toLowerCase().includes(leftSearch.toLowerCase());
      });
      return filtered.length === 0
        ? <div className="flex flex-col items-center justify-center py-12 text-center"><Info size={28} className="text-gray-300 mb-2" /><p className="text-sm text-gray-400">No preferences found</p></div>
        : filtered.map((pref, i) => {
          const q = pref.quarter as Quarter | undefined;
          const isCurrent = pref.quarter_id === allottedQuarterId;
          const isSelected = selectedPrefRank === pref.preference_rank;
          return (
            <div key={pref.id} onClick={() => !isCurrent && setSelectedPrefRank(pref.preference_rank)}
              className={`flex items-center gap-3 rounded-xl p-3 border transition-all relative ${!isCurrent ? 'cursor-pointer' : 'cursor-default'} ${
                isCurrent ? 'border-amber-300 bg-amber-50' :
                isSelected ? 'border-blue-400 bg-blue-50 shadow-sm' :
                'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="relative shrink-0">
                {q && <img src={getImage(q, i)} alt="" className="w-14 h-14 rounded-lg object-cover" />}
                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">{pref.preference_rank}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900">{q?.quarter_number ?? '—'}</div>
                {q?.address && <div className="text-xs text-gray-500 truncate">{q.address}</div>}
                <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                  {q && <><span>{q.bhk_config}</span><span>{q.area_sqft} sq.ft</span></>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {isCurrent && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Currently Allotted</span>}
                {!isCurrent && <input type="radio" name="prefSelect" checked={isSelected} onChange={() => setSelectedPrefRank(pref.preference_rank)} className="w-4 h-4 accent-slate-800" />}
              </div>
            </div>
          );
        });
    }

    if (action === 'assignAvailable') {
      const filtered = availableQuarters.filter(q =>
        !leftSearch || q.quarter_number.toLowerCase().includes(leftSearch.toLowerCase()) || (q.address || '').toLowerCase().includes(leftSearch.toLowerCase())
      );
      return filtered.length === 0
        ? <div className="flex flex-col items-center justify-center py-12 text-center"><Home size={28} className="text-gray-300 mb-2" /><p className="text-sm text-gray-400">No available quarters found</p></div>
        : filtered.map((q, i) => (
          <QuarterPickCard key={q.id} quarter={q} index={i} selected={selectedAvailableId === q.id} onClick={() => setSelectedAvailableId(q.id)} />
        ));
    }

    // All B-selection actions
    const others = allCycleAllotments.filter(a => a.id !== allotment.id);
    const filtered = others.filter(a => {
      if (!leftSearch) return true;
      const q = a.quarter as Quarter | undefined;
      const r = a.request as QuarterRequest | undefined;
      return q?.quarter_number.toLowerCase().includes(leftSearch.toLowerCase()) ||
        r?.request_number.toLowerCase().includes(leftSearch.toLowerCase());
    });
    return filtered.length === 0
      ? <div className="flex flex-col items-center justify-center py-12 text-center"><Info size={28} className="text-gray-300 mb-2" /><p className="text-sm text-gray-400">No other allotments in this cycle</p></div>
      : filtered.map(a => (
        <AllotmentPickCard key={a.id} allotment={a} selected={selectedBAllotmentId === a.id}
          onClick={() => { setSelectedBAllotmentId(a.id); setSelectedBPrefRank(null); setSelectedAvailForBId(null); }} />
      ));
  };

  // ── Right Panel ──────────────────────────────────────────────────────────────
  const renderRightPanel = () => {
    switch (meta.rightPanelMode) {
      case 'prefs_a': {
        const selectedQ = (reqAPrefs.find(p => p.preference_rank === selectedPrefRank)?.quarter) as Quarter | undefined;
        return (
          <div className="flex flex-col gap-4 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quarter Change Preview</div>
            <div className="flex gap-3 items-start">
              <QuarterCompareCard quarter={reqAAllottedQ} label="FROM (Current)" labelCls="bg-amber-50 text-amber-600" index={0} />
              <ArrowRight size={20} className="text-gray-400 shrink-0 mt-12" />
              <QuarterCompareCard quarter={selectedQ} label="TO (New)" labelCls="bg-blue-50 text-blue-600" index={1} />
            </div>
            {!selectedPrefRank && <p className="text-xs text-gray-400 text-center">Select a preference from the left panel</p>}
          </div>
        );
      }
      case 'quarter_preview': {
        const selectedQ = availableQuarters.find(q => q.id === selectedAvailableId);
        return (
          <div className="flex flex-col gap-4 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment Preview</div>
            <div className="flex gap-3 items-start">
              <QuarterCompareCard quarter={reqAAllottedQ} label="FROM (Current)" labelCls="bg-amber-50 text-amber-600" index={0} />
              <ArrowRight size={20} className="text-gray-400 shrink-0 mt-12" />
              <QuarterCompareCard quarter={selectedQ} label="TO (Selected)" labelCls="bg-blue-50 text-blue-600" index={1} />
            </div>
            {!selectedQ && <p className="text-xs text-gray-400 text-center">Select an available quarter from the left panel</p>}
          </div>
        );
      }
      case 'swap_preview': {
        return (
          <div className="flex flex-col gap-4 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Swap Preview</div>
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">Request A receives</div>
                {reqBAllottedQ
                  ? <div className="font-semibold text-sm text-gray-900">{reqBAllottedQ.quarter_number} <span className="text-xs text-gray-500">{reqBAllottedQ.bhk_config}</span></div>
                  : <div className="text-xs text-gray-400">Select Request B first</div>}
              </div>
              <ArrowLeftRight size={16} className="text-blue-400 mx-auto" />
              <div>
                <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">Request B receives</div>
                <div className="font-semibold text-sm text-gray-900">{reqAAllottedQ?.quarter_number ?? '—'} <span className="text-xs text-gray-500">{reqAAllottedQ?.bhk_config}</span></div>
              </div>
            </div>
            {!selectedBAllotmentId && <p className="text-xs text-gray-400 text-center">Select Request B from the left panel to preview the swap.</p>}
          </div>
        );
      }
      case 'prefs_b_plus_a': {
        return (
          <div className="flex flex-col gap-3 p-4 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment Summary</div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 shrink-0">
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Request A receives (B's quarter)</div>
              {reqBAllottedQ
                ? <div className="font-semibold text-sm text-gray-900">{reqBAllottedQ.quarter_number} <span className="text-xs text-gray-500">{reqBAllottedQ.bhk_config} · {fmtINR(reqBAllottedQ.monthly_rent)}/mo</span></div>
                : <div className="text-xs text-gray-400">Select Request B first</div>}
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1 shrink-0">Select B's New Preference</div>
            {!selectedBAllotmentId
              ? <p className="text-xs text-gray-400 text-center py-4">Select Request B from the left panel first.</p>
              : reqBPrefs.length === 0
                ? <p className="text-xs text-gray-400 text-center py-4">Request B has no saved preferences.</p>
                : reqBPrefs.map((pref, i) => {
                  const q = pref.quarter as Quarter | undefined;
                  const isCurrent = pref.quarter_id === reqBAllottedQ?.id;
                  const isSelected = selectedBPrefRank === pref.preference_rank;
                  return (
                    <div key={pref.id} onClick={() => !isCurrent && setSelectedBPrefRank(pref.preference_rank)}
                      className={`flex items-center gap-3 rounded-xl p-3 border transition-all relative ${!isCurrent ? 'cursor-pointer' : 'cursor-default opacity-50'} ${
                        isSelected ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {q && <img src={getImage(q, i)} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                        <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center">{pref.preference_rank}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900">{q?.quarter_number ?? '—'}</div>
                        <div className="text-xs text-gray-500">{q?.bhk_config} · {q ? fmtINR(q.monthly_rent) : '—'}/mo</div>
                        {isCurrent && <div className="text-[10px] text-amber-600 font-medium">Currently Allotted to B</div>}
                      </div>
                      {!isCurrent && <input type="radio" name="bPrefSelect" checked={isSelected} onChange={() => setSelectedBPrefRank(pref.preference_rank)} className="w-4 h-4 accent-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
          </div>
        );
      }
      case 'avail_b_plus_a': {
        return (
          <div className="flex flex-col gap-3 p-4 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment Summary</div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 shrink-0">
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Request A receives (B's quarter)</div>
              {reqBAllottedQ
                ? <div className="font-semibold text-sm text-gray-900">{reqBAllottedQ.quarter_number} <span className="text-xs text-gray-500">{reqBAllottedQ.bhk_config} · {fmtINR(reqBAllottedQ.monthly_rent)}/mo</span></div>
                : <div className="text-xs text-gray-400">Select Request B first</div>}
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1 shrink-0">Select Available Quarter for B</div>
            {!selectedBAllotmentId
              ? <p className="text-xs text-gray-400 text-center py-4">Select Request B from the left panel first.</p>
              : availForBQuarters.length === 0
                ? <p className="text-xs text-gray-400 text-center py-4">No available quarters found.</p>
                : availForBQuarters.map((q, i) => (
                  <QuarterPickCard key={q.id} quarter={q} index={i} selected={selectedAvailForBId === q.id} onClick={() => setSelectedAvailForBId(q.id)} accentClass="border-emerald-400 bg-emerald-50" />
                ))}
          </div>
        );
      }
      case 'outcome_next_cycle': {
        return (
          <div className="flex flex-col gap-4 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outcome Summary</div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Request A</div>
              <div className="text-sm text-gray-800">Receives <strong>{reqBAllottedQ?.quarter_number ?? "(B's quarter)"}</strong></div>
              <div className="text-xs text-emerald-700 mt-1">Status: <span className="font-semibold">Allotted</span></div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Request B</div>
              <div className="text-sm text-gray-800">Quarter released — re-enters next allocation cycle</div>
              <div className="text-xs text-blue-700 mt-1">Status reset to: <span className="font-semibold">Submitted</span></div>
            </div>
            {!selectedBAllotmentId && <p className="text-xs text-gray-400 text-center">Select Request B from the left panel to proceed.</p>}
          </div>
        );
      }
      case 'outcome_cancel': {
        return (
          <div className="flex flex-col gap-4 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outcome Summary</div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Request A</div>
              <div className="text-sm text-gray-800">Receives <strong>{reqBAllottedQ?.quarter_number ?? "(B's quarter)"}</strong></div>
              <div className="text-xs text-emerald-700 mt-1">Status: <span className="font-semibold">Allotted</span></div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold text-red-600 uppercase mb-1">Request B</div>
              <div className="text-sm text-gray-800">Will be <strong>Cancelled</strong></div>
              <div className="text-xs text-red-700 mt-1">Status: <span className="font-semibold">Cancelled</span></div>
            </div>
            {reqAAllottedQ && (
              <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${releaseAQuarter ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                <input type="checkbox" checked={releaseAQuarter} onChange={e => setReleaseAQuarter(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-amber-600 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-gray-800">Release A's prior quarter back to pool</div>
                  <div className="text-xs text-gray-500 mt-0.5">Set <strong>{reqAAllottedQ.quarter_number}</strong> occupancy status back to Available.</div>
                </div>
              </label>
            )}
            {!selectedBAllotmentId && <p className="text-xs text-gray-400 text-center">Select Request B from the left panel to proceed.</p>}
          </div>
        );
      }
      default: return null;
    }
  };

  const leftPanelTitle = action === 'assignPref' ? "Request A's Preferences"
    : action === 'assignAvailable' ? 'Available Quarters'
    : 'Select Request B';

  const leftPanelHint = action === 'assignPref' ? 'Click a preference to select it as the new allotment'
    : action === 'assignAvailable' ? 'Search and select an available quarter to assign'
    : 'Select another allotment from this cycle to use as Request B';

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors shrink-0">
          <ArrowLeft size={18} /><span className="font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="bg-amber-100 border border-amber-200 rounded-full px-3 py-1 flex items-center gap-2">
            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800 truncate">
              Overriding: {reqA?.request_number ?? '—'} · {reqAAllottedQ?.quarter_number ?? '—'}
            </span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline">
            {reqA?.required_bhk_config} · {reqA?.preferred_location || 'No location pref'}
          </span>
        </div>
        <button onClick={handleApply} disabled={!canApply || saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
        >
          <SendHorizonal size={15} />
          {saving ? 'Executing…' : 'Execute Override'}
        </button>
      </div>

      {/* ── Form Band ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0 space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Override Method</label>
          <div className="relative">
            <select value={action}
              onChange={e => {
                setAction(e.target.value as ActionType);
                setSelectedAvailableId(null); setSelectedBAllotmentId(null);
                setSelectedPrefRank(null); setSelectedBPrefRank(null);
                setSelectedAvailForBId(null); setReleaseAQuarter(false); setLeftSearch('');
              }}
              className="w-full appearance-none pl-4 pr-10 py-2.5 text-sm font-semibold text-gray-800 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-colors"
            >
              {ACTIONS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">{meta.desc}</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
            EO Justification <span className="text-red-500">*</span>
          </label>
          <textarea value={justification} onChange={e => setJustification(e.target.value)}
            placeholder="Provide a clear justification for this override. This will be audit-logged."
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      {/* ── Split Body ── */}
      <div className="flex-1 overflow-hidden grid grid-cols-2 min-h-0">

        {/* Left Panel */}
        <div className="flex flex-col border-r border-gray-200 bg-white min-h-0">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">{leftPanelTitle}</h3>
            <p className="text-xs text-gray-400">{leftPanelHint}</p>
            <div className="relative mt-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={leftSearch} onChange={e => setLeftSearch(e.target.value)} placeholder="Search…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {renderLeftPanel()}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col bg-gray-50 min-h-0">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white shrink-0">
            <h3 className="text-sm font-bold text-gray-900">{meta.rightPanelTitle}</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderRightPanel()}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
