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
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Category, City, Neighborhood, ClaimRequest, Banner, PlatformSettings, PlanTier } from '@/types';
import { formatCurrency, formatPhone, cn } from '@/lib/utils';

export default function MasterAdminPage() {
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
    destaquePrice: settings.plan_prices.destaque,
    proPrice: settings.plan_prices.pro,
    premiumPrice: settings.plan_prices.premium,
    contactWhatsApp: settings.contact_whatsapp,
  });

  const refreshData = () => {
    setStats(store.getMasterStats());
    setBusinesses(store.getBusinesses());
    setClaims(store.getClaimRequests());
    setCategories(store.getCategories());
    setNeighborhoods(store.getNeighborhoods());
    setSettings(store.getPlatformSettings());
  };

  useEffect(() => {
    refreshData();
  }, []);

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
      category_id: createForm.category_id,
      neighborhood_id: createForm.neighborhood_id,
      city_id: '1',
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

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vitriniza.com.br';
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
        destaque: settingsForm.destaquePrice,
        pro: settingsForm.proPrice,
        premium: settingsForm.premiumPrice,
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

  return (
    <div className="min-h-screen bg-[#F8F6F0] pb-20">
      {/* Master Subheader */}
      <div className="bg-[#0E3B43] text-[#F8F6F0] border-b border-[#1a5560] shadow-md">
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

          <Link
            href="/"
            className="text-xs text-[#F49C6B] hover:text-white font-bold flex items-center gap-1 transition-colors"
          >
            <span>Voltar ao Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
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
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0',
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
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#537379] uppercase">Total de Empresas</span>
                  <Building className="w-5 h-5 text-[#4FA6A6]" />
                </div>
                <div className="text-3xl font-black text-[#0E3B43]">{stats.totalBusinesses}</div>
                <span className="text-xs text-[#4FA6A6] font-bold mt-1 block">
                  {stats.activeBusinesses} ativas ({stats.freeCount} grátis / {stats.paidCount} pagantes)
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#537379] uppercase">MRR Estimado</span>
                  <DollarSign className="w-5 h-5 text-[#E36845]" />
                </div>
                <div className="text-3xl font-black text-[#E36845]">
                  {formatCurrency(stats.estimatedMRR)}
                </div>
                <span className="text-xs text-[#537379] mt-1 block">Receita recorrente mensal</span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#537379] uppercase">Leads no WhatsApp</span>
                  <MessageCircle className="w-5 h-5 text-[#4FA6A6]" />
                </div>
                <div className="text-3xl font-black text-[#0E3B43]">{stats.totalWhatsappClicks}</div>
                <span className="text-xs text-[#4FA6A6] font-bold mt-1 block">Cliques diretos de compra</span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#537379] uppercase">Reivindicações</span>
                  <AlertCircle className="w-5 h-5 text-[#E36845]" />
                </div>
                <div className="text-3xl font-black text-[#0E3B43]">{stats.pendingClaims}</div>
                <span className="text-xs text-[#E36845] font-bold mt-1 block">Aguardando moderação</span>
              </div>
            </div>

            {/* Platform Quick Actions */}
            <div className="p-6 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow space-y-4">
              <h3 className="font-black text-base text-[#0E3B43]">Ações Rápidas de Super Administrador</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('create_business')}
                  className="p-4 rounded-2xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 border border-[#4FA6A6]/30 text-left transition-all group"
                >
                  <Plus className="w-6 h-6 text-[#E36845] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-black text-sm text-[#0E3B43]">Cadastrar Empresa Manual</div>
                  <div className="text-xs text-[#537379] mt-0.5">Cadastre o comércio e gere o link de posse</div>
                </button>

                <button
                  onClick={() => setActiveTab('claims')}
                  className="p-4 rounded-2xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 border border-[#4FA6A6]/30 text-left transition-all group"
                >
                  <AlertCircle className="w-6 h-6 text-[#E36845] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-black text-sm text-[#0E3B43]">Moderar Reivindicações</div>
                  <div className="text-xs text-[#537379] mt-0.5">{stats.pendingClaims} solicitações na fila</div>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 rounded-2xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 border border-[#4FA6A6]/30 text-left transition-all group"
                >
                  <Settings className="w-6 h-6 text-[#4FA6A6] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-black text-sm text-[#0E3B43]">Ajustar Preços dos Planos</div>
                  <div className="text-xs text-[#537379] mt-0.5">Altere os valores cobrados sem código</div>
                </button>
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
                  className="px-3 py-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
                >
                  <option value="">Todos os Planos</option>
                  <option value="free">Gratuito</option>
                  <option value="destaque">Destaque</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>

                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
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
                            <option value="destaque">Destaque (R$ 49)</option>
                            <option value="pro">Pro (R$ 99)</option>
                            <option value="premium">Premium (R$ 199)</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(b.id, b.is_active)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                              b.is_active ? 'bg-[#4FA6A6]/20 text-[#0E3B43]' : 'bg-stone-200 text-stone-600'
                            )}
                          >
                            {b.is_active ? '● Ativa' : '○ Pausada'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(b.id, b.is_featured)}
                              title="Alternar Destaque"
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold',
                                b.is_featured ? 'bg-[#E36845] text-white' : 'bg-stone-100 text-stone-400'
                              )}
                            >
                              ★ Destaque
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleVerified(b.id, b.is_verified)}
                              title="Alternar Selo Verificado"
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold',
                                b.is_verified ? 'bg-[#4FA6A6] text-white' : 'bg-stone-100 text-stone-400'
                              )}
                            >
                              ✓ Verificado
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/${b.state_id.toLowerCase()}/${b.city?.slug || 'sao-paulo'}/${b.neighborhood?.slug || 'guaianases'}/${b.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-[#0E3B43] hover:bg-[#4FA6A6]/15"
                              title="Ver página"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDeleteBusiness(b.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                              title="Excluir empresa"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* TAB 3: CREATE BUSINESS */}
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
                    className="px-4 py-2 rounded-xl bg-[#0E3B43] text-white text-xs font-bold flex items-center gap-1 shadow-xs"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none"
                  >
                    {neighborhoods.map((n) => (
                      <option key={n.id} value={n.id}>{n.name} (São Paulo)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Endereço (Rua / Av.) *</label>
                  <input
                    type="text"
                    required
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="Rua Salvador Gianetti"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Número</label>
                  <input
                    type="text"
                    value={createForm.number}
                    onChange={(e) => setCreateForm({ ...createForm, number: e.target.value })}
                    placeholder="350"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp Comercial</label>
                  <input
                    type="text"
                    value={createForm.whatsapp}
                    onChange={(e) => setCreateForm({ ...createForm, whatsapp: e.target.value })}
                    placeholder="11999998888"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Plano Inicial</label>
                  <select
                    value={createForm.plan_id}
                    onChange={(e) => setCreateForm({ ...createForm, plan_id: e.target.value as PlanTier })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none"
                  >
                    <option value="free">Gratuito (R$ 0)</option>
                    <option value="destaque">Destaque</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Descrição Curta</label>
                  <input
                    type="text"
                    value={createForm.short_description}
                    onChange={(e) => setCreateForm({ ...createForm, short_description: e.target.value })}
                    placeholder="Especialistas em sorvetes artesanais e picolés no bairro."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Cadastrar Empresa e Gerar Link de Reivindicação
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: CLAIMS MODERATION */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow">
              <h3 className="font-black text-lg text-[#0E3B43]">Fila de Reivindicações de Posse</h3>
              <p className="text-xs text-[#537379]">Proprietários que solicitaram acesso administrativo aos perfis cadastrados</p>
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
                          className="px-4 py-2 rounded-xl bg-[#4FA6A6] hover:bg-[#3d8c8c] text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveClaim(c.id, false)}
                          className="px-4 py-2 rounded-xl bg-stone-100 text-red-500 hover:bg-red-50 text-xs font-bold flex items-center gap-1"
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
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Plano Destaque (R$/mês)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settingsForm.destaquePrice}
                  onChange={(e) => setSettingsForm({ ...settingsForm, destaquePrice: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Plano Pro (R$/mês)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settingsForm.proPrice}
                  onChange={(e) => setSettingsForm({ ...settingsForm, proPrice: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Plano Premium (R$/mês)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settingsForm.premiumPrice}
                  onChange={(e) => setSettingsForm({ ...settingsForm, premiumPrice: parseFloat(e.target.value) })}
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
                className="px-6 py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-md transition-all"
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
