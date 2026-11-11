'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Globe,
  ExternalLink,
  ChevronRight,
  Layers,
  Wand2,
  RefreshCw,
  Printer,
  FileText,
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  Phone,
  Navigation,
  Eye,
  BarChart3,
  Lock,
  Store,
  Info,
  Tag,
  Clock,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { store } from '@/lib/data/store';
import {
  Business,
  GoogleIntegration,
  GoogleIntegrationProvider,
  SeoAudit,
  SeoOptimization,
  IntelligenceTabId,
} from '@/types';
import { BusinessIntelligenceOverview } from '@/lib/intelligence/analytics-service';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { getActiveMembershipBusinessIds } from '@/lib/auth/client';

function getProviderDisplayName(provider: GoogleIntegrationProvider): string {
  switch (provider) {
    case 'google_search_console':
      return 'Google Search Console';
    case 'google_analytics_4':
      return 'Google Analytics 4 (GA4)';
    case 'google_business_profile':
      return 'Google Perfil da Empresa (GBP)';
    case 'google_merchant_center':
      return 'Google Merchant Center';
    default:
      return 'Serviço Google';
  }
}

export default function LocalIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-[#0E3B43] font-bold">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0D9488]" />
          <span>Carregando Konnexy Local Intelligence...</span>
        </div>
      </div>
    }>
      <LocalIntelligenceContent />
    </Suspense>
  );
}

function LocalIntelligenceContent() {
  const searchParams = useSearchParams();
  const queryBusinessId = searchParams.get('b');

  // Core State
  const [activeTab, setActiveTab] = useState<IntelligenceTabId>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(30);
  const [business, setBusiness] = useState<Business | null>(null);
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Intelligence State
  const [overview, setOverview] = useState<BusinessIntelligenceOverview | null>(null);
  const [seoAudit, setSeoAudit] = useState<SeoAudit | null>(null);
  const [optimizations, setOptimizations] = useState<SeoOptimization[]>([]);
  const [integrations, setIntegrations] = useState<GoogleIntegration[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [applyingFixCode, setApplyingFixCode] = useState<string | null>(null);

  // Modals & UI
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<GoogleIntegration | null>(null);
  const [integrationConfigForm, setIntegrationConfigForm] = useState({
    propertyId: '',
    measurementId: '',
    siteUrl: '',
    merchantId: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth & Business Loading
  useEffect(() => {
    let active = true;

    const checkAuthAndLoad = async () => {
      setIsLoading(true);
      await store.ensureCloudSynced();
      const allStores = store.getBusinesses();

      // Check Supabase session
      let memberIds: string[] = [];
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          memberIds = await getActiveMembershipBusinessIds();
        }
      }

      // Check Master Token fallback
      const isMasterLogged = typeof window !== 'undefined' && sessionStorage.getItem('vitriniza_master_auth') === 'true';

      let userStores: Business[] = [];
      if (isMasterLogged) {
        userStores = allStores;
      } else if (memberIds.length > 0) {
        userStores = allStores.filter((b) => memberIds.includes(b.id));
      } else if (process.env.NODE_ENV !== 'production' || allStores.length > 0) {
        userStores = allStores;
      }

      if (!active) return;

      setAvailableBusinesses(userStores);

      // Select business by URL param or first available
      const requestedId = queryBusinessId || (typeof window !== 'undefined' ? sessionStorage.getItem('vitriniza_selected_business') : null);
      const chosen = userStores.find((b) => b.id === requestedId) || userStores[0] || null;

      setBusiness(chosen);
      setIsLoading(false);
    };

    checkAuthAndLoad();

    const unsub = store.subscribe(() => {
      if (business) {
        refreshIntelligenceData(business.id);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [queryBusinessId]);

  // Refresh intelligence data whenever business or period changes
  const refreshIntelligenceData = (bizId: string) => {
    try {
      const dataOverview = store.getIntelligenceOverview(bizId, selectedPeriod);
      const audit = store.getLatestSeoAudit(bizId);
      const optHistory = store.getSeoOptimizations(bizId);
      const googleInts = store.getGoogleIntegrations(bizId);

      setOverview(dataOverview);
      setSeoAudit(audit);
      setOptimizations(optHistory);
      setIntegrations(googleInts);
    } catch (err) {
      console.error('[Konnexy Intelligence refresh error]', err);
    }
  };

  useEffect(() => {
    if (business) {
      refreshIntelligenceData(business.id);
    }
  }, [business?.id, selectedPeriod]);

  // Re-run SEO Audit
  const handleRunAudit = () => {
    if (!business) return;
    setIsAuditing(true);
    setTimeout(() => {
      try {
        const freshAudit = store.runSeoAudit(business.id);
        setSeoAudit(freshAudit);
        setOverview(store.getIntelligenceOverview(business.id, selectedPeriod));
        showToast('✓ Diagnóstico SEO atualizado em tempo real!', 'success');
      } catch {
        showToast('Erro ao executar diagnóstico.', 'error');
      } finally {
        setIsAuditing(false);
      }
    }, 600);
  };

  // Safe SEO Auto-Fix Handler
  const handleApplyFix = (issueCode: string) => {
    if (!business) return;
    setApplyingFixCode(issueCode);

    setTimeout(() => {
      try {
        const result = store.applySeoFix(business.id, issueCode);
        if (result.success) {
          showToast(`✓ ${result.message}`, 'success');
          const updatedBiz = store.getBusinessById(business.id);
          if (updatedBiz) setBusiness(updatedBiz);
          refreshIntelligenceData(business.id);
        } else {
          showToast(`Não foi possível corrigir: ${result.message}`, 'error');
        }
      } catch (e: unknown) {
        const errMessage = e instanceof Error ? e.message : 'Falha ao aplicar correção.';
        showToast(errMessage, 'error');
      } finally {
        setApplyingFixCode(null);
      }
    }, 500);
  };

  // Google Integration Save
  const handleSaveIntegration = () => {
    if (!business || !selectedIntegration) return;

    let configUpdates: Record<string, unknown> = {};
    if (selectedIntegration.provider === 'google_search_console') {
      configUpdates = { site_url: integrationConfigForm.siteUrl.trim() };
    } else if (selectedIntegration.provider === 'google_analytics_4') {
      configUpdates = { measurement_id: integrationConfigForm.measurementId.trim() };
    } else if (selectedIntegration.provider === 'google_business_profile') {
      configUpdates = { account_id: integrationConfigForm.propertyId.trim() };
    } else if (selectedIntegration.provider === 'google_merchant_center') {
      configUpdates = { merchant_id: integrationConfigForm.merchantId.trim() };
    }

    const providerLabel = selectedIntegration.provider_name || getProviderDisplayName(selectedIntegration.provider);

    store.updateGoogleIntegration(business.id, selectedIntegration.provider, {
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      config: {
        ...(selectedIntegration.config || {}),
        ...configUpdates,
      },
      error_message: undefined,
    });

    setIntegrations(store.getGoogleIntegrations(business.id));
    setIntegrationModalOpen(false);
    showToast(`✓ Integração com ${providerLabel} salva e ativa!`, 'success');
  };

  const handleDisconnectIntegration = (provider: GoogleIntegrationProvider) => {
    if (!business) return;
    store.updateGoogleIntegration(business.id, provider, {
      status: 'disconnected',
      error_message: undefined,
    });
    setIntegrations(store.getGoogleIntegrations(business.id));
    showToast(`Integração desconectada.`, 'info');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0D9488] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0E3B43]">Carregando Konnexy Local Intelligence...</h2>
          <p className="text-sm text-[#537379]">Auditando dados de presença digital e SEO local.</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E8E4DA] shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0E3B43]/10 text-[#0E3B43] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#0D9488]" />
          </div>
          <h2 className="text-2xl font-black text-[#0E3B43] tracking-tight">Acesso ao Local Intelligence</h2>
          <p className="text-sm text-[#537379] mt-2 mb-6">
            Você precisa estar logado como lojista para acessar o painel de SEO e métricas do seu estabelecimento.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/painel"
              className="w-full py-3 px-4 rounded-xl font-bold bg-[#0E3B43] text-white hover:bg-[#134e5a] transition-all text-center"
            >
              Fazer Login no Painel do Lojista
            </Link>
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl font-bold bg-[#F8F6F0] text-[#0E3B43] border border-[#E8E4DA] hover:bg-white transition-all text-center"
            >
              Voltar para a Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#0E3B43] font-sans antialiased pb-20">
      {/* Toast Alert */}
      {toast && (
        <div
          className={cn(
            'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-top-4',
            toast.type === 'success' && 'bg-[#0E3B43] text-white border border-[#0D9488]/40',
            toast.type === 'error' && 'bg-rose-600 text-white',
            toast.type === 'info' && 'bg-cyan-700 text-white'
          )}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#2DD4BF]" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-white" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-white" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="bg-white border-b border-[#E8E4DA] sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/painel"
              className="flex items-center gap-2 text-xs font-bold text-[#537379] hover:text-[#0E3B43] p-1.5 rounded-xl hover:bg-[#F8F6F0] transition-colors"
            >
              <Store className="w-4 h-4" />
              <span className="hidden md:inline">Painel Lojista</span>
            </Link>
            <div className="h-4 w-px bg-[#E8E4DA]" />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0E3B43] to-[#0D9488] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-[#0E3B43] tracking-tight">Konnexy</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0D9488]/15 text-[#0D9488]">
                    Local Intelligence
                  </span>
                </div>
                <p className="text-xs text-[#537379] truncate max-w-[200px] sm:max-w-xs">
                  {business.name}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {availableBusinesses.length > 1 && (
              <select
                aria-label="Selecionar Estabelecimento"
                value={business.id}
                onChange={(e) => {
                  const b = availableBusinesses.find((item) => item.id === e.target.value);
                  if (b) {
                    setBusiness(b);
                    sessionStorage.setItem('vitriniza_selected_business', b.id);
                  }
                }}
                className="text-xs font-semibold bg-[#F8F6F0] border border-[#E8E4DA] text-[#0E3B43] rounded-xl px-3 py-2 outline-none focus:border-[#0D9488]"
              >
                {availableBusinesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {seoAudit && (
              <div
                onClick={() => setActiveTab('seo_audit')}
                className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E3B43]/5 hover:bg-[#0E3B43]/10 border border-[#E8E4DA] transition-colors"
                title="Clique para abrir auditoria completa de SEO"
              >
                <div className="text-[10px] font-bold text-[#537379] uppercase">SEO Score</div>
                <div
                  className={cn(
                    'text-xs font-black px-2 py-0.5 rounded-lg text-white',
                    seoAudit.score >= 80 ? 'bg-[#0D9488]' : seoAudit.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                >
                  {seoAudit.score}/100
                </div>
              </div>
            )}

            <Link
              href={`/estabelecimento/${business.slug}`}
              target="_blank"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-[#0E3B43] bg-[#F8F6F0] hover:bg-[#E8E4DA]/60 border border-[#E8E4DA] flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Vitrine</span>
            </Link>
          </div>
        </div>
      </header>

      {/* SUB-HEADER / TAB NAVIGATION BAR */}
      <div className="bg-white border-b border-[#E8E4DA] shadow-2xs sticky top-18 z-30 print:hidden overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <nav className="flex space-x-1 sm:space-x-2 py-2.5">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'seo_audit', label: 'Diagnóstico SEO', icon: ShieldCheck, badge: seoAudit && seoAudit.issues.length > 0 ? String(seoAudit.issues.length) : undefined },
              { id: 'visibility', label: 'Visibilidade Google', icon: Globe },
              { id: 'keywords', label: 'Pesquisas & Termos', icon: Search },
              { id: 'products', label: 'Produtos & Ofertas', icon: ShoppingBag },
              { id: 'conversions', label: 'Conversões', icon: TrendingUp },
              { id: 'reports', label: 'Relatórios', icon: FileText },
              { id: 'integrations', label: 'Integrações Google', icon: Layers },
              { id: 'history', label: 'Histórico', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as IntelligenceTabId)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                    isActive
                      ? 'bg-[#0E3B43] text-white shadow-xs'
                      : 'text-[#537379] hover:text-[#0E3B43] hover:bg-[#F8F6F0]'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                        isActive ? 'bg-[#E36845] text-white' : 'bg-rose-100 text-rose-700'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Period selector */}
          <div className="hidden lg:flex items-center gap-1 bg-[#F8F6F0] p-1 rounded-xl border border-[#E8E4DA] shrink-0 my-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days as 7 | 30 | 90)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  selectedPeriod === days
                    ? 'bg-white text-[#0E3B43] shadow-2xs'
                    : 'text-[#537379] hover:text-[#0E3B43]'
                )}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#0E3B43] to-[#12535F] text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#2DD4BF]/20 text-[#2DD4BF]">
                    Resumo de Inteligência Local • {selectedPeriod} Dias
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {business.name} gerou {overview.whatsappContacts.currentPeriod + overview.phoneCalls.currentPeriod + overview.directionsRequested.currentPeriod} intenções de compra.
                </h1>
                <p className="text-sm text-[#A8C7CE]">
                  Estimativa conservadora de{' '}
                  <span className="font-bold text-white">
                    {formatCurrency(overview.estimatedRevenueImpact)}
                  </span>{' '}
                  em faturamento potencial através de buscas orgânicas de bairro e vitrine digital.
                </p>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                <button
                  onClick={() => setActiveTab('seo_audit')}
                  className="px-4 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#d55835] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Otimizar Presença</span>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Gerar Relatório</span>
                </button>
              </div>
            </div>

            {/* 6 Metric Comparison Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                {
                  label: 'Impressões na Busca',
                  current: overview.impressions.currentPeriod,
                  change: overview.impressions.deltaPercent,
                  icon: Search,
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-50',
                },
                {
                  label: 'Visitas ao Perfil',
                  current: overview.profileClicks.currentPeriod,
                  change: overview.profileClicks.deltaPercent,
                  icon: Eye,
                  color: 'text-[#0D9488]',
                  bg: 'bg-[#0D9488]/10',
                },
                {
                  label: 'Conversas WhatsApp',
                  current: overview.whatsappContacts.currentPeriod,
                  change: overview.whatsappContacts.deltaPercent,
                  icon: MessageCircle,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  label: 'Chamadas Telefônicas',
                  current: overview.phoneCalls.currentPeriod,
                  change: overview.phoneCalls.deltaPercent,
                  icon: Phone,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  label: 'Rotas Solicitadas',
                  current: overview.directionsRequested.currentPeriod,
                  change: overview.directionsRequested.deltaPercent,
                  icon: Navigation,
                  color: 'text-[#E36845]',
                  bg: 'bg-[#E36845]/10',
                },
                {
                  label: 'Visualizações Produtos',
                  current: overview.productViews.currentPeriod,
                  change: overview.productViews.deltaPercent,
                  icon: ShoppingBag,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                const isPositive = kpi.change >= 0;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 border border-[#E8E4DA] shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', kpi.bg, kpi.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        )}
                      >
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(kpi.change)}%
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#0E3B43] tracking-tight">
                      {kpi.current.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-[11px] font-semibold text-[#537379] mt-0.5 truncate">
                      {kpi.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts & Health Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-black text-[#0E3B43]">Evolução de Tráfego e Contatos</h3>
                    <p className="text-xs text-[#537379]">Métricas diárias consolidadas de engajamento</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-[#537379]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#0D9488]" />
                      <span>Impressões</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#0E3B43]" />
                      <span>Cliques</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={overview.dailySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E3B43" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0E3B43" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" vertical={false} />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0E3B43',
                          border: 'none',
                          borderRadius: '16px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        name="Impressões"
                        stroke="#0D9488"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorImpressions)"
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        name="Cliques"
                        stroke="#0E3B43"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorClicks)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SEO Health Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-[#0E3B43]">Saúde de SEO Local</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0D9488]/15 text-[#0D9488]">
                      Auditoria
                    </span>
                  </div>

                  {seoAudit && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-white shrink-0 shadow-md',
                            seoAudit.score >= 80 ? 'bg-[#0D9488]' : seoAudit.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          )}
                        >
                          <span className="text-2xl">{seoAudit.score}</span>
                          <span className="text-[10px] opacity-80 uppercase tracking-widest">/100</span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-[#0E3B43]">
                            {seoAudit.score >= 85
                              ? 'Excelente Otimização'
                              : seoAudit.score >= 60
                              ? 'Boa Visibilidade com Ajustes'
                              : 'Requer Correções Críticas'}
                          </h4>
                          <p className="text-xs text-[#537379] mt-0.5">
                            {seoAudit.issues.length === 0
                              ? 'Nenhum problema encontrado. Perfil 100% otimizado.'
                              : `${seoAudit.issues.length} pontos de melhoria detectados no perfil.`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#F0ECE1]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#537379] flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-[#0D9488]" />
                            Meta Tags & Título
                          </span>
                          <span className="font-bold text-[#0E3B43]">
                            {seoAudit.metrics.meta_title_present ? '✓ Otimizado' : '✕ Ausente'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#537379] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                            Consistência NAP
                          </span>
                          <span className="font-bold text-[#0E3B43]">
                            {seoAudit.metrics.nap_consistent ? '✓ Perfeito' : '✕ Inconsistente'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#537379] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                            Horários de Funcionamento
                          </span>
                          <span className="font-bold text-[#0E3B43]">
                            {business.hours && business.hours.length > 0 ? '✓ Cadastrados' : '✕ Não definidos'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#F0ECE1]">
                  <button
                    onClick={() => setActiveTab('seo_audit')}
                    className="w-full py-2.5 px-4 rounded-xl font-bold bg-[#0E3B43] hover:bg-[#134e5a] text-white text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ver Diagnóstico e Corrigir</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Top Keywords and Products Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-[#0E3B43]">Termos com Maior Potencial Local</h3>
                    <p className="text-xs text-[#537379]">Pesquisas de bairro que levam até o seu segmento</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('keywords')}
                    className="text-xs font-bold text-[#0D9488] hover:underline"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="space-y-2.5">
                  {overview.topKeywords.slice(0, 4).map((kw, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#0E3B43]">{kw.keyword}</div>
                        <div className="text-[10px] text-[#537379]">
                          Volume: {kw.impressions}/mês • Posição: #{kw.position || '7'}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-black px-2 py-0.5 rounded-full',
                          kw.opportunity_score >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {kw.opportunity_score >= 80 ? 'Alta Oportunidade' : 'Média Oportunidade'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products Preview */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-[#0E3B43]">Catálogo em Destaque</h3>
                    <p className="text-xs text-[#537379]">Produtos mais visualizados e taxa de conversão</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs font-bold text-[#0D9488] hover:underline"
                  >
                    Gerenciar
                  </button>
                </div>

                {overview.topProducts.length > 0 ? (
                  <div className="space-y-2.5">
                    {overview.topProducts.slice(0, 4).map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]"
                      >
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="text-xs font-bold text-[#0E3B43] truncate">{prod.name}</div>
                          <div className="text-[10px] text-[#537379]">
                            {prod.views} views • {prod.clicks} cliques
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-[#0D9488]">
                            {prod.conversionRate.toFixed(1)}% conv.
                          </div>
                          <div className="text-[10px] text-[#537379]">{prod.conversions} vendas/leads</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-[#537379]">
                    Nenhum produto cadastrado com métricas ainda.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIAGNÓSTICO SEO */}
        {activeTab === 'seo_audit' && seoAudit && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E4DA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    'w-24 h-24 rounded-3xl flex flex-col items-center justify-center font-black text-white shrink-0 shadow-lg',
                    seoAudit.score >= 80 ? 'bg-[#0D9488]' : seoAudit.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                >
                  <span className="text-3xl">{seoAudit.score}</span>
                  <span className="text-[11px] opacity-80 uppercase tracking-widest">Score SEO</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43]">Diagnóstico Técnico de SEO Local</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0D9488]/15 text-[#0D9488]">
                      Konnexy Engine
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#537379]">
                    Auditoria automatizada de NAP, Schema.org, Meta Tags, Rich Snippets, Horários e Catálogo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="px-4 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#E8E4DA]/60 border border-[#E8E4DA] text-[#0E3B43] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-4 h-4', isAuditing && 'animate-spin text-[#0D9488]')} />
                  <span>{isAuditing ? 'Auditando...' : 'Reauditar Agora'}</span>
                </button>
              </div>
            </div>

            {/* Issues List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[#0E3B43]">
                  Pontos Identificados ({seoAudit.issues.length})
                </h3>
                <span className="text-xs text-[#537379]">
                  {seoAudit.issues.filter((i) => i.auto_fixable).length} com correção automática disponível em 1 clique
                </span>
              </div>

              {seoAudit.issues.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E4DA]">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-black text-[#0E3B43]">Parabéns! Sua Vitrine está 100% Otimizada</h3>
                  <p className="text-xs text-[#537379] max-w-md mx-auto mt-1">
                    Todos os critérios de SEO local, NAP, meta tags e dados estruturados estão em conformidade com as diretrizes do Google.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {seoAudit.issues.map((issue) => {
                    const isApplying = applyingFixCode === issue.code;
                    return (
                      <div
                        key={issue.id}
                        className={cn(
                          'bg-white rounded-2xl p-5 border transition-all shadow-2xs',
                          issue.severity === 'critical'
                            ? 'border-rose-200 hover:border-rose-300'
                            : issue.severity === 'medium'
                            ? 'border-amber-200 hover:border-amber-300'
                            : 'border-blue-200 hover:border-blue-300'
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider',
                                  issue.severity === 'critical'
                                    ? 'bg-rose-100 text-rose-700'
                                    : issue.severity === 'medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                )}
                              >
                                {issue.severity === 'critical'
                                  ? 'Crítico'
                                  : issue.severity === 'medium'
                                  ? 'Importante'
                                  : 'Oportunidade'}
                              </span>
                              <span className="text-xs font-bold text-[#537379] uppercase tracking-wider">
                                {issue.category}
                              </span>
                            </div>

                            <h4 className="text-base font-black text-[#0E3B43]">{issue.title}</h4>
                            <p className="text-xs text-[#537379]">{issue.description}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                              <div className="p-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA]/60">
                                <span className="font-bold text-[#0E3B43] block mb-1">Por que isso importa?</span>
                                <span className="text-[#537379]">{issue.why_it_matters}</span>
                              </div>
                              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/50">
                                <span className="font-bold text-emerald-900 block mb-1">Como resolver:</span>
                                <span className="text-emerald-800">{issue.recommendation}</span>
                              </div>
                            </div>
                          </div>

                          {issue.auto_fixable && (
                            <div className="sm:self-center shrink-0">
                              <button
                                onClick={() => handleApplyFix(issue.code)}
                                disabled={isApplying}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold bg-[#0D9488] hover:bg-[#0b7a6f] text-white text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <Wand2 className={cn('w-4 h-4', isApplying && 'animate-spin')} />
                                <span>{isApplying ? 'Corrigindo...' : issue.action_label || 'Corrigir Automaticamente'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VISIBILIDADE GOOGLE */}
        {activeTab === 'visibility' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E4DA] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#0E3B43]">Presença e Indexação no Google</h2>
                  <p className="text-xs sm:text-sm text-[#537379]">
                    Monitore seu posicionamento no Google Search Console e Google Perfil da Empresa (GBP).
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('integrations')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0E3B43] text-white hover:bg-[#134e5a] transition-all flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Configurar Integrações Google</span>
                </button>
              </div>

              {integrations.find((g) => g.provider === 'google_search_console')?.status !== 'connected' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-900">Google Search Console Desconectado</h4>
                    <p className="text-xs text-amber-800">
                      Conecte sua propriedade do Search Console para sincronizar termos exatos de pesquisa e cliques reais diários que levam clientes até o seu estabelecimento.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs text-emerald-900 font-bold">
                    Propriedade Google Search Console sincronizada e monitorando 100% das buscas orgânicas.
                  </div>
                </div>
              )}

              {/* SERP Preview Simulation */}
              <div className="border border-[#E8E4DA] rounded-2xl p-5 bg-[#F8F6F0]/60 space-y-3">
                <div className="text-xs font-bold text-[#537379] uppercase tracking-wider">
                  Pré-visualização do Snippet no Google (SERP Preview)
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#E8E4DA] space-y-1 max-w-xl font-sans">
                  <div className="text-[11px] text-[#202124] flex items-center gap-1.5 truncate">
                    <Globe className="w-3 h-3 text-[#537379]" />
                    <span>vitriniza.com.br &gt; estabelecimento &gt; {business.slug}</span>
                  </div>
                  <div className="text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer truncate">
                    {business.meta_title || `${business.name} | Vitrine Oficial no Bairro`}
                  </div>
                  <div className="text-xs text-[#4d5156] line-clamp-2">
                    {business.meta_description ||
                      `${business.name} em ${business.address || 'São Paulo'}. Telefone, cardápio, produtos, fotos, horário de funcionamento e WhatsApp direto.`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PESQUISAS & PALAVRAS-CHAVE */}
        {activeTab === 'keywords' && overview && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E4DA] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#0E3B43]">Palavras-chave e Intenções de Busca Local</h2>
                  <p className="text-xs sm:text-sm text-[#537379]">
                    Termos reais pesquisados por moradores da sua região com potencial de compra imediata.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E4DA] text-[#537379] uppercase font-bold text-[10px]">
                      <th className="pb-3 px-3">Palavra-chave Local</th>
                      <th className="pb-3 px-3">Intenção</th>
                      <th className="pb-3 px-3">Buscas / Mês</th>
                      <th className="pb-3 px-3">Posição Média</th>
                      <th className="pb-3 px-3">CTR Estimado</th>
                      <th className="pb-3 px-3">Oportunidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1]">
                    {overview.topKeywords.map((kw, i) => (
                      <tr key={i} className="hover:bg-[#F8F6F0]/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#0E3B43] flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-[#0D9488]" />
                          <span>{kw.keyword}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-semibold bg-[#0E3B43]/5 text-[#0E3B43] text-[10px]">
                            {kw.intent}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">{kw.impressions}</td>
                        <td className="py-3 px-3 font-bold text-[#0E3B43]">
                          {kw.position ? `#${kw.position}` : '#7'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#0D9488]">
                          {(kw.ctr * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-black',
                              kw.opportunity_score >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            )}
                          >
                            Score {kw.opportunity_score}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PRODUTOS & OPORTUNIDADES */}
        {activeTab === 'products' && overview && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E4DA] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#0E3B43]">Desempenho de Produtos e Oportunidades</h2>
                  <p className="text-xs sm:text-sm text-[#537379]">
                    Monitore visualizações de itens do catálogo e produtos com maior atratividade.
                  </p>
                </div>
                <Link
                  href="/painel"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E36845] hover:bg-[#d55835] text-white transition-all flex items-center gap-1.5 self-start"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Cadastrar Novos Produtos</span>
                </Link>
              </div>

              {overview.topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E4DA] text-[#537379] uppercase font-bold text-[10px]">
                        <th className="pb-3 px-3">Produto</th>
                        <th className="pb-3 px-3">Visualizações</th>
                        <th className="pb-3 px-3">Cliques</th>
                        <th className="pb-3 px-3">Conversões</th>
                        <th className="pb-3 px-3">Taxa de Conversão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE1]">
                      {overview.topProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F8F6F0]/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-[#0E3B43]">{p.name}</td>
                          <td className="py-3 px-3 font-semibold">{p.views}</td>
                          <td className="py-3 px-3 font-semibold">{p.clicks}</td>
                          <td className="py-3 px-3 font-bold text-emerald-600">{p.conversions}</td>
                          <td className="py-3 px-3 font-black text-[#0D9488]">
                            {p.conversionRate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[#537379] text-xs">
                  Nenhum produto cadastrado com métricas no período selecionado.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: CONVERSÕES */}
        {activeTab === 'conversions' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-[#0E3B43]">
                  {overview.whatsappContacts.currentPeriod}
                </div>
                <div className="text-xs font-bold text-[#537379] mt-1">Contatos via WhatsApp</div>
                <p className="text-[11px] text-[#537379] mt-2">
                  Cliques diretos para abrir conversa com o número cadastrado no perfil.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-[#0E3B43]">
                  {overview.phoneCalls.currentPeriod}
                </div>
                <div className="text-xs font-bold text-[#537379] mt-1">Chamadas Telefônicas</div>
                <p className="text-[11px] text-[#537379] mt-2">
                  Cliques em 'Ligar Agora' a partir de celulares e dispositivos móveis.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-[#E36845]/15 text-[#E36845] flex items-center justify-center mb-4">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-[#0E3B43]">
                  {overview.directionsRequested.currentPeriod}
                </div>
                <div className="text-xs font-bold text-[#537379] mt-1">Rotas no Mapa</div>
                <p className="text-[11px] text-[#537379] mt-2">
                  Aberturas do Google Maps e Waze para visitar o estabelecimento físico.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: RELATÓRIOS EXECUTIVOS */}
        {activeTab === 'reports' && overview && seoAudit && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-xs flex items-center justify-between gap-4 print:hidden">
              <div>
                <h2 className="text-lg font-black text-[#0E3B43]">Relatório Executivo de Presença Local</h2>
                <p className="text-xs text-[#537379]">Relatório pronto para apresentação executiva e acompanhamento de ROI.</p>
              </div>
              <button
                onClick={handlePrintReport}
                className="px-4 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#134e5a] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar em PDF</span>
              </button>
            </div>

            {/* Printable Report Canvas */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E4DA] shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
              <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-6">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#0D9488]">
                    Konnexy Local Intelligence • Relatório Mensal
                  </div>
                  <h1 className="text-2xl font-black text-[#0E3B43] mt-1">{business.name}</h1>
                  <p className="text-xs text-[#537379]">
                    Período auditado: Últimos {selectedPeriod} dias • Gerado em {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#0E3B43]">{seoAudit.score}/100</div>
                  <div className="text-[10px] font-bold text-[#537379] uppercase">Score Geral SEO</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0E3B43] uppercase tracking-wider mb-3">
                  1. Indicadores Chave de Desempenho (KPIs)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
                    <div className="text-xs text-[#537379]">Impressões Totais</div>
                    <div className="text-xl font-black text-[#0E3B43] mt-1">
                      {overview.impressions.currentPeriod.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
                    <div className="text-xs text-[#537379]">Acessos à Vitrine</div>
                    <div className="text-xl font-black text-[#0E3B43] mt-1">
                      {overview.profileClicks.currentPeriod.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
                    <div className="text-xs text-[#537379]">Contatos Gerados</div>
                    <div className="text-xl font-black text-[#0D9488] mt-1">
                      {overview.whatsappContacts.currentPeriod + overview.phoneCalls.currentPeriod + overview.directionsRequested.currentPeriod}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
                    <div className="text-xs text-[#537379]">Impacto Estimado</div>
                    <div className="text-xl font-black text-[#E36845] mt-1">
                      {formatCurrency(overview.estimatedRevenueImpact)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#0E3B43] uppercase tracking-wider mb-3">
                  2. Plano de Ação Recomendado para os Próximos 30 Dias
                </h3>
                <ul className="space-y-2 text-xs text-[#537379]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>
                      <strong>Completar Horários de Funcionamento:</strong> Garanta que os horários do fim de semana estejam sempre preenchidos para não perder clientes no domingo.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>
                      <strong>Fotos de Produtos em Alta Resolução:</strong> Estabelecimentos com pelo menos 5 fotos de produtos recebem o dobro de contatos no WhatsApp.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>
                      <strong>Sincronização com Google Search Console:</strong> Mantenha as meta tags de bairro atualizadas para ranquear nas primeiras posições orgânicas da Zona Leste.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: INTEGRAÇÕES GOOGLE */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E4DA] shadow-xs">
              <div className="max-w-2xl space-y-1 mb-6">
                <h2 className="text-xl font-black text-[#0E3B43]">Conectores e Integrações Google</h2>
                <p className="text-xs sm:text-sm text-[#537379]">
                  Conecte sua vitrine digital com os serviços oficiais do Google para habilitar sincronização em tempo real e relatórios de busca.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {integrations.map((integration) => {
                  const isConnected = integration.status === 'connected';
                  const displayName = integration.provider_name || getProviderDisplayName(integration.provider);
                  return (
                    <div
                      key={integration.id}
                      className="p-5 rounded-2xl border border-[#E8E4DA] bg-[#F8F6F0]/40 flex flex-col justify-between space-y-4 hover:border-[#0D9488]/40 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-[#0D9488]" />
                            <h4 className="text-sm font-black text-[#0E3B43]">{displayName}</h4>
                          </div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-black',
                              isConnected
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {isConnected ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                        <p className="text-xs text-[#537379]">
                          {integration.provider === 'google_search_console' &&
                            'Consultas de pesquisa, impressões no buscador, cliques e envio automático de sitemap XML.'}
                          {integration.provider === 'google_analytics_4' &&
                            'Métricas de tráfego web, visualizações de página e atribuição de eventos no GA4.'}
                          {integration.provider === 'google_business_profile' &&
                            'Sincronização de endereço, horários de funcionamento, chamadas telefônicas e rotas no Maps.'}
                          {integration.provider === 'google_merchant_center' &&
                            'Feed automatizado de produtos do comércio local exibidos na aba Google Shopping.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#E8E4DA] flex items-center justify-between">
                        <span className="text-[10px] text-[#537379]">
                          {isConnected && integration.last_sync_at
                            ? `Último sync: ${new Date(integration.last_sync_at).toLocaleDateString('pt-BR')}`
                            : 'Aguardando configuração'}
                        </span>

                        <div className="flex items-center gap-2">
                          {isConnected ? (
                            <button
                              onClick={() => handleDisconnectIntegration(integration.provider)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              Desconectar
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setIntegrationModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0E3B43] text-white hover:bg-[#134e5a] transition-all cursor-pointer"
                            >
                              Conectar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: HISTÓRICO DE OTIMIZAÇÕES */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E4DA] shadow-xs">
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#0E3B43]">Histórico de Otimizações Aplicadas</h2>
                <p className="text-xs sm:text-sm text-[#537379]">
                  Registro auditável de todas as melhorias técnicas, automações e correções efetuadas.
                </p>
              </div>

              {optimizations.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#537379]">
                  Nenhuma otimização registrada ainda. Use o botão 'Corrigir Automaticamente' no Diagnóstico SEO para registrar a primeira melhoria!
                </div>
              ) : (
                <div className="space-y-3">
                  {optimizations.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#0E3B43]">{opt.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {opt.status === 'applied' ? 'Aplicado' : 'Pendente'}
                          </span>
                        </div>
                        {opt.description && <p className="text-xs text-[#537379]">{opt.description}</p>}
                        {opt.changes_summary && (
                          <div className="text-[11px] font-mono text-[#0D9488] bg-white p-2 rounded-lg border border-[#E8E4DA] mt-1">
                            {opt.changes_summary}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#537379] shrink-0 font-medium">
                        {new Date(opt.applied_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* INTEGRATION CONFIG MODAL */}
      {integrationModalOpen && selectedIntegration && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E8E4DA] shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0D9488]">
                <span>Configuração de Conector</span>
              </div>
              <h3 className="text-xl font-black text-[#0E3B43] mt-1">
                {selectedIntegration.provider_name || getProviderDisplayName(selectedIntegration.provider)}
              </h3>
              <p className="text-xs text-[#537379] mt-1">
                Informe as credenciais ou IDs para autorizar a sincronização com o Vitriniza.
              </p>
            </div>

            <div className="space-y-3">
              {selectedIntegration.provider === 'google_search_console' && (
                <div>
                  <label className="text-xs font-bold text-[#0E3B43] block mb-1">
                    URL da Propriedade ou Domínio
                  </label>
                  <input
                    type="text"
                    value={integrationConfigForm.siteUrl}
                    onChange={(e) =>
                      setIntegrationConfigForm({ ...integrationConfigForm, siteUrl: e.target.value })
                    }
                    placeholder="https://vitriniza.com.br/estabelecimento/..."
                    className="w-full text-xs p-3 rounded-xl border border-[#E8E4DA] outline-none focus:border-[#0D9488]"
                  />
                </div>
              )}

              {selectedIntegration.provider === 'google_analytics_4' && (
                <div>
                  <label className="text-xs font-bold text-[#0E3B43] block mb-1">
                    ID de Medição do GA4 (Measurement ID)
                  </label>
                  <input
                    type="text"
                    value={integrationConfigForm.measurementId}
                    onChange={(e) =>
                      setIntegrationConfigForm({ ...integrationConfigForm, measurementId: e.target.value })
                    }
                    placeholder="G-XXXXXXXXXX"
                    className="w-full text-xs p-3 rounded-xl border border-[#E8E4DA] outline-none focus:border-[#0D9488]"
                  />
                </div>
              )}

              {selectedIntegration.provider === 'google_business_profile' && (
                <div>
                  <label className="text-xs font-bold text-[#0E3B43] block mb-1">
                    ID da Conta / Local GBP
                  </label>
                  <input
                    type="text"
                    value={integrationConfigForm.propertyId}
                    onChange={(e) =>
                      setIntegrationConfigForm({ ...integrationConfigForm, propertyId: e.target.value })
                    }
                    placeholder="locations/1234567890"
                    className="w-full text-xs p-3 rounded-xl border border-[#E8E4DA] outline-none focus:border-[#0D9488]"
                  />
                </div>
              )}

              {selectedIntegration.provider === 'google_merchant_center' && (
                <div>
                  <label className="text-xs font-bold text-[#0E3B43] block mb-1">
                    ID do Comerciante (Merchant ID)
                  </label>
                  <input
                    type="text"
                    value={integrationConfigForm.merchantId}
                    onChange={(e) =>
                      setIntegrationConfigForm({ ...integrationConfigForm, merchantId: e.target.value })
                    }
                    placeholder="123456789"
                    className="w-full text-xs p-3 rounded-xl border border-[#E8E4DA] outline-none focus:border-[#0D9488]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E4DA]">
              <button
                type="button"
                onClick={() => setIntegrationModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#537379] hover:bg-[#F8F6F0] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveIntegration}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#0E3B43] hover:bg-[#134e5a] text-white transition-all shadow-md cursor-pointer"
              >
                Salvar & Conectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
