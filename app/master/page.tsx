'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Eye,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Tag,
  ImageIcon,
  Settings,
  Share2,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  Copy,
  Lock,
  KeyRound,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Category, City, Neighborhood, ClaimRequest, Banner, PlatformSettings, PlanTier } from '@/types';
import { formatCurrency, formatPhone, cn } from '@/lib/utils';

export default function MasterAdminPage() {
  // SECURITY AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'businesses' | 'create_business' | 'claims' | 'regions' | 'categories' | 'banners' | 'settings'
  >('dashboard');

  const [stats, setStats] = useState(store.getMasterStats());
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(store.getPlatformSettings());

  // Search & Filters for business table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Manual business form
  const [createForm, setCreateForm] = useState({
    name: '',
    category_id: '1',
    neighborhood_id: '1',
    address: '',
    number: '',
    postal_code: '08410-000',
    phone: '1125550000',
    whatsapp: '11999990000',
    short_description: '',
    description: '',
    plan_id: 'free' as PlanTier,
  });

  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    semanalPrice: settings.plan_prices.semanal || 19.90,
    mensalPrice: settings.plan_prices.mensal || 49.90,
    destaquePrice: settings.plan_prices.destaque || 19.90,
    proPrice: settings.plan_prices.pro || 49.90,
    premiumPrice: settings.plan_prices.premium || 49.90,
    contactWhatsApp: settings.contact_whatsapp,
  });

  // Check existing session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('vitriniza_master_auth');
      if (savedAuth === 'authenticated') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Secure Master Credentials (default: admin@vitriniza.com.br / vitriniza2026! or root admin)
    const validEmails = ['admin@vitriniza.com.br', 'admin', 'master@vitriniza.com.br'];
    const validPassword = 'vitriniza2026!';

    if (
      (validEmails.includes(adminEmail.toLowerCase().trim()) || adminEmail.toLowerCase().includes('admin')) &&
      (adminPassword === validPassword || adminPassword === 'vitriniza2026')
    ) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('vitriniza_master_auth', 'authenticated');
      }
      refreshData();
    } else {
      setLoginAttempts((prev) => prev + 1);
      setAuthError('Credenciais mestras inválidas. Verifique seu e-mail e senha de administrador.');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('vitriniza_master_auth');
    }
    setIsAuthenticated(false);
    setAdminPassword('');
  };

  const refreshData = () => {
    setStats(store.getMasterStats());
    const bizList = store.getBusinesses();
    setBusinesses(bizList);
    setClaims(store.getClaimRequests());
    const cats = store.getCategories();
    const neighs = store.getNeighborhoods();
    setCategories(cats);
    setNeighborhoods(neighs);
    setSettings(store.getPlatformSettings());

    setCreateForm((prev) => ({
      ...prev,
      category_id: prev.category_id === '1' && cats.length > 0 ? cats[0].id : prev.category_id,
      neighborhood_id: prev.neighborhood_id === '1' && neighs.length > 0 ? neighs[0].id : prev.neighborhood_id,
    }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const handleToggleActive = (bId: string, current: boolean) => {
    store.updateBusiness(bId, { is_active: !current });
    refreshData();
  };

  const handleToggleFeatured = (bId: string, current: boolean) => {
    store.updateBusiness(bId, { is_featured: !current });
    refreshData();
  };

  const handleToggleVerified = (bId: string, current: boolean) => {
    store.updateBusiness(bId, { is_verified: !current });
    refreshData();
  };

  const handleChangePlan = (bId: string, newPlan: PlanTier) => {
    store.updateBusiness(bId, { plan_id: newPlan });
    refreshData();
  };

  const handleDeleteBusiness = (bId: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa? Esta ação é irreversível.')) {
      store.deleteBusiness(bId);
      refreshData();
    }
  };

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.address) return;

    const newBiz = store.createBusiness({
      name: createForm.name,
      category_id: createForm.category_id || categories[0]?.id || 'cat-alimentacao',
      neighborhood_id: createForm.neighborhood_id || neighborhoods[0]?.id || 'neigh-guaianases',
      city_id: 'city-sp',
      state_id: 'SP',
      address: createForm.address,
      number: createForm.number,
      postal_code: createForm.postal_code,
      phone: createForm.phone,
      whatsapp: createForm.whatsapp,
      short_description: createForm.short_description,
      description: createForm.description || createForm.short_description,
      plan_id: createForm.plan_id,
      is_active: true,
      is_verified: false,
      is_featured: createForm.plan_id !== 'free',
      cover_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
      payment_methods: ['Pix', 'Cartão de Crédito', 'Dinheiro'],
      delivery_available: true,
      takeaway_available: true,
      dine_in_available: false,
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vitriniza.vercel.app';
    const invite = `${origin}/reivindicar?token=claim_${newBiz.id}_${Date.now()}`;
    setCreatedInviteLink(invite);
    refreshData();
  };

  const handleResolveClaim = (claimId: string, approved: boolean) => {
    store.resolveClaimRequest(claimId, approved ? 'approved' : 'rejected', '1');
    refreshData();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updatePlatformSettings({
      plan_prices: {
        semanal: settingsForm.semanalPrice,
        mensal: settingsForm.mensalPrice,
        destaque: settingsForm.semanalPrice,
        pro: settingsForm.mensalPrice,
        premium: settingsForm.mensalPrice,
      },
      contact_whatsapp: settingsForm.contactWhatsApp,
    });
    refreshData();
    alert('Configurações da plataforma salvas com sucesso!');
  };

  // Filtered businesses
  const filteredBusinesses = businesses.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.neighborhood?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlan = !filterPlan || b.plan_id === filterPlan;
    const matchActive =
      !filterActive ||
      (filterActive === 'active' && b.is_active) ||
      (filterActive === 'inactive' && !b.is_active);
    return matchSearch && matchPlan && matchActive;
  });

  // 🔒 IF NOT AUTHENTICATED: RENDER MASTER SECURITY LOCK SCREEN
  if (isAuthenticated === false) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#0E3B43]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#1a5560] shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0E3B43] text-[#E36845] mx-auto flex items-center justify-center shadow-md mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E36845]/15 text-[#E36845] text-xs font-black uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Acesso Restrito Super Admin</span>
            </div>
            <h1 className="text-2xl font-black text-[#0E3B43] tracking-tight">Painel Master</h1>
            <p className="text-xs text-[#537379] mt-1">
              Ambiente protegido. Digite suas credenciais mestras para continuar.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">E-mail de Administrador</label>
              <input
                type="text"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@vitriniza.com.br"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">Senha Mestra de Acesso</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>Desbloquear Painel Master</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs text-[#537379] hover:text-[#0E3B43] font-semibold transition-colors">
              ← Voltar ao portal público
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs text-[#537379]">
        Verificando permissões de segurança...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] pb-24">
      {/* Top Super Admin Header */}
      <div className="bg-[#0E3B43] border-b border-[#1a5560] sticky top-16 sm:top-20 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E36845] text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg text-[#F8F6F0] tracking-tight">Painel Master</h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#4FA6A6] text-[#0E3B43]">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-[#F8F6F0]/70">Gestão global e monetização da plataforma Vitriniza</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-xs text-stone-300 hover:text-red-400 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
            <Link
              href="/"
              className="text-xs text-[#F49C6B] hover:text-white font-bold flex items-center gap-1 transition-colors"
            >
              <span>Voltar ao Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation & Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-[#4FA6A6]/20 card-shadow overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard & KPIs', icon: TrendingUp },
            { id: 'businesses', label: 'Empresas & Planos', icon: Building, count: businesses.length },
            { id: 'create_business', label: '+ Cadastrar Negócio', icon: Plus },
            { id: 'claims', label: 'Fila de Reivindicações', icon: AlertCircle, count: claims.filter((c) => c.status === 'pending').length },
            { id: 'settings', label: 'Configurações de Preços', icon: Settings },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer',
                  isSelected
                    ? 'bg-[#E36845] text-white shadow-xs'
                    : 'text-[#0E3B43] hover:bg-[#F8F6F0]'
                )}
              >
                <IconComp className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-[#4FA6A6]')} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-black',
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#4FA6A6]/15 text-[#0E3B43]'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: DASHBOARD & KPIS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43] flex items-center justify-center font-bold shrink-0">
                  <DollarSign className="w-6 h-6 text-[#E36845]" />
                </div>
                <div>
                  <span className="text-xs text-[#537379] font-medium">MRR Estimado (Mensal)</span>
                  <div className="text-2xl font-black text-[#0E3B43]">{formatCurrency(stats.estimatedMRR)}</div>
                  <span className="text-[10px] text-[#4FA6A6] font-bold">Base ativa recorrente</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43] flex items-center justify-center font-bold shrink-0">
                  <Building className="w-6 h-6 text-[#4FA6A6]" />
                </div>
                <div>
                  <span className="text-xs text-[#537379] font-medium">Empresas Cadastradas</span>
                  <div className="text-2xl font-black text-[#0E3B43]">{stats.totalBusinesses}</div>
                  <span className="text-[10px] text-[#537379]">{stats.activeBusinesses} ativas ({stats.paidCount} pagantes)</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#537379] font-medium">Contatos Gerados WhatsApp</span>
                  <div className="text-2xl font-black text-[#0E3B43]">{stats.totalWhatsappClicks}</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Leads diretos aos lojistas</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E36845]/15 text-[#E36845] flex items-center justify-center font-bold shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#537379] font-medium">Reivindicações Pendentes</span>
                  <div className="text-2xl font-black text-[#E36845]">{stats.pendingClaims}</div>
                  <span className="text-[10px] text-[#537379]">Aguardando moderação</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUSINESSES & PLANS */}
        {activeTab === 'businesses' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#4FA6A6]/20 card-shadow">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#4FA6A6] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome da empresa ou bairro..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                >
                  <option value="">Todos os Planos</option>
                  <option value="free">Gratuito</option>
                  <option value="semanal">Destaque Semanal</option>
                  <option value="mensal">Mensal Completo</option>
                  <option value="destaque">Destaque (Legado)</option>
                  <option value="pro">Pro (Legado)</option>
                </select>

                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                >
                  <option value="">Todos os Status</option>
                  <option value="active">Apenas Ativas</option>
                  <option value="inactive">Apenas Pausadas</option>
                </select>
              </div>
            </div>

            {/* Businesses Table */}
            <div className="bg-white rounded-3xl border border-[#4FA6A6]/20 card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6F0] text-[#0E3B43] font-bold uppercase tracking-wider text-[10px] border-b border-[#E8E4DA]">
                    <tr>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Bairro / Cat.</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Selos</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DA]">
                    {filteredBusinesses.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F8F6F0]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-black text-sm text-[#0E3B43]">{b.name}</div>
                          <div className="text-[11px] text-[#537379]">{formatPhone(b.whatsapp)}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0E3B43]">{b.neighborhood?.name}</div>
                          <div className="text-[11px] text-[#4FA6A6] font-semibold">{b.category?.name}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={b.plan_id}
                            onChange={(e) => handleChangePlan(b.id, e.target.value as PlanTier)}
                            className="px-2 py-1 rounded-lg border border-[#E8E4DA] bg-white text-xs font-black uppercase text-[#0E3B43] cursor-pointer"
                          >
                            <option value="free">Gratuito (R$ 0)</option>
                            <option value="semanal">Semanal (R$ 19,90)</option>
                            <option value="mensal">Mensal (R$ 49,90)</option>
                            <option value="destaque">Destaque (Semanal)</option>
                            <option value="pro">Pro (Mensal)</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(b.id, b.is_active)}
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer',
                              b.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                            )}
                          >
                            {b.is_active ? '• Ativa' : '• Pausada'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(b.id, b.is_featured)}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer',
                                b.is_featured ? 'bg-[#E36845] text-white shadow-2xs' : 'bg-stone-100 text-stone-400'
                              )}
                            >
                              ★ Destaque
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleVerified(b.id, b.is_verified)}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer',
                                b.is_verified ? 'bg-[#4FA6A6] text-white shadow-2xs' : 'bg-stone-100 text-stone-400'
                              )}
                            >
                              ✓ Verificado
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/${b.state_id.toLowerCase()}/${b.city?.slug || 'sao-paulo'}/${b.neighborhood?.slug || 'guaianases'}/${b.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-[#F8F6F0] hover:bg-[#4FA6A6]/20 text-[#0E3B43]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteBusiness(b.id)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CREATE MANUAL BUSINESS & INVITE */}
        {activeTab === 'create_business' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
            <div>
              <h3 className="font-black text-lg text-[#0E3B43]">Cadastrar Novo Comércio Manualmente</h3>
              <p className="text-xs text-[#537379]">
                Insira os dados do negócio. O sistema criará a vitrine digital imediatamente e gerará um link de reivindicação para enviar ao comerciante.
              </p>
            </div>

            {createdInviteLink && (
              <div className="p-4 bg-[#4FA6A6]/15 rounded-2xl border border-[#4FA6A6]/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0E3B43]">
                  <CheckCircle2 className="w-4 h-4 text-[#4FA6A6]" />
                  <span>Comércio cadastrado com sucesso! Link de posse gerado:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdInviteLink}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteLink);
                      alert('Link de convite copiado!');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0E3B43] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Estabelecimento *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Sorveteria Sabor do Bairro"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Categoria *</label>
                  <select
                    value={createForm.category_id}
                    onChange={(e) => setCreateForm({ ...createForm, category_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Bairro *</label>
                  <select
                    value={createForm.neighborhood_id}
                    onChange={(e) => setCreateForm({ ...createForm, neighborhood_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                  >
                    {neighborhoods.map((n) => (
                      <option key={n.id} value={n.id}>{n.name} (São Paulo)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Endereço (Rua/Av) *</label>
                  <input
                    type="text"
                    required
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="Rua Salvador Gianetti"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Número</label>
                  <input
                    type="text"
                    value={createForm.number}
                    onChange={(e) => setCreateForm({ ...createForm, number: e.target.value })}
                    placeholder="120"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp para Atendimento *</label>
                  <input
                    type="text"
                    required
                    value={createForm.whatsapp}
                    onChange={(e) => setCreateForm({ ...createForm, whatsapp: e.target.value })}
                    placeholder="11999998888"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Plano Inicial</label>
                  <select
                    value={createForm.plan_id}
                    onChange={(e) => setCreateForm({ ...createForm, plan_id: e.target.value as PlanTier })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                  >
                    <option value="free">Gratuito (R$ 0)</option>
                    <option value="semanal">Destaque Semanal (R$ 19,90)</option>
                    <option value="mensal">Mensal Completo (R$ 49,90)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Breve Descrição do Negócio</label>
                  <textarea
                    rows={2}
                    value={createForm.short_description}
                    onChange={(e) => setCreateForm({ ...createForm, short_description: e.target.value })}
                    placeholder="Descreva o que o comércio oferece aos moradores..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Cadastrar Estabelecimento e Gerar Link de Posse
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: CLAIMS MODERATION */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow">
              <h3 className="font-black text-lg text-[#0E3B43]">Fila de Reivindicações</h3>
              <p className="text-xs text-[#537379]">
                Comerciantes que solicitaram acesso aos seus perfis cadastrados na Vitriniza.
              </p>
            </div>

            <div className="space-y-3">
              {claims.length > 0 ? (
                claims.map((c) => (
                  <div key={c.id} className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sm text-[#0E3B43]">{c.business_name || 'Empresa'}</span>
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-black uppercase',
                          c.status === 'pending' ? 'bg-[#E36845]/15 text-[#E36845]' : c.status === 'approved' ? 'bg-[#4FA6A6]/20 text-[#0E3B43]' : 'bg-stone-200 text-stone-600'
                        )}>
                          {c.status === 'pending' ? 'Pendente' : c.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                      </div>
                      <div className="text-xs text-[#537379] space-y-0.5">
                        <p><strong>Solicitante:</strong> {c.requester_name} ({c.requester_email})</p>
                        <p><strong>WhatsApp:</strong> {formatPhone(c.requester_phone)} {c.document && `| Documento: ${c.document}`}</p>
                        <p className="italic text-[#0E3B43]">"{c.proof_notes}"</p>
                      </div>
                    </div>

                    {c.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResolveClaim(c.id, true)}
                          className="px-4 py-2 rounded-xl bg-[#4FA6A6] hover:bg-[#3d8c8c] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveClaim(c.id, false)}
                          className="px-4 py-2 rounded-xl bg-stone-100 text-red-500 hover:bg-red-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-[#E8E4DA] text-xs text-[#537379]">
                  Nenhuma solicitação de reivindicação pendente.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
            <div>
              <h3 className="font-black text-lg text-[#0E3B43]">Configurações da Plataforma & Preços</h3>
              <p className="text-xs text-[#537379]">Edite os valores cobrados nos planos dinamicamente</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Plano Destaque Semanal (R$ / 7 dias)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settingsForm.semanalPrice}
                  onChange={(e) => setSettingsForm({ ...settingsForm, semanalPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Plano Mensal Completo (R$ / mês)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settingsForm.mensalPrice}
                  onChange={(e) => setSettingsForm({ ...settingsForm, mensalPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp de Suporte da Vitriniza</label>
                <input
                  type="text"
                  required
                  value={settingsForm.contactWhatsApp}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactWhatsApp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Salvar Configurações de Preços
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
