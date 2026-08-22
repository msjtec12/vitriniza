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
  Upload,
  Calendar,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { Business, Category, City, Neighborhood, ClaimRequest, Banner, PlatformSettings, PlanTier, LocalEvent } from '@/types';
import { formatCurrency, formatPhone, cn, fetchAddressByCep, formatDatePtBr, buildWhatsAppUrl } from '@/lib/utils';
import { WhatsAppSolidIcon } from '@/components/ui/Icons';

export default function MasterAdminPage() {
  // High-performance image compressor & reader for instant multi-device cloud sync
  const handleImageFileUpload = (file: File, callback: (dataUrl: string) => void) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, SVG).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha um arquivo de até 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 1000;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          callback(compressedDataUrl);
        } else {
          callback(rawDataUrl);
        }
      };
      img.onerror = () => callback(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // SECURITY AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'businesses' | 'create_business' | 'claims' | 'events' | 'regions' | 'categories' | 'banners' | 'settings'
  >('dashboard');

  const [stats, setStats] = useState(store.getMasterStats());
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(store.getPlatformSettings());

  // Events management state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventCepLoading, setEventCepLoading] = useState(false);
  const [eventCepMsg, setEventCepMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location_name: '',
    postal_code: '08410-000',
    address: '',
    neighborhood_name: 'Guaianases',
    city_name: 'São Paulo',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '18:00',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    whatsapp_contact: '',
    organizer_name: 'Associação dos Comerciantes Locais',
    is_active: true,
  });

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
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    semanalPrice: settings.plan_prices.semanal || 19.90,
    mensalPrice: settings.plan_prices.mensal || 49.90,
    destaquePrice: settings.plan_prices.destaque || 19.90,
    proPrice: settings.plan_prices.pro || 49.90,
    premiumPrice: settings.plan_prices.premium || 49.90,
    contactWhatsApp: settings.contact_whatsapp,
    logoUrl: settings.logo_url || '/logo.png',
    heroBgUrl: settings.hero_bg_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1800&auto=format&fit=crop&q=80',
    heroTitle: settings.hero_title || 'Descubra o melhor perto de você.',
    heroSubtitle: settings.hero_subtitle || 'Encontre comércios, profissionais, serviços e promoções no seu bairro e fale diretamente pelo WhatsApp.',
  });

  const handleSyncToSupabase = async () => {
    setIsSyncingCloud(true);
    setCloudSyncMsg(null);
    const result = await store.pushAllToSupabase();
    setIsSyncingCloud(false);
    setCloudSyncMsg({ text: result.message, success: result.success });
    refreshData();
  };

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
    setEvents(store.getAllEvents());

    setCreateForm((prev) => ({
      ...prev,
      category_id: prev.category_id === '1' && cats.length > 0 ? cats[0].id : prev.category_id,
      neighborhood_id: prev.neighborhood_id === '1' && neighs.length > 0 ? neighs[0].id : prev.neighborhood_id,
    }));
  };

  // Event Management Handlers & CEP Lookup
  const handleLookupEventCep = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setEventCepMsg({ text: 'Digite os 8 números do CEP para consultar.', success: false });
      return;
    }
    setEventCepLoading(true);
    setEventCepMsg(null);
    const res = await fetchAddressByCep(cleanCep);
    setEventCepLoading(false);
    if (res) {
      setEventForm((prev) => ({
        ...prev,
        address: res.logradouro || prev.address,
        neighborhood_name: res.bairro || prev.neighborhood_name,
        city_name: `${res.localidade}/${res.uf}`,
      }));
      setEventCepMsg({
        text: `✓ Endereço verificado pelo CEP: ${res.logradouro}, ${res.bairro} - ${res.localidade}/${res.uf}`,
        success: true,
      });
    } else {
      setEventCepMsg({ text: '⚠️ CEP não encontrado no ViaCEP. Preencha o endereço manualmente.', success: false });
    }
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.event_date) {
      alert('Por favor, preencha o título e a data do evento.');
      return;
    }

    const formattedDateLabel = formatDatePtBr(eventForm.event_date);
    const formattedTimeLabel = `${eventForm.start_time || '10:00'} às ${eventForm.end_time || '18:00'}`;

    const payload = {
      title: eventForm.title,
      description: eventForm.description,
      location_name: eventForm.location_name,
      address: eventForm.address,
      neighborhood_name: eventForm.neighborhood_name,
      city_name: eventForm.city_name,
      event_date: formattedDateLabel || eventForm.event_date,
      event_time: formattedTimeLabel,
      image_url: eventForm.image_url,
      whatsapp_contact: eventForm.whatsapp_contact,
      organizer_name: eventForm.organizer_name,
      is_active: eventForm.is_active,
    };

    if (editingEventId) {
      store.updateEvent(editingEventId, payload);
    } else {
      store.createEvent(payload);
    }

    refreshData();
    setIsEventModalOpen(false);
    setEditingEventId(null);
    resetEventForm();
  };

  const resetEventForm = () => {
    setEventCepMsg(null);
    setEventForm({
      title: '',
      description: '',
      location_name: '',
      postal_code: '08410-000',
      address: '',
      neighborhood_name: 'Guaianases',
      city_name: 'São Paulo',
      event_date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '18:00',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      whatsapp_contact: '',
      organizer_name: 'Associação dos Comerciantes Locais',
      is_active: true,
    });
  };

  const handleEditEvent = (evt: LocalEvent) => {
    setEditingEventId(evt.id);
    setEventCepMsg(null);

    // Extract start/end time if format is "10:00 às 18:00"
    let st = '10:00';
    let et = '18:00';
    if (evt.event_time.includes('às')) {
      const parts = evt.event_time.split('às').map((s) => s.trim());
      if (parts[0]) st = parts[0];
      if (parts[1]) et = parts[1];
    }

    setEventForm({
      title: evt.title,
      description: evt.description,
      location_name: evt.location_name,
      postal_code: '08410-000',
      address: evt.address,
      neighborhood_name: evt.neighborhood_name,
      city_name: evt.city_name,
      event_date: new Date().toISOString().split('T')[0],
      start_time: st,
      end_time: et,
      image_url: evt.image_url,
      whatsapp_contact: evt.whatsapp_contact || '',
      organizer_name: evt.organizer_name,
      is_active: evt.is_active,
    });
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      store.deleteEvent(eventId);
      refreshData();
    }
  };

  const handleToggleEventActive = (eventId: string) => {
    store.toggleEventStatus(eventId);
    refreshData();
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      store.ensureCloudSynced().then(() => refreshData());
      const unsubscribe = store.subscribe(() => refreshData());
      return () => unsubscribe();
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

  // Edit Business Modal State
  const [isEditBizModalOpen, setIsEditBizModalOpen] = useState(false);
  const [editingBizId, setEditingBizId] = useState<string | null>(null);
  const [editBizCepMsg, setEditBizCepMsg] = useState<string | null>(null);
  const [editBizForm, setEditBizForm] = useState({
    name: '',
    category_id: '',
    neighborhood_id: '',
    address: '',
    number: '',
    postal_code: '',
    phone: '',
    whatsapp: '',
    short_description: '',
    description: '',
    logo_url: '',
    cover_url: '',
    instagram: '',
    website: '',
    plan_id: 'free' as PlanTier,
    is_active: true,
    is_verified: false,
    is_featured: false,
  });

  const handleOpenEditBizModal = (b: Business) => {
    setEditingBizId(b.id);
    setEditBizCepMsg(null);
    setEditBizForm({
      name: b.name,
      category_id: b.category_id,
      neighborhood_id: b.neighborhood_id,
      address: b.address,
      number: b.number || '',
      postal_code: b.postal_code || '08410-000',
      phone: b.phone || '',
      whatsapp: b.whatsapp,
      short_description: b.short_description || '',
      description: b.description || '',
      logo_url: b.logo_url || '',
      cover_url: b.cover_url || '',
      instagram: b.instagram || '',
      website: b.website || '',
      plan_id: b.plan_id,
      is_active: b.is_active,
      is_verified: b.is_verified,
      is_featured: b.is_featured,
    });
    setIsEditBizModalOpen(true);
  };

  const handleSaveEditBiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBizId || !editBizForm.name || !editBizForm.address) return;

    store.updateBusiness(editingBizId, {
      name: editBizForm.name,
      category_id: editBizForm.category_id,
      neighborhood_id: editBizForm.neighborhood_id,
      address: editBizForm.address,
      number: editBizForm.number,
      postal_code: editBizForm.postal_code,
      phone: editBizForm.phone,
      whatsapp: editBizForm.whatsapp,
      short_description: editBizForm.short_description || editBizForm.description || 'Comércio local cadastrado na Vitriniza com produtos e atendimento de qualidade no bairro.',
      description: editBizForm.description || editBizForm.short_description || 'Comércio local cadastrado na Vitriniza com produtos e atendimento de qualidade no bairro.',
      logo_url: editBizForm.logo_url,
      cover_url: editBizForm.cover_url,
      instagram: editBizForm.instagram,
      website: editBizForm.website,
      plan_id: editBizForm.plan_id,
      is_active: editBizForm.is_active,
      is_verified: editBizForm.is_verified,
      is_featured: editBizForm.is_featured,
    });

    refreshData();
    setIsEditBizModalOpen(false);
    setEditingBizId(null);
  };

  const [lastCreatedBiz, setLastCreatedBiz] = useState<Business | null>(null);

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
      short_description: createForm.short_description || 'Comércio local cadastrado na Vitriniza com produtos e atendimento de qualidade no bairro.',
      description: createForm.description || createForm.short_description || 'Comércio local cadastrado na Vitriniza com produtos e atendimento de qualidade no bairro.',
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
    const invite = `${origin}/reivindicar?slug=${newBiz.slug}`;
    setCreatedInviteLink(invite);
    setLastCreatedBiz(newBiz);
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
      logo_url: settingsForm.logoUrl,
      hero_bg_url: settingsForm.heroBgUrl,
      hero_title: settingsForm.heroTitle,
      hero_subtitle: settingsForm.heroSubtitle,
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
              onClick={async () => {
                await store.ensureCloudSynced(true);
                refreshData();
                alert('✓ Dados sincronizados com a nuvem em tempo real!');
              }}
              title="Baixar alterações atualizadas da nuvem (fotos, novos cadastros e edições)"
              className="text-xs text-[#F8F6F0] hover:text-white font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4FA6A6]/20 hover:bg-[#4FA6A6]/30 border border-[#4FA6A6]/40 transition-all cursor-pointer"
            >
              <span>🔄 Sincronizar</span>
            </button>
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
            { id: 'events', label: 'Eventos no Bairro', icon: Calendar, count: events.length },
            { id: 'settings', label: 'Configurações de Preços & Banner', icon: Settings },
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
                            <button
                              type="button"
                              onClick={() => handleOpenEditBizModal(b)}
                              className="px-2.5 py-1 rounded-lg bg-[#4FA6A6]/20 hover:bg-[#4FA6A6] text-[#0E3B43] hover:text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Editar todos os dados cadastrais desta empresa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <a
                              href={buildWhatsAppUrl(
                                b.whatsapp,
                                `Olá! Sua vitrine digital "${b.name}" foi cadastrada no Portal Vitriniza (${b.neighborhood?.name || 'Guaianases'}). Acesse o link oficial para confirmar seus dados, criar sua senha e assumir o controle do seu painel: https://vitriniza.vercel.app/reivindicar?slug=${b.slug}`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar link de ativação por WhatsApp ao proprietário"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                            >
                              <WhatsAppSolidIcon className="w-3.5 h-3.5 fill-white" />
                              <span>Convite WhatsApp</span>
                            </a>
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
              <div className="p-4 bg-[#4FA6A6]/15 rounded-2xl border border-[#4FA6A6]/30 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0E3B43]">
                  <CheckCircle2 className="w-4 h-4 text-[#4FA6A6]" />
                  <span>Comércio cadastrado com sucesso! Envie o link de posse ao proprietário:</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdInviteLink}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdInviteLink);
                        alert('Link de convite copiado!');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0E3B43] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link</span>
                    </button>
                    <a
                      href={buildWhatsAppUrl(
                        lastCreatedBiz?.whatsapp || createForm.whatsapp || '11999998888',
                        `Olá! Sua vitrine digital "${lastCreatedBiz?.name || 'sua empresa'}" foi cadastrada no Portal Vitriniza. Acesse o link oficial para confirmar seus dados, criar sua senha e assumir o controle do seu painel: ${createdInviteLink}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <WhatsAppSolidIcon className="w-3.5 h-3.5 fill-white" />
                      <span>Enviar no WhatsApp</span>
                    </a>
                  </div>
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
                        <a
                          href={buildWhatsAppUrl(
                            c.requester_phone,
                            `Olá ${c.requester_name}! Recebemos sua solicitação para assumir a vitrine "${c.business_name || 'sua empresa'}" no Portal Vitriniza. Acesse o link oficial para concluir sua confirmação: https://vitriniza.vercel.app/reivindicar?slug=${c.business_id}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <WhatsAppSolidIcon className="w-3.5 h-3.5 fill-white" />
                          <span>WhatsApp</span>
                        </a>
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

            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              <div className="p-5 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-4">
                <h4 className="font-black text-sm text-[#0E3B43] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E36845]" />
                  <span>Personalização Visual: Logo & Banner Hero</span>
                </h4>

                {/* Logo URL & File Upload */}
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Logo da Plataforma</label>
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="text"
                      required
                      value={settingsForm.logoUrl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                      placeholder="/logo.png ou https://..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-white"
                    />
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E8E4DA] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settingsForm.logoUrl || '/logo.png'} alt="Preview Logo" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] hover:bg-stone-50 cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#E36845]" />
                      <span>📁 Enviar Arquivo do Dispositivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFileUpload(file, (dataUrl) => {
                              setSettingsForm((prev) => ({ ...prev, logoUrl: dataUrl }));
                            });
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, logoUrl: '/logo.png' })}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] hover:bg-stone-50"
                    >
                      Logo Padrão Vitriniza
                    </button>
                  </div>
                </div>

                {/* Hero Background Image URL & File Upload */}
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Imagem de Fundo do Banner Hero (Homepage)</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      required
                      value={settingsForm.heroBgUrl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroBgUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-white"
                    />

                    <label className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] hover:bg-stone-50 cursor-pointer shadow-2xs shrink-0">
                      <Upload className="w-3.5 h-3.5 text-[#E36845]" />
                      <span>📁 Enviar Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFileUpload(file, (dataUrl) => {
                              setSettingsForm((prev) => ({ ...prev, heroBgUrl: dataUrl }));
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  {/* Banner Preview */}
                  <div className="relative h-28 rounded-xl overflow-hidden border border-[#E8E4DA] bg-stone-900 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settingsForm.heroBgUrl} alt="Hero Banner Preview" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-2 text-white">
                      <span className="text-xs font-black drop-shadow">{settingsForm.heroTitle || 'Título da Homepage'}</span>
                      <span className="text-[10px] opacity-80 drop-shadow line-clamp-1">{settingsForm.heroSubtitle || 'Subtítulo'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#537379] mr-1">Fotos sugeridas:</span>
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, heroBgUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1800&auto=format&fit=crop&q=80' })}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E8E4DA] text-[10px] font-semibold text-[#0E3B43]"
                    >
                      Bairro/Comércio 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, heroBgUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&auto=format&fit=crop&q=80' })}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E8E4DA] text-[10px] font-semibold text-[#0E3B43]"
                    >
                      Lojas & Vitrines
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, heroBgUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1800&auto=format&fit=crop&q=80' })}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E8E4DA] text-[10px] font-semibold text-[#0E3B43]"
                    >
                      Gastronomia
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, heroBgUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1800&auto=format&fit=crop&q=80' })}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E8E4DA] text-[10px] font-semibold text-[#0E3B43]"
                    >
                      Imóveis/Cidade
                    </button>
                  </div>
                </div>

                {/* Hero Title */}
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Título Principal do Hero Banner</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.heroTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                    placeholder="Descubra o melhor perto de você."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-white"
                  />
                </div>

                {/* Hero Subtitle */}
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Subtítulo do Hero Banner</label>
                  <textarea
                    rows={2}
                    required
                    value={settingsForm.heroSubtitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                    placeholder="Encontre comércios, profissionais..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-white resize-none"
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-4">
                <h4 className="font-black text-sm text-[#0E3B43]">Preços dos Planos & Suporte</h4>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Plano Destaque Semanal (R$ / 7 dias)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={settingsForm.semanalPrice}
                    onChange={(e) => setSettingsForm({ ...settingsForm, semanalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp de Suporte da Vitriniza</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.contactWhatsApp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactWhatsApp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
              >
                Salvar Alterações Globais da Plataforma
              </button>
            </form>

            {/* Supabase Cloud Database Section */}
            <div className="pt-6 border-t border-[#E8E4DA] space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E36845]" />
                <h4 className="font-black text-sm text-[#0E3B43]">Sincronização em Nuvem (Supabase)</h4>
              </div>
              <p className="text-xs text-[#537379] max-w-xl">
                Envie todos os comércios, categorias, produtos e configurações para o banco em nuvem do Supabase. Assim, qualquer outro dispositivo ou visitante verá os cadastros em tempo real.
              </p>

              {cloudSyncMsg && (
                <div
                  className={cn(
                    'p-3.5 rounded-xl text-xs font-bold flex items-center gap-2',
                    cloudSyncMsg.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{cloudSyncMsg.text}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={isSyncingCloud}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0E3B43] hover:bg-[#154e58] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#4FA6A6]" />
                <span>{isSyncingCloud ? 'Sincronizando com Supabase...' : '🚀 Popular / Sincronizar Tudo com Supabase'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: GESTÃO DE EVENTOS NO BAIRRO */}
        {activeTab === 'events' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E8E4DA] pb-5">
              <div>
                <h3 className="font-black text-lg text-[#0E3B43] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#E36845]" />
                  <span>Gestão de Eventos no Bairro</span>
                </h3>
                <p className="text-xs text-[#537379]">
                  Cadastre, edite, ative ou desative feiras gastronômicas, bazares, shows e feiras do bairro exibidos no portal.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingEventId(null);
                  resetEventForm();
                  setIsEventModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Evento</span>
              </button>
            </div>

            {/* Events List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.length > 0 ? (
                events.map((evt) => (
                  <div key={evt.id} className="p-5 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] flex flex-col justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#E8E4DA]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={evt.image_url} alt={evt.title} className="w-full h-full object-cover" />
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                              evt.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                            )}
                          >
                            {evt.is_active ? 'Ativo na Homepage' : 'Inativo / Oculto'}
                          </span>
                        </div>
                        <h4 className="font-black text-xs text-[#0E3B43] line-clamp-1">{evt.title}</h4>
                        <div className="text-[11px] text-[#537379] space-y-0.5">
                          <p>📅 <strong>{evt.event_date}</strong> às {evt.event_time}</p>
                          <p>📍 {evt.location_name} - {evt.neighborhood_name}</p>
                          <p>👤 {evt.organizer_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#E8E4DA]">
                      <button
                        onClick={() => handleToggleEventActive(evt.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                          evt.is_active
                            ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        )}
                      >
                        {evt.is_active ? 'Desativar Evento' : 'Ativar Evento'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditEvent(evt)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] hover:bg-stone-50 cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#4FA6A6]" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-2 rounded-xl bg-white border border-[#E8E4DA] text-stone-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 p-8 text-center bg-[#F8F6F0] rounded-2xl border border-dashed border-[#E8E4DA] text-xs text-[#537379]">
                  Nenhum evento cadastrado ainda. Clique em "+ Cadastrar Novo Evento" para publicar feiras, bazares e eventos comunitários.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EVENT MODAL */}
      {isEventModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsEventModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 border border-[#4FA6A6]/20 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#0E3B43] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#E36845]" />
                <span>{editingEventId ? 'Editar Evento' : 'Cadastrar Novo Evento no Bairro'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Título do Evento *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Ex: Feira Gastronômica & Cultural de Guaianases"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845]"
                />
              </div>

              {/* Date & Time Picker Section */}
              <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Data do Evento *</label>
                    <input
                      type="date"
                      required
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Horário de Início *</label>
                    <input
                      type="time"
                      required
                      value={eventForm.start_time}
                      onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Horário de Término *</label>
                    <input
                      type="time"
                      required
                      value={eventForm.end_time}
                      onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#0E3B43] font-bold">
                  <span>📅 Formato exibido aos moradores:</span>
                  <span className="text-[#E36845]">
                    {formatDatePtBr(eventForm.event_date)} ({eventForm.start_time} às {eventForm.end_time})
                  </span>
                </div>
              </div>

              {/* Location & CEP Section */}
              <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Local / Espaço *</label>
                    <input
                      type="text"
                      required
                      value={eventForm.location_name}
                      onChange={(e) => setEventForm({ ...eventForm, location_name: e.target.value })}
                      placeholder="Ex: Praça de Eventos Guaianases"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">CEP do Local (ViaCEP)</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={eventForm.postal_code}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEventForm({ ...eventForm, postal_code: val });
                          if (val.replace(/\D/g, '').length === 8) {
                            handleLookupEventCep(val);
                          }
                        }}
                        placeholder="08410-000"
                        className="w-full pl-3.5 pr-22 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white font-medium focus:border-[#E36845]"
                      />
                      <button
                        type="button"
                        onClick={() => handleLookupEventCep(eventForm.postal_code)}
                        disabled={eventCepLoading}
                        className="absolute right-1 px-2.5 py-1.5 rounded-lg bg-[#0E3B43] hover:bg-[#154e58] text-white text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {eventCepLoading ? '...' : '🔍 Buscar'}
                      </button>
                    </div>
                  </div>
                </div>

                {eventCepMsg && (
                  <div
                    className={cn(
                      'p-2.5 rounded-xl text-xs font-bold flex items-center gap-2',
                      eventCepMsg.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    )}
                  >
                    <span>{eventCepMsg.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Endereço / Logradouro</label>
                  <input
                    type="text"
                    required
                    value={eventForm.address}
                    onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
                    placeholder="Ex: Estrada de Poá, s/n (Praça Central)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Bairro</label>
                    <input
                      type="text"
                      required
                      value={eventForm.neighborhood_name}
                      onChange={(e) => setEventForm({ ...eventForm, neighborhood_name: e.target.value })}
                      placeholder="Guaianases"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Cidade / UF</label>
                    <input
                      type="text"
                      required
                      value={eventForm.city_name}
                      onChange={(e) => setEventForm({ ...eventForm, city_name: e.target.value })}
                      placeholder="São Paulo/SP"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Organizador *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.organizer_name}
                    onChange={(e) => setEventForm({ ...eventForm, organizer_name: e.target.value })}
                    placeholder="Ex: Associação de Comerciantes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp de Contato (Opcional)</label>
                  <input
                    type="text"
                    value={eventForm.whatsapp_contact}
                    onChange={(e) => setEventForm({ ...eventForm, whatsapp_contact: e.target.value })}
                    placeholder="Ex: 11999998888"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Imagem do Evento</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={eventForm.image_url}
                    onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] hover:bg-stone-100 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#E36845]" />
                    <span>📁 Upload Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageFileUpload(file, (dataUrl) => {
                            setEventForm((prev) => ({ ...prev, image_url: dataUrl }));
                          });
                        }
                      }}
                    />
                  </label>
                </div>
                {eventForm.image_url && (
                  <div className="h-28 rounded-xl overflow-hidden border border-[#E8E4DA] bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={eventForm.image_url} alt="Preview Evento" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Descrição Completa do Evento</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Detalhes das atrações, horários, expositores..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E4DA] text-xs font-bold text-[#537379] hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  {editingEventId ? 'Salvar Alterações' : 'Publicar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BUSINESS MODAL (FOR MASTER ADMIN) */}
      {isEditBizModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto cursor-pointer"
          onClick={() => setIsEditBizModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 card-shadow space-y-6 my-8 cursor-default max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#0E3B43]">Editar Perfil do Estabelecimento</h3>
                <p className="text-xs text-[#537379]">Atualize todos os dados cadastrais da empresa no portal.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditBizModalOpen(false)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditBiz} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Estabelecimento *</label>
                  <input
                    type="text"
                    required
                    value={editBizForm.name}
                    onChange={(e) => setEditBizForm({ ...editBizForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Categoria *</label>
                  <select
                    value={editBizForm.category_id}
                    onChange={(e) => setEditBizForm({ ...editBizForm, category_id: e.target.value })}
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
                    value={editBizForm.neighborhood_id}
                    onChange={(e) => setEditBizForm({ ...editBizForm, neighborhood_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                  >
                    {neighborhoods.map((n) => (
                      <option key={n.id} value={n.id}>{n.name} (São Paulo)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">CEP (ViaCEP)</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={editBizForm.postal_code}
                      onChange={(e) => setEditBizForm({ ...editBizForm, postal_code: e.target.value })}
                      placeholder="08410-000"
                      className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setEditBizCepMsg('Buscando...');
                        const res = await fetchAddressByCep(editBizForm.postal_code);
                        if (res) {
                          setEditBizForm((prev) => ({
                            ...prev,
                            address: res.logradouro || prev.address,
                            postal_code: res.cep || prev.postal_code,
                          }));
                          setEditBizCepMsg(`✓ ${res.bairro || 'Endereço localizado'}`);
                        } else {
                          setEditBizCepMsg('❌ CEP não encontrado');
                        }
                      }}
                      className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-[#4FA6A6] text-white text-[11px] font-bold cursor-pointer hover:bg-[#3d8c8c]"
                    >
                      🔍 Buscar
                    </button>
                  </div>
                  {editBizCepMsg && (
                    <span className="text-[10px] font-bold text-[#4FA6A6] mt-1 block">{editBizCepMsg}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Endereço (Rua/Av) *</label>
                  <input
                    type="text"
                    required
                    value={editBizForm.address}
                    onChange={(e) => setEditBizForm({ ...editBizForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Número</label>
                  <input
                    type="text"
                    value={editBizForm.number}
                    onChange={(e) => setEditBizForm({ ...editBizForm, number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp para Atendimento *</label>
                  <input
                    type="text"
                    required
                    value={editBizForm.whatsapp}
                    onChange={(e) => setEditBizForm({ ...editBizForm, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Plano Atual</label>
                  <select
                    value={editBizForm.plan_id}
                    onChange={(e) => setEditBizForm({ ...editBizForm, plan_id: e.target.value as PlanTier })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                  >
                    <option value="free">Gratuito (R$ 0)</option>
                    <option value="semanal">Semanal (R$ 19,90)</option>
                    <option value="mensal">Mensal (R$ 49,90)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Instagram (@usuario)</label>
                  <input
                    type="text"
                    value={editBizForm.instagram}
                    onChange={(e) => setEditBizForm({ ...editBizForm, instagram: e.target.value })}
                    placeholder="@sualoja"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Breve Descrição do Negócio</label>
                  <textarea
                    rows={2}
                    value={editBizForm.short_description}
                    onChange={(e) => setEditBizForm({ ...editBizForm, short_description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">URL do Logo / Foto Principal</label>
                  <input
                    type="text"
                    value={editBizForm.logo_url}
                    onChange={(e) => setEditBizForm({ ...editBizForm, logo_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">URL da Capa do Perfil</label>
                  <input
                    type="text"
                    value={editBizForm.cover_url}
                    onChange={(e) => setEditBizForm({ ...editBizForm, cover_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#0E3B43] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBizForm.is_active}
                      onChange={(e) => setEditBizForm({ ...editBizForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-[#4FA6A6]"
                    />
                    <span>Loja Ativa na Plataforma</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-[#0E3B43] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBizForm.is_featured}
                      onChange={(e) => setEditBizForm({ ...editBizForm, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded text-[#E36845]"
                    />
                    <span>★ Selo Destaque</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-[#0E3B43] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBizForm.is_verified}
                      onChange={(e) => setEditBizForm({ ...editBizForm, is_verified: e.target.checked })}
                      className="w-4 h-4 rounded text-[#4FA6A6]"
                    />
                    <span>✓ Selo Verificado</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E4DA]">
                <button
                  type="button"
                  onClick={() => setIsEditBizModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold hover:bg-stone-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#154e58] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
