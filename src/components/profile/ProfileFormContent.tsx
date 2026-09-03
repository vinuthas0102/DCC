import React, { useState, useEffect, useRef } from 'react';
import {
  Lock, Save, User, Briefcase, CreditCard, Phone, Users,
  Building, Stethoscope, History, Upload, FileText, ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { authService } from '../../services/authService';
import { ROLE_LABELS } from '../../constants/roles';
import { ProfileMetadata, FamilyEmployeeDetails, MedicalGrounds } from '../../types';

/* ── Primitives ── */

const ReadonlyField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-[13px] text-gray-600 min-h-[38px]">
      <Lock size={11} className="text-gray-300 flex-shrink-0" />
      <span>{value || '—'}</span>
    </div>
  </div>
);

const EditableField: React.FC<{
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[38px]"
    />
  </div>
);

const EditableTextarea: React.FC<{
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}> = ({ label, value, onChange, placeholder, rows = 2 }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    <textarea
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
    />
  </div>
);

const ToggleButtons: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-[13px] font-medium text-gray-700">{label}</span>
    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[12px] font-semibold">
      <button type="button" onClick={() => onChange(true)} className={`px-4 py-1.5 transition-colors ${value ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Yes</button>
      <button type="button" onClick={() => onChange(false)} className={`px-4 py-1.5 transition-colors ${!value ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>No</button>
    </div>
  </div>
);

const SectionCard: React.FC<{ id?: string; title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ id, title, icon, children }) => (
  <div id={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
      <span className="text-blue-600">{icon}</span>
      <h2 className="text-[13px] font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const FieldGrid: React.FC<{ cols?: 2 | 3 | 4; children: React.ReactNode }> = ({ cols = 3, children }) => {
  const cls = cols === 4 ? 'grid-cols-2 lg:grid-cols-4' : cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';
  return <div className={`grid ${cls} gap-3`}>{children}</div>;
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

const RELATION_OPTIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'];
const MEDICAL_REASON_OPTIONS = ['Critical Illness', 'Post-Surgery Recovery', 'Disability', 'Chronic Condition', 'Other'];

/* ── Main export ── */

export interface ProfileFormContentProps {
  /** compact removes the sticky bottom save button (drawer puts it in the header bar) */
  compact?: boolean;
  onSaved?: () => void;
}

export const ProfileFormContent: React.FC<ProfileFormContentProps> = ({ compact, onSaved }) => {
  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [familyCount, setFamilyCount] = useState(0);
  const [numDependents, setNumDependents] = useState(0);
  const [dependents, setDependents] = useState<Array<{ relation: string; age: number }>>([]);
  const [familyEmployeeActive, setFamilyEmployeeActive] = useState(false);
  const [familyEmpDetails, setFamilyEmpDetails] = useState<FamilyEmployeeDetails>({
    relation: '', name: '', designation: '', location: '', empId: '', phone: '', email: '',
  });
  const [medicalRequired, setMedicalRequired] = useState(false);
  const [medicalReason, setMedicalReason] = useState('');
  const [medicalMember, setMedicalMember] = useState('');
  const [medicalRemarks, setMedicalRemarks] = useState('');
  const [medDocFile, setMedDocFile] = useState<File | null>(null);
  const [medDocInfo, setMedDocInfo] = useState<{ name: string; url: string } | null>(null);
  const [medDocUploading, setMedDocUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const m = user.metadata ?? {};
    setPhone(user.phone || '');
    setAlternatePhone(m.alternatePhone ?? '');
    setAlternateEmail(m.alternateEmail ?? '');
    setAadhaarNumber(m.aadhaarNumber ?? '');
    setPanNumber(m.panNumber ?? '');
    setCurrentAddress(m.currentAddress ?? '');
    setPermanentAddress(m.permanentAddress ?? '');
    setFamilyCount(m.familyCount ?? 0);
    setNumDependents(m.numDependents ?? 0);
    setDependents((m.dependents as Array<{ relation: string; age: number }>) ?? []);
    setFamilyEmployeeActive(m.familyEmployeeActive ?? false);
    setFamilyEmpDetails((m.familyEmployeeDetails as FamilyEmployeeDetails) ?? {
      relation: '', name: '', designation: '', location: '', empId: '', phone: '', email: '',
    });
    const mg = m.medicalGrounds as MedicalGrounds | undefined;
    setMedicalRequired(mg?.required ?? false);
    setMedicalReason(mg?.reason ?? '');
    setMedicalMember(mg?.member ?? '');
    setMedicalRemarks(mg?.remarks ?? '');
  }, [user?.id]);

  useEffect(() => {
    setDependents(prev => {
      if (prev.length === numDependents) return prev;
      if (prev.length < numDependents)
        return [...prev, ...Array(numDependents - prev.length).fill({ relation: '', age: 0 })];
      return prev.slice(0, numDependents);
    });
  }, [numDependents]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const metadata: ProfileMetadata = {
        ...(user.metadata ?? {}),
        alternatePhone, alternateEmail, aadhaarNumber, panNumber,
        currentAddress, permanentAddress, familyCount, numDependents, dependents,
        familyEmployeeActive, familyEmployeeDetails: familyEmpDetails,
        medicalGrounds: { required: medicalRequired, reason: medicalReason, member: medicalMember, remarks: medicalRemarks },
      };
      const updated = await authService.updateProfile(user.id, { phone, metadata });
      setUser(updated);
      addToast('Profile updated successfully', 'success');
      onSaved?.();
    } catch {
      addToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMedDocUpload = async () => {
    if (!user || !medDocFile) return;
    setMedDocUploading(true);
    try {
      const path = await authService.uploadProfileMedicalDoc(user.id, medDocFile);
      const metadata: ProfileMetadata = { ...(user.metadata ?? {}), medicalDocPath: path };
      const updated = await authService.updateProfile(user.id, { metadata });
      setUser(updated);
      setMedDocInfo({ name: medDocFile.name, url: path });
      setMedDocFile(null);
      addToast('Medical document uploaded', 'success');
    } catch {
      addToast('Upload failed', 'error');
    } finally {
      setMedDocUploading(false);
    }
  };

  if (!user) return null;

  const m = user.metadata ?? {};
  const serviceHistory = (m.serviceHistory ?? []) as Array<{
    dateJoining: string; dateTransfer: string; designation: string; region: string; payScale: string;
  }>;

  return (
    <div className="space-y-4">
      {/* 1 · Personal */}
      <SectionCard id="personal" title="Personal Information" icon={<User size={15} />}>
        <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
          <Lock size={10} className="mt-0.5 flex-shrink-0" />
          <span>Name and category fields are managed by HR and cannot be edited.</span>
        </div>
        <FieldGrid cols={3}>
          <ReadonlyField label="Full Name" value={user.fullName} />
          <ReadonlyField label="Father's Name" value={m.fatherName as string} />
          <ReadonlyField label="Date of Birth" value={fmtDate(m.dateOfBirth as string)} />
          <ReadonlyField label="Social Category" value={m.socialCategory as string} />
          <ReadonlyField label="Physical Status" value={m.physicalStatus as string} />
          <ReadonlyField label="BHK Entitlement" value={user.bhkEntitlement} />
        </FieldGrid>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditableTextarea label="Current Address" value={currentAddress} onChange={setCurrentAddress} placeholder="Enter current address" rows={3} />
          <EditableTextarea label="Permanent Address" value={permanentAddress} onChange={setPermanentAddress} placeholder="Enter permanent address" rows={3} />
        </div>
      </SectionCard>

      {/* 2 · Employment */}
      <SectionCard id="employment" title="Employment Details" icon={<Briefcase size={15} />}>
        <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
          <Lock size={10} className="mt-0.5 flex-shrink-0" />
          <span>Employment details are maintained by HR and are read-only.</span>
        </div>
        <FieldGrid cols={3}>
          <ReadonlyField label="Department" value={user.govtDepartment} />
          <ReadonlyField label="Employee ID" value={user.govtEmployeeId} />
          <ReadonlyField label="Project Location" value={user.projectLocation} />
          <ReadonlyField label="Date of Joining" value={fmtDate(m.dateOfJoining as string)} />
          <ReadonlyField label="Date of Retirement" value={fmtDate(m.dateOfRetirement as string)} />
          <ReadonlyField label="HRMS ID" value={m.hrmsId as string} />
          <ReadonlyField label="PF Number" value={m.pfNumber as string} />
        </FieldGrid>
      </SectionCard>

      {/* 3 · Identification */}
      <SectionCard id="identification" title="Identification" icon={<CreditCard size={15} />}>
        <FieldGrid cols={2}>
          <ReadonlyField label="SAP ID" value={user.sapId} />
          <ReadonlyField label="Employee ID" value={user.govtEmployeeId} />
          <EditableField label="Aadhaar Number" value={aadhaarNumber} onChange={setAadhaarNumber} placeholder="XXXX XXXX XXXX" />
          <EditableField label="PAN Number" value={panNumber} onChange={setPanNumber} placeholder="ABCDE1234F" />
        </FieldGrid>
      </SectionCard>

      {/* 4 · Contact */}
      <SectionCard id="contact" title="Contact Details" icon={<Phone size={15} />}>
        <FieldGrid cols={2}>
          <ReadonlyField label="Official Email" value={user.email} />
          <EditableField label="Mobile Number" value={phone} onChange={setPhone} placeholder="10-digit mobile" type="tel" />
          <EditableField label="Alternate Phone" value={alternatePhone} onChange={setAlternatePhone} placeholder="Alternate number" type="tel" />
          <EditableField label="Alternate Email" value={alternateEmail} onChange={setAlternateEmail} placeholder="Personal email" type="email" />
        </FieldGrid>
      </SectionCard>

      {/* 5 · Family */}
      <SectionCard id="family" title="Family Details" icon={<Users size={15} />}>
        <FieldGrid cols={2}>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Family Members</label>
            <select value={familyCount} onChange={e => setFamilyCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Number of Dependents</label>
            <select value={numDependents} onChange={e => setNumDependents(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </FieldGrid>
        {dependents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Dependent Details</p>
            {dependents.map((dep, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Relation</label>
                  <select value={dep.relation}
                    onChange={e => { const next = [...dependents]; next[idx] = { ...next[idx], relation: e.target.value }; setDependents(next); }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Age</label>
                  <input type="number" value={dep.age || ''}
                    onChange={e => { const next = [...dependents]; next[idx] = { ...next[idx], age: Number(e.target.value) }; setDependents(next); }}
                    placeholder="Age"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 6 · Family Employment */}
      <SectionCard id="family-emp" title="Family Member in Employment" icon={<Building size={15} />}>
        <ToggleButtons label="Is any family member employed in NMDC?" value={familyEmployeeActive} onChange={setFamilyEmployeeActive} />
        {familyEmployeeActive && (
          <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
            <FieldGrid cols={2}>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Relation</label>
                <select value={familyEmpDetails.relation} onChange={e => setFamilyEmpDetails(p => ({ ...p, relation: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <EditableField label="Name" value={familyEmpDetails.name} onChange={v => setFamilyEmpDetails(p => ({ ...p, name: v }))} placeholder="Full name" />
              <EditableField label="Designation" value={familyEmpDetails.designation} onChange={v => setFamilyEmpDetails(p => ({ ...p, designation: v }))} />
              <EditableField label="Location / Region" value={familyEmpDetails.location} onChange={v => setFamilyEmpDetails(p => ({ ...p, location: v }))} />
              <EditableField label="Employee ID" value={familyEmpDetails.empId} onChange={v => setFamilyEmpDetails(p => ({ ...p, empId: v }))} placeholder="EMP-XXXXXX" />
              <EditableField label="Phone" value={familyEmpDetails.phone} onChange={v => setFamilyEmpDetails(p => ({ ...p, phone: v }))} type="tel" />
            </FieldGrid>
          </div>
        )}
      </SectionCard>

      {/* 7 · Medical */}
      <SectionCard id="medical" title="Medical Grounds" icon={<Stethoscope size={15} />}>
        <ToggleButtons label="Requesting on medical grounds?" value={medicalRequired} onChange={setMedicalRequired} />
        {medicalRequired && (
          <div className="mt-4 p-4 rounded-xl border border-rose-100 bg-rose-50/20 space-y-3">
            <FieldGrid cols={2}>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason</label>
                <select value={medicalReason} onChange={e => setMedicalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select reason</option>
                  {MEDICAL_REASON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <EditableField label="Affected Member" value={medicalMember} onChange={setMedicalMember} placeholder="Self / Spouse / Son…" />
            </FieldGrid>
            <EditableTextarea label="Remarks" value={medicalRemarks} onChange={setMedicalRemarks} placeholder="Additional details" rows={2} />
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Medical Certificate</p>
          {(medDocInfo || m.medicalDocPath) ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              <FileText size={16} className="text-blue-500 flex-shrink-0" />
              <span className="text-[12px] text-gray-700 flex-1 truncate">
                {medDocInfo?.name || String(m.medicalDocPath).split('/').pop()?.replace(/^\d+-/, '').replace(/_/g, ' ')}
              </span>
              {medDocInfo?.url && (
                <a href={medDocInfo.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                  <ExternalLink size={11} /> View
                </a>
              )}
              <button onClick={() => { setMedDocInfo(null); fileInputRef.current?.click(); }} className="text-[11px] text-gray-400 hover:text-gray-600">Replace</button>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 p-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all">
              <Upload size={18} className="text-gray-400" />
              <p className="text-[12px] text-gray-500">Click to upload medical certificate</p>
              <p className="text-[11px] text-gray-400">PDF, JPG, PNG up to 5 MB</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={e => setMedDocFile(e.target.files?.[0] ?? null)} />
          {medDocFile && (
            <div className="mt-2 flex items-center gap-3">
              <FileText size={13} className="text-blue-500 flex-shrink-0" />
              <span className="text-[12px] text-gray-700 flex-1 truncate">{medDocFile.name}</span>
              <button onClick={handleMedDocUpload} disabled={medDocUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {medDocUploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                {medDocUploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 8 · Service History */}
      <SectionCard id="service" title="Service History" icon={<History size={15} />}>
        {serviceHistory.length === 0 ? (
          <p className="text-[13px] text-gray-400 text-center py-5">No service history records available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date of Joining', 'Date of Transfer', 'Designation', 'Region', 'Pay Scale'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider pb-2.5 pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {serviceHistory.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 pr-4 text-gray-700 whitespace-nowrap">{fmtDate(row.dateJoining)}</td>
                    <td className="py-2.5 pr-4 text-gray-700 whitespace-nowrap">
                      {row.dateTransfer ? fmtDate(row.dateTransfer) : <span className="text-emerald-600 font-medium">Present</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-800 font-medium">{row.designation}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{row.region}</td>
                    <td className="py-2.5 text-gray-600">{row.payScale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Bottom save (page mode only) */}
      {!compact && (
        <div className="flex justify-end pb-8">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Exposed save for drawer usage via ref — drawer calls this via a button in its own header */}
      {compact && (
        <div className="pb-4 flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

/* Header card shown at the top of the drawer */
export const ProfileHeaderCard: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return null;
  const initials = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';
  return (
    <div className="flex items-center gap-4 p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
        {initials}
      </div>
      <div>
        <div className="text-[16px] font-bold text-gray-900 leading-tight">{user.fullName}</div>
        <div className="text-[12px] text-blue-500 font-semibold mt-0.5">{user.govtDepartment || '—'}</div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {user.govtEmployeeId && (
            <span className="text-[11px] text-gray-500">EMP: <span className="font-semibold text-gray-700">{user.govtEmployeeId}</span></span>
          )}
          {user.sapId && (
            <span className="text-[11px] text-gray-500">SAP: <span className="font-semibold text-gray-700">{user.sapId}</span></span>
          )}
          {user.projectLocation && (
            <span className="text-[11px] text-gray-500">{user.projectLocation}</span>
          )}
        </div>
      </div>
    </div>
  );
};
