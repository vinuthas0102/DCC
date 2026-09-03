import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, LogIn, Users, Shield, Home } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { UserRole } from '../types';

const ACCENT_CLASSES: Record<string, { active: string; dot: string }> = {
  blue: { active: 'bg-blue-600 text-white shadow-md', dot: 'bg-blue-300' },
  teal: { active: 'bg-teal-600 text-white shadow-md', dot: 'bg-teal-300' },
  amber: { active: 'bg-amber-600 text-white shadow-md', dot: 'bg-amber-300' },
};

const RoleButton: React.FC<{
  role: UserRole;
  selected: UserRole;
  onSelect: (r: UserRole) => void;
  accent?: 'blue' | 'teal' | 'amber';
}> = ({ role, selected, onSelect, accent = 'blue' }) => {
  const isActive = selected === role;
  const cls = ACCENT_CLASSES[accent];
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-start gap-3 ${
        isActive ? cls.active : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isActive ? cls.dot : 'bg-gray-300'}`} />
      <div className="min-w-0">
        <div className="font-medium text-sm">{ROLE_LABELS[role]}</div>
        <div className={`text-xs mt-0.5 ${isActive ? 'opacity-80' : 'text-gray-500'}`}>
          {ROLE_DESCRIPTIONS[role]}
        </div>
      </div>
    </button>
  );
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const addToast = useUIStore((state) => state.addToast);

  const [email, setEmail] = useState('demo@fms.com');
  const [password, setPassword] = useState('demo123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('public');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password, selectedRole);
      try { localStorage.removeItem('dccView'); } catch { /* ignore */ }
      addToast('Login successful', 'success');
      if (selectedRole === 'admin') {
        navigate(ROUTES.PROPERTIES);
      } else if (selectedRole === 'manager') {
        navigate(ROUTES.QUARTERS_REQUESTS);
      } else if (selectedRole === 'govt_official') {
        navigate(ROUTES.QUARTERS_REQUESTS);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      addToast(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-xl mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Facilities Management</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slideUp">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={20} />}
              required
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={20} />}
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              icon={<LogIn size={20} />}
            >
              Sign In
            </Button>
          </form>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Demo Role Switcher</h3>
          <p className="text-xs text-gray-400 mb-4">Select a role then click Sign In</p>

          {/* General public */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              <Users size={11} /> General Access
            </div>
            <div className="space-y-1.5">
              {(['public', 'dept_user'] as UserRole[]).map((role) => (
                <RoleButton key={role} role={role} selected={selectedRole} onSelect={setSelectedRole} />
              ))}
            </div>
          </div>

          {/* Govt / Quarters */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              <Home size={11} /> Government / Quarters
            </div>
            <div className="space-y-1.5">
              {(['govt_official'] as UserRole[]).map((role) => (
                <RoleButton key={role} role={role} selected={selectedRole} onSelect={setSelectedRole} accent="teal" />
              ))}
            </div>
          </div>

          {/* Admin / Manager */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              <Shield size={11} /> Administration
            </div>
            <div className="space-y-1.5">
              {(['manager', 'admin'] as UserRole[]).map((role) => (
                <RoleButton key={role} role={role} selected={selectedRole} onSelect={setSelectedRole} accent="amber" />
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Demo credentials: demo@fms.com / demo123
        </p>
      </div>
    </div>
  );
};
