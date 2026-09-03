import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark, LogIn, ArrowRight, Receipt, Calculator, Users,
  ShieldCheck, TrendingUp, FileText, CheckCircle2, Clock,
  Wallet, AlertTriangle, Building2, Car, Wrench,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { ROUTES } from '../constants/routes';

const DCCLandingNavbar: React.FC<{ isScrolled: boolean }> = ({ isScrolled }) => {
  const navigate = useNavigate();
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <Landmark size={20} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className={`text-base font-bold tracking-tight ${isScrolled ? 'text-white' : 'text-white'}`}>
                DCC
              </div>
              <div className={`text-[10px] font-medium ${isScrolled ? 'text-emerald-400' : 'text-emerald-300'}`}>
                Demand & Collection Center
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-slate-300 hover:text-white' : 'text-white/80 hover:text-white'}`}>
              Features
            </a>
            <a href="#capabilities" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-slate-300 hover:text-white' : 'text-white/80 hover:text-white'}`}>
              Capabilities
            </a>
            <a href="#stats" className={`text-sm font-medium transition-colors ${isScrolled ? 'text-slate-300 hover:text-white' : 'text-white/80 hover:text-white'}`}>
              Dashboard
            </a>
          </nav>

          {/* Login button */}
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <LogIn size={16} />
            Login / Portal
          </button>
        </div>
      </div>
    </header>
  );
};

const HeroSection: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800" />
      {/* Decorative circles */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-blue-600 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-teal-500 rounded-full blur-3xl opacity-50" />
      </div>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6 animate-fadeIn">
          <ShieldCheck size={14} />
          Enterprise-Grade Demand Management Platform
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          Demand & Collection Center
          <span className="block text-emerald-400 mt-2">(DCC)</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Enterprise Demand Tracking, Asset Revenue Management & Automated Collections
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95 w-full sm:w-auto"
          >
            <LogIn size={20} />
            Sign In to Portal
          </button>
          <button
            onClick={onExplore}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-base font-semibold transition-all duration-200 active:scale-95 w-full sm:w-auto"
          >
            Explore Features
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-16 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          {[
            { label: 'Demand Types', value: '7+' },
            { label: 'Asset Categories', value: '5+' },
            { label: 'Payment Modes', value: '5+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">{stat.value}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
  gradient: string;
  iconBg: string;
}

const FEATURES: FeatureCard[] = [
  {
    icon: <Receipt size={24} className="text-white" />,
    title: 'Multi-Asset Billing',
    description: 'Generate demands across diverse asset categories with unified tracking.',
    items: ['Properties & Real Estate', 'Vehicles & Fleet', 'Equipment & Machinery'],
    gradient: 'from-blue-600 to-blue-700',
    iconBg: 'bg-blue-600',
  },
  {
    icon: <Calculator size={24} className="text-white" />,
    title: 'Dynamic Line-Item Calculations',
    description: 'Flexible itemized billing with automatic tax and fee computation.',
    items: ['Rent & Advance', 'Taxes & GST', 'Utilities & Maintenance'],
    gradient: 'from-emerald-600 to-emerald-700',
    iconBg: 'bg-emerald-600',
  },
  {
    icon: <Users size={24} className="text-white" />,
    title: 'Client-Wise Grouped Collections',
    description: 'Consolidated view of all demands per client with automated installment plans.',
    items: ['Grouped by Owner', 'Automated Installments', 'Early Payment Discounts'],
    gradient: 'from-teal-600 to-cyan-700',
    iconBg: 'bg-teal-600',
  },
  {
    icon: <ShieldCheck size={24} className="text-white" />,
    title: 'Dispute Resolution & Audit Logs',
    description: 'Track disputes, log every action, and maintain complete audit trails.',
    items: ['Dispute Tracking', 'Full Audit Logs', 'Reconciliation Reports'],
    gradient: 'from-amber-600 to-orange-700',
    iconBg: 'bg-amber-600',
  },
];

const FeatureGrid: React.FC = () => (
  <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-animate>
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Core DCC Capabilities
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Everything you need to manage demands, track collections, and reconcile payments across all asset types.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((feature, idx) => (
          <div
            key={feature.title}
            className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Gradient header */}
            <div className={`h-1.5 bg-gradient-to-r ${feature.gradient}`} />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center shadow-md flex-shrink-0`}>
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{feature.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{feature.description}</p>
                </div>
              </div>
              <ul className="space-y-2 mt-4">
                {feature.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

interface Capability {
  icon: React.ReactNode;
  label: string;
  description: string;
}

const CAPABILITIES: Capability[] = [
  { icon: <Building2 size={20} />, label: 'Properties', description: 'Rent, advance, property tax' },
  { icon: <Car size={20} />, label: 'Vehicles', description: 'Fleet charges & maintenance' },
  { icon: <Wrench size={20} />, label: 'Equipment', description: 'Machinery & tool billing' },
  { icon: <Receipt size={20} />, label: 'Loans', description: 'Installment tracking & EMIs' },
  { icon: <FileText size={20} />, label: 'Reports', description: 'MIS, reconciliation & audit' },
  { icon: <Wallet size={20} />, label: 'Payments', description: 'UPI, card, cheque & more' },
];

const CapabilitiesSection: React.FC = () => (
  <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50" data-animate>
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Supported Asset Types & Workflows
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          A unified platform for every category of billable asset your organization manages.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {CAPABILITIES.map((cap, idx) => (
          <div
            key={cap.label}
            className="bg-white rounded-xl border border-slate-200 p-5 text-center hover:shadow-lg hover:border-emerald-300 transition-all duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mx-auto mb-3 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              {cap.icon}
            </div>
            <h3 className="text-sm font-bold text-slate-900">{cap.label}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cap.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const StatsSection: React.FC = () => {
  const stats = [
    { icon: <Receipt size={24} />, label: 'Total Demands', color: 'text-slate-700', bg: 'bg-slate-100' },
    { icon: <CheckCircle2 size={24} />, label: 'Collected', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: <Clock size={24} />, label: 'Outstanding', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: <AlertTriangle size={24} />, label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900" data-animate>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            High-Density Dashboard
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Real-time KPIs, client-wise grouped views, and drill-down demand tracking — all in one screen.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 text-center"
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} mx-auto mb-4`}>
                {stat.icon}
              </div>
              <div className="text-sm font-bold text-slate-300 uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
            <TrendingUp size={20} className="text-emerald-400" />
            <span className="text-emerald-300 font-semibold text-sm">
              Collection rate tracking with auto-computed overdue penalties
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-800" data-animate>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Ready to Streamline Your Collections?
        </h2>
        <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
          Sign in to the DCC portal to access demand tracking, payment recording, reconciliation, and automated reporting.
        </p>
        <button
          onClick={() => navigate(ROUTES.LOGIN)}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold shadow-xl transition-all duration-200 hover:shadow-2xl active:scale-95"
        >
          <LogIn size={22} />
          Sign In to Portal
        </button>
      </div>
    </section>
  );
};

const LandingFooter: React.FC = () => (
  <footer className="bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Landmark size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">DCC</div>
            <div className="text-[10px] text-slate-400">Demand & Collection Center</div>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Enterprise Demand Tracking & Collection Management Platform
        </p>
      </div>
    </div>
  </footer>
);

export const LandingPage: React.FC = () => {
  const { isScrolled } = useScrollAnimation();
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <DCCLandingNavbar isScrolled={isScrolled} />
      <HeroSection onExplore={scrollToFeatures} />
      <FeatureGrid />
      <CapabilitiesSection />
      <StatsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};
