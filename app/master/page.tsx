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
  Clock,
  Flame,
  Check,
  X,
  FileText,
  UserCheck,
  RefreshCw,
  Send,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import {
  Business,
  Category,
  City,
  Neighborhood,
  ClaimRequest,
  Banner,
  PlatformSettings,
  PlanTier,
  LocalEvent,
  BusinessRequest,
  Subscription,
  AuditLog,
  ListingType,
  SubscriptionStatus,
} from '@/types';
import { formatCurrency, formatPhone, cn, fetchAddressByCep, formatDatePtBr, buildWhatsAppUrl } from '@/lib/utils';
import { WhatsAppSolidIcon } from '@/components/ui/Icons';
import { supabase } from '@/lib/supabase/client';

export default function MasterAdminPage() {
  // SECURITY AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'requests'
    | 'businesses'
    | 'subscriptions'
    | 'create_business'
    | 'audit'
    | 'claims'
    | 'events'
    | 'regions'
    | 'categories'
    | 'banners'
    | 'settings'
  >('dashboard');

  const [stats, setStats] = useState(store.getMasterStats());
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessRequests, setBusinessRequests] = useState<BusinessRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(store.getPlatformSettings());

  // Search & Filters for business table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Requests filters
  const [reqFilterStatus, setReqFilterStatus] = useState<string>('all');
  const [reqFilterType, setReqFilterType] = useState<string>('all');

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
    listing_type: 'local_free' as ListingType,
    owner_name: '',
    owner_email: '',
    owner_password: '',
    owner_password_confirmation: '',
  });

  // Modal: Convert to Pro
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingBiz, setConvertingBiz] = useState<Business | null>(null);
  const [convertForm, setConvertForm] = useState({
    ownerName: '',
    email: '',
    whatsapp: '',
    price: 49.9,
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    password: '',
    passwordConfirmation: '',
  });
  const [createdAccess, setCreatedAccess] = useState<{
    email: string;
    password: string;
    accountCreated: boolean;
  } | null>(null);

  // Modal: Pitch Summary ("Oferecer Pro")
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [pitchBiz, setPitchBiz] = useState<Business | null>(null);
  const [pitchData, setPitchData] = useState<{
    viewsCount: number;
    whatsappClicks: number;
    mapClicks: number;
    shareClicks: number;
    pitchText: string;
  } | null>(null);

  // Modal: Edit Business
  const [isEditBizModalOpen, setIsEditBizModalOpen] = useState(false);
  const [editingBizId, setEditingBizId] = useState<string | null>(null);
  const [editBizCepMsg, setEditBizCepMsg] = useState<string | null>(null);
  const [editBizForm, setEditBizForm] = useState({
    name: '',
    category_id: '',
    neighborhood_id: '',
    address: '',
    number: '',
    postal_code: '08410-000',
    phone: '',
    whatsapp: '',
    instagram: '',
    short_description: '',
    listing_type: 'local_free' as ListingType,
    plan_id: 'free' as PlanTier,
    is_active: true,
    is_featured: false,
    is_verified: false,
    is_founder: false,
    is_online_only: false,
    logo_url: '',
    cover_url: '',
  });

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

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    proPrice: settings.pro_plan?.price || settings.plan_prices.pro || 49.9,
    proName: settings.pro_plan?.name || 'Vitriniza Pro',
    contactWhatsApp: settings.contact_whatsapp,
    contactEmail: settings.contact_email,
    logoUrl: settings.logo_url || '/logo.png',
    heroBgUrl:
      settings.hero_bg_url ||
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1800&auto=format&fit=crop&q=80',
    heroTitle: settings.hero_title || 'Descubra o melhor perto de você.',
    heroSubtitle:
      settings.hero_subtitle ||
      'Encontre comércios, profissionais, serviços e promoções no seu bairro e fale diretamente pelo WhatsApp.',
  });

  // Validate the administrator session against Supabase Auth and the profiles table.
  useEffect(() => {
    let active = true;

    const validateAdmin = async () => {
      if (!supabase) {
        if (active) setIsAuthenticated(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (active) setIsAuthenticated(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle();

      const authorized = !profileError && profile?.role === 'admin';
      if (authorized) await store.ensureCloudSynced(true);
      if (active) setIsAuthenticated(authorized);
    };

    void validateAdmin();
    return () => {
      active = false;
    };
  }, []);

  const refreshData = () => {
    setStats(store.getMasterStats());
    const bizList = store.getBusinesses();
    setBusinesses(bizList);
    setBusinessRequests(store.getBusinessRequests());
    setSubscriptions(store.getSubscriptions());
    setAuditLogs(store.getAuditLogs());
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

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      return store.subscribe(() => refreshData());
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!supabase) {
      setAuthError('O serviço de autenticação está temporariamente indisponível.');
      return;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail.trim().toLowerCase(),
      password: adminPassword,
    });

    if (signInError || !signInData.user) {
      setAuthError('E-mail ou senha inválidos.');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', signInData.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setAuthError('Esta conta não possui permissão administrativa.');
      return;
    }

    setIsAuthenticated(true);
    await store.ensureCloudSynced(true);
    refreshData();
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAdminPassword('');
  };

  // --- ACTIONS: REQUESTS MODERATION ---
  const handleApproveLocalFree = async (requestId: string) => {
    if (!confirm('Deseja aprovar este comércio como Cadastro Local Gratuito? A vitrine será publicada imediatamente sem criação de conta/painel.')) return;
    const res = await store.approveLocalFreeRequest(requestId);
    if (res.success) {
      alert('✓ Cadastro Local Gratuito aprovado e publicado com sucesso!');
      refreshData();
    } else {
      alert('Erro: ' + res.error);
    }
  };

  const handleOpenProModalFromRequest = (req: BusinessRequest) => {
    // Find matching business or prepare creation
    const matchingBiz = businesses.find((b) => b.name.toLowerCase() === req.business_name.toLowerCase());
    if (matchingBiz) {
      handleOpenConvertModal(matchingBiz, req.owner_name, req.email, req.whatsapp);
    } else {
      // Create local_free first, then open conversion
      store.approveLocalFreeRequest(req.id).then((res) => {
        if (res.business) {
          handleOpenConvertModal(res.business, req.owner_name, req.email, req.whatsapp);
        }
      });
    }
  };

  const handleUpdateReqStatus = async (requestId: string, status: BusinessRequest['status']) => {
    await store.updateBusinessRequestStatus(requestId, status);
    refreshData();
  };

  // --- ACTIONS: CONVERSION LOCAL -> PRO ---
  const handleOpenConvertModal = (biz: Business, initialOwner = '', initialEmail = '', initialPhone = '') => {
    setConvertingBiz(biz);
    setConvertForm({
      ownerName: initialOwner || '',
      email: initialEmail || '',
      whatsapp: initialPhone || biz.whatsapp || '',
      price: settings.pro_plan?.price || 49.9,
      startsAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      password: '',
      passwordConfirmation: '',
    });
    setCreatedAccess(null);
    setIsConvertModalOpen(true);
  };

  const createProAccess = async (payload: {
    businessId: string;
    email: string;
    name: string;
    whatsapp: string;
    price: number;
    startsAt: string;
    expiresAt: string;
    password: string;
  }) => {
    if (!supabase) throw new Error('O serviço de autenticação está indisponível.');
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('Sua sessão expirou. Entre novamente no painel Master.');
    const { data, error } = await supabase.functions.invoke('create-pro-user', {
      body: payload,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const result = (data || {}) as {
      success?: boolean;
      error?: string;
      accountCreated?: boolean;
    };
    if (error || !result.success) {
      throw new Error(result.error || error?.message || 'Falha ao criar conta Pro.');
    }
    return {
      accountCreated: Boolean(result.accountCreated),
    };
  };

  const handleExecuteConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingBiz) return;
    if (!convertForm.ownerName || !convertForm.email) {
      alert('Por favor, preencha o nome do responsável e e-mail para liberação do acesso.');
      return;
    }
    if (convertForm.password.length < 8 || convertForm.password !== convertForm.passwordConfirmation) {
      alert('A senha deve ter pelo menos 8 caracteres e a confirmação deve ser igual.');
      return;
    }

    try {
      const result = await createProAccess({
        email: convertForm.email,
        name: convertForm.ownerName,
        whatsapp: convertForm.whatsapp,
        businessId: convertingBiz.id,
        price: Number(convertForm.price),
        startsAt: convertForm.startsAt,
        expiresAt: convertForm.expiresAt,
        password: convertForm.password,
      });
      setCreatedAccess({
        email: convertForm.email,
        password: convertForm.password,
        accountCreated: result.accountCreated,
      });
      await store.ensureCloudSynced(true);
      refreshData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao criar conta Pro.';
      alert(message);
    }
  };

  const handleCopyAccessLink = async () => {
    if (!createdAccess) return;
    await navigator.clipboard.writeText(
      `E-mail: ${createdAccess.email}\nSenha temporária: ${createdAccess.password}\nAcesso: ${window.location.origin}/login`
    );
    alert('Dados de acesso copiados.');
  };

  const handleSendAccessByWhatsApp = () => {
    if (!createdAccess || !convertingBiz) return;
    const message =
      `Olá! Seu acesso ao painel da Vitriniza para *${convertingBiz.name}* foi liberado.\n\n` +
      `Acesso: ${window.location.origin}/login\n` +
      `E-mail: ${createdAccess.email}\n` +
      `Senha temporária: ${createdAccess.password}\n\n` +
      'Por segurança, não compartilhe estes dados com outras pessoas.';
    window.open(buildWhatsAppUrl(convertForm.whatsapp || convertingBiz.whatsapp, message), '_blank', 'noopener,noreferrer');
  };

  // --- ACTIONS: COMMERCIAL PITCH ("OFERECER PRO") ---
  const handleOpenPitch = (biz: Business) => {
    setPitchBiz(biz);
    const summary = store.getProPitchSummary(biz.id);
    setPitchData(summary);
    setIsPitchModalOpen(true);
  };

  // --- ACTIONS: SUBSCRIPTION MANUAL CONTROLS ---
  const handleUpdateSubscription = async (subId: string, status: SubscriptionStatus) => {
    await store.updateSubscriptionStatus(subId, status);
    refreshData();
  };

  const handleRenewSubscription = async (subId: string) => {
    await store.renewSubscription(subId, 30);
    alert('✓ Assinatura renovada por +30 dias!');
    refreshData();
  };

  // --- ACTIONS: BUSINESS EDITING & CREATION ---
  const handleToggleActive = (bizId: string, currentActive: boolean) => {
    store.updateBusiness(bizId, { is_active: !currentActive });
    refreshData();
  };

  const handleToggleFeatured = (bizId: string, currentFeatured: boolean) => {
    store.updateBusiness(bizId, { is_featured: !currentFeatured });
    refreshData();
  };

  const handleToggleVerified = (bizId: string, currentVerified: boolean) => {
    store.updateBusiness(bizId, { is_verified: !currentVerified });
    refreshData();
  };

  const handleToggleFounder = (bizId: string, currentFounder = false) => {
    store.updateBusiness(bizId, { is_founder: !currentFounder });
    refreshData();
  };

  const handleDeleteBusiness = (bizId: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa da plataforma?')) {
      store.deleteBusiness(bizId);
      refreshData();
    }
  };

  const handleOpenEditBizModal = (biz: Business) => {
    setEditingBizId(biz.id);
    setEditBizCepMsg(null);
    setEditBizForm({
      name: biz.name,
      category_id: biz.category_id,
      neighborhood_id: biz.neighborhood_id,
      address: biz.address,
      number: biz.number || '',
      postal_code: biz.postal_code || '08410-000',
      phone: biz.phone,
      whatsapp: biz.whatsapp,
      instagram: biz.instagram || '',
      short_description: biz.short_description || '',
      listing_type: biz.listing_type || (biz.plan_id === 'free' ? 'local_free' : 'paid'),
      plan_id: biz.plan_id,
      is_active: biz.is_active,
      is_featured: biz.is_featured,
      is_verified: biz.is_verified,
      is_founder: Boolean(biz.is_founder),
      is_online_only: Boolean(biz.is_online_only),
      logo_url: biz.logo_url || '/logo.png',
      cover_url: biz.cover_url || '/logo.png',
    });
    setIsEditBizModalOpen(true);
  };

  const handleSaveEditBiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBizId) return;

    const currentBusiness = businesses.find((business) => business.id === editingBizId);
    if (!currentBusiness) return;
    const needsAccess = editBizForm.listing_type === 'paid' && !currentBusiness.owner_user_id;

    const savedBusiness = store.updateBusiness(editingBizId, {
      name: editBizForm.name,
      category_id: editBizForm.category_id,
      neighborhood_id: editBizForm.neighborhood_id,
      address: editBizForm.address,
      number: editBizForm.number,
      postal_code: editBizForm.postal_code,
      phone: editBizForm.phone,
      whatsapp: editBizForm.whatsapp,
      instagram: editBizForm.instagram,
      short_description: editBizForm.short_description,
      listing_type: needsAccess ? currentBusiness.listing_type : editBizForm.listing_type,
      plan_id: needsAccess ? currentBusiness.plan_id : editBizForm.listing_type === 'paid' ? 'pro' : 'free',
      is_active: editBizForm.is_active,
      is_featured: editBizForm.is_featured,
      is_verified: editBizForm.is_verified,
      is_founder: editBizForm.is_founder,
      is_online_only: editBizForm.is_online_only,
      logo_url: editBizForm.logo_url,
      cover_url: editBizForm.cover_url,
    });

    store.logAudit('business_updated', editingBizId, editBizForm.name, { updated: editBizForm });
    refreshData();
    setIsEditBizModalOpen(false);
    if (needsAccess && savedBusiness) {
      handleOpenConvertModal(savedBusiness, '', '', editBizForm.whatsapp);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.address) return;

    const matchingCat = categories.find((c) => c.id === createForm.category_id) || categories[0];
    const matchingNeigh = neighborhoods.find((n) => n.id === createForm.neighborhood_id) || neighborhoods[0];

    const slug = createForm.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const requestedPro = createForm.listing_type === 'paid';
    if (
      requestedPro &&
      (!createForm.owner_email ||
        !createForm.owner_name ||
        createForm.owner_password.length < 8 ||
        createForm.owner_password !== createForm.owner_password_confirmation)
    ) {
      alert('Informe responsável, e-mail e uma senha de pelo menos 8 caracteres com confirmação igual.');
      return;
    }

    const newBiz = store.createBusiness({
      name: createForm.name,
      slug: slug || `comercio-${Date.now()}`,
      category_id: createForm.category_id || categories[0]?.id || 'cat-alimentacao',
      neighborhood_id: createForm.neighborhood_id || neighborhoods[0]?.id || 'neigh-guaianases',
      city_id: 'city-sp',
      state_id: 'SP',
      address: createForm.address,
      number: createForm.number || 'S/N',
      postal_code: createForm.postal_code,
      phone: createForm.phone,
      whatsapp: createForm.whatsapp,
      short_description: createForm.short_description || `${matchingCat?.name} em ${matchingNeigh?.name}`,
      description: createForm.description || createForm.short_description || `${matchingCat?.name} em ${matchingNeigh?.name}`,
      listing_type: 'local_free',
      ownership_status: 'unclaimed',
      plan_id: 'free',
      plan_status: 'active',
      is_active: true,
      is_verified: true,
      is_featured: false,
      cover_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      logo_url: '/logo.png',
      payment_methods: ['Pix', 'Cartão de Crédito', 'Dinheiro'],
      delivery_available: true,
      takeaway_available: true,
      dine_in_available: false,
    });

    if (requestedPro) {
      const persisted = await store.persistBusinessToCloud(newBiz.id);
      if (!persisted) {
        alert('O cadastro foi salvo localmente, mas não chegou ao Supabase. Tente novamente antes de liberar o acesso.');
        return;
      }

      try {
        const startsAt = new Date().toISOString().split('T')[0];
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const result = await createProAccess({
          businessId: newBiz.id,
          email: createForm.owner_email,
          name: createForm.owner_name,
          whatsapp: createForm.whatsapp,
          price: settings.pro_plan?.price || 49.9,
          startsAt,
          expiresAt,
          password: createForm.owner_password,
        });
        setConvertingBiz(newBiz);
        setConvertForm({
          ownerName: createForm.owner_name,
          email: createForm.owner_email,
          whatsapp: createForm.whatsapp,
          price: settings.pro_plan?.price || 49.9,
          startsAt,
          expiresAt,
          password: createForm.owner_password,
          passwordConfirmation: createForm.owner_password,
        });
        setCreatedAccess({
          email: createForm.owner_email,
          password: createForm.owner_password,
          accountCreated: result.accountCreated,
        });
        setIsConvertModalOpen(true);
        await store.ensureCloudSynced(true);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Falha ao criar conta Pro.';
        alert(`O estabelecimento foi cadastrado, mas o acesso não foi criado: ${message}`);
        handleOpenConvertModal(newBiz, createForm.owner_name, createForm.owner_email, createForm.whatsapp);
        return;
      }
    }

    if (!requestedPro) alert(`✓ Estabelecimento "${newBiz.name}" cadastrado com sucesso!`);
    refreshData();
    setActiveTab('businesses');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updatePlatformSettings({
      pro_plan: {
        name: settingsForm.proName,
        price: Number(settingsForm.proPrice),
        interval: 'mensal',
        features: [
          'Painel do Comerciante exclusivo',
          'Catálogo de produtos e serviços ilimitado',
          'Publicação contínua de Ofertas em Destaque 🔥',
          'QR Code com logotipo e display para balcão',
          'Métricas de acessos, cliques no WhatsApp e rotas',
          'Gerador de artes prontas para Instagram e Status',
          'Gestão de avaliações de moradores',
        ],
        status: 'active',
      },
      plan_prices: {
        semanal: 19.9,
        mensal: Number(settingsForm.proPrice),
        destaque: 19.9,
        pro: Number(settingsForm.proPrice),
        premium: Number(settingsForm.proPrice),
      },
      contact_whatsapp: settingsForm.contactWhatsApp,
      contact_email: settingsForm.contactEmail,
      logo_url: settingsForm.logoUrl,
      hero_bg_url: settingsForm.heroBgUrl,
      hero_title: settingsForm.heroTitle,
      hero_subtitle: settingsForm.heroSubtitle,
    });
    refreshData();
    alert('✓ Configurações do SaaS salvas com sucesso!');
  };

  // Filtered businesses
  const filteredBusinesses = businesses.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.neighborhood?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isPro = b.listing_type === 'paid' || (b.plan_id !== 'free' && b.listing_type !== 'local_free');
    const matchType = !filterType || (filterType === 'pro' && isPro) || (filterType === 'local_free' && !isPro);
    const matchActive =
      !filterActive ||
      (filterActive === 'active' && b.is_active) ||
      (filterActive === 'inactive' && !b.is_active);
    return matchSearch && matchType && matchActive;
  });

  // Filtered requests
  const filteredRequests = store.getBusinessRequests(reqFilterStatus, reqFilterType);

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
                placeholder="voce@empresa.com.br"
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
                  Super Admin SaaS
                </span>
              </div>
              <p className="text-[11px] text-[#F8F6F0]/70">Gestão de Cadastros Locais, Assinaturas Pro e Solicitações</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                await store.ensureCloudSynced(true);
                refreshData();
                alert('✓ Dados sincronizados com a nuvem em tempo real!');
              }}
              title="Sincronizar alterações da nuvem"
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
              <span>Portal</span>
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
            { id: 'dashboard', label: 'Dashboard & MRR', icon: TrendingUp },
            { id: 'requests', label: 'Solicitações Comerciais', icon: Send, count: stats.pendingRequests },
            { id: 'businesses', label: 'Empresas & Vitrines', icon: Building, count: businesses.length },
            { id: 'subscriptions', label: 'Assinaturas & Pagamentos', icon: CreditCard, count: stats.activeSubscriptions },
            { id: 'create_business', label: '+ Cadastrar Negócio', icon: Plus },
            { id: 'audit', label: 'Auditoria', icon: FileText },
            { id: 'claims', label: 'Reivindicações', icon: AlertCircle, count: stats.pendingClaims },
            { id: 'events', label: 'Eventos no Bairro', icon: Calendar, count: events.length },
            { id: 'settings', label: 'Configurações do SaaS', icon: Settings },
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
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#E36845] text-white'
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43] flex items-center justify-center font-bold shrink-0">
                  <DollarSign className="w-6 h-6 text-[#E36845]" />
                </div>
                <div>
                  <span className="text-xs text-[#537379] font-medium">MRR Recorrente (Pro)</span>
                  <div className="text-2xl font-black text-[#0E3B43]">{formatCurrency(stats.estimatedMRR)}</div>
                  <span className="text-[10px] text-[#4FA6A6] font-bold">{stats.activeSubscriptions} assinaturas ativas</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43] flex items-center justify-center font-bold shrink-0">
                  <Building className="w-6 h-6 text-[#4FA6A6]" />
                </div>
                <div>
                  <span className="text-xs text-[#537379] font-medium">Total de Comércios</span>
                  <div className="text-2xl font-black text-[#0E3B43]">{stats.totalBusinesses}</div>
                  <span className="text-[10px] text-[#537379]">
                    {stats.proPaidCount} Pro • {stats.localFreeCount} Cadastro Local
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#537379] font-medium">Cliques no WhatsApp</span>
                  <div className="text-2xl font-black text-[#0E3B43]">{stats.totalWhatsappClicks}</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Leads gerados no bairro</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E36845]/15 text-[#E36845] flex items-center justify-center font-bold shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#537379] font-medium">Solicitações Pendentes</span>
                  <div className="text-2xl font-black text-[#E36845]">{stats.pendingRequests}</div>
                  <span className="text-[10px] text-[#537379]">Aguardando ativação</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REQUESTS (SOLICITAÇÕES COMERCIAIS) */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#4FA6A6]/20 card-shadow">
              <div>
                <h3 className="font-black text-base text-[#0E3B43]">Solicitações de Participação</h3>
                <p className="text-xs text-[#537379]">Comerciantes e prestadores que solicitaram entrada pela página comercial.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={reqFilterStatus}
                  onChange={(e) => setReqFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendentes</option>
                  <option value="contacted">Em Contato</option>
                  <option value="approved">Aprovadas</option>
                  <option value="rejected">Recusadas</option>
                </select>

                <select
                  value={reqFilterType}
                  onChange={(e) => setReqFilterType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="local_free">Cadastro Local (Grátis)</option>
                  <option value="pro">Vitriniza Pro (Pago)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-5 sm:p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-base text-[#0E3B43]">{req.business_name}</h4>
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                            req.interest_type === 'pro'
                              ? 'bg-[#E36845] text-white'
                              : 'bg-[#0E3B43]/10 text-[#0E3B43]'
                          )}
                        >
                          {req.interest_type === 'pro' ? '⭐ Vitriniza Pro' : 'Cadastro Local'}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-black uppercase',
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : req.status === 'contacted'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          )}
                        >
                          {req.status === 'pending'
                            ? 'Pendente'
                            : req.status === 'contacted'
                            ? 'Em Contato'
                            : req.status === 'approved'
                            ? 'Aprovada'
                            : 'Recusada'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-[#537379]">
                        <p><strong>Responsável:</strong> {req.owner_name}</p>
                        <p><strong>WhatsApp:</strong> {formatPhone(req.whatsapp)}</p>
                        {req.email && <p><strong>E-mail:</strong> {req.email}</p>}
                        {req.instagram && <p><strong>Instagram:</strong> @{req.instagram}</p>}
                        <p><strong>Bairro:</strong> {req.neighborhood_name || 'Guaianases'} • {req.category_name}</p>
                        {req.address && <p><strong>Endereço:</strong> {req.address}</p>}
                      </div>

                      {req.message && (
                        <p className="text-xs bg-[#F8F6F0] p-2.5 rounded-xl border border-[#E8E4DA] text-[#0E3B43] italic">
                          “{req.message}”
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={buildWhatsAppUrl(
                          req.whatsapp,
                          `Olá ${req.owner_name}! Recebemos sua solicitação para cadastrar "${req.business_name}" na Vitriniza (${req.neighborhood_name || 'Guaianases'}). Podemos confirmar as informações para ativar sua vitrine?`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <WhatsAppSolidIcon className="w-3.5 h-3.5 fill-white" />
                        <span>WhatsApp</span>
                      </a>

                      {req.status !== 'approved' && (
                        <>
                          {req.interest_type === 'local_free' ? (
                            <button
                              type="button"
                              onClick={() => handleApproveLocalFree(req.id)}
                              className="px-3.5 py-2 rounded-xl bg-[#0E3B43] hover:bg-[#154e58] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Aprovar Cadastro Local</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenProModalFromRequest(req)}
                              className="px-3.5 py-2 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Criar Conta Pro</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleUpdateReqStatus(req.id, 'contacted')}
                            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#0E3B43] text-xs font-bold cursor-pointer"
                          >
                            Em Contato
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateReqStatus(req.id, 'rejected')}
                            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-red-50 text-red-600 text-xs font-bold cursor-pointer"
                          >
                            Recusar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-[#E8E4DA] text-xs text-[#537379]">
                  Nenhuma solicitação encontrada com os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BUSINESSES TABLE */}
        {activeTab === 'businesses' && (
          <div className="space-y-4">
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
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                >
                  <option value="">Todos os Tipos</option>
                  <option value="pro">Vitriniza Pro (Pago)</option>
                  <option value="local_free">Cadastro Local (Grátis)</option>
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

            <div className="bg-white rounded-3xl border border-[#4FA6A6]/20 card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6F0] text-[#0E3B43] font-bold uppercase tracking-wider text-[10px] border-b border-[#E8E4DA]">
                    <tr>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Bairro / Cat.</th>
                      <th className="py-3 px-4">Presença / Plano</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Selos</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DA]">
                    {filteredBusinesses.map((b) => {
                      const isPro = b.listing_type === 'paid' || (b.plan_id !== 'free' && b.listing_type !== 'local_free');
                      return (
                        <tr key={b.id} className="hover:bg-[#F8F6F0]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-black text-sm text-[#0E3B43]">{b.name}</div>
                            <div className="text-[11px] text-[#537379]">{formatPhone(b.whatsapp)}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0E3B43]">{b.neighborhood?.name || 'Guaianases'}</div>
                            <div className="text-[11px] text-[#4FA6A6] font-semibold">{b.category?.name}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isPro ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E36845] text-white font-black text-[10px] uppercase shadow-2xs">
                                <Sparkles className="w-3 h-3" />
                                <span>Vitriniza Pro</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0E3B43]/10 text-[#0E3B43] font-bold text-[10px] uppercase">
                                <span>Cadastro Local</span>
                              </span>
                            )}
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
                                onClick={() => handleToggleFounder(b.id, b.is_founder)}
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer',
                                  b.is_founder ? 'bg-amber-100 text-amber-900 font-black border border-amber-300' : 'bg-stone-100 text-stone-400'
                                )}
                              >
                                🏅 Fundador
                              </button>
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
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!b.owner_user_id && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenConvertModal(b)}
                                    className="px-2.5 py-1 rounded-lg bg-[#E36845] hover:bg-[#F49C6B] text-white text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                    title={isPro ? 'Criar e vincular conta de acesso ao painel' : 'Converter Cadastro Local para Plano Pro com painel liberado'}
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>{isPro ? 'Criar acesso' : 'Converter Pro'}</span>
                                  </button>

                                  {!isPro && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPitch(b)}
                                      className="px-2.5 py-1 rounded-lg bg-[#4FA6A6]/20 hover:bg-[#4FA6A6] text-[#0E3B43] hover:text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="Ver métricas de acessos e gerar mensagem de prospecção via WhatsApp"
                                    >
                                      <TrendingUp className="w-3 h-3" />
                                      <span>Oferecer Pro</span>
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditBizModal(b)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#0E3B43] transition-all cursor-pointer"
                                title="Editar dados cadastrais"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <Link
                                href={`/${b.state_id?.toLowerCase() || 'sp'}/${b.city?.slug || 'sao-paulo'}/${b.neighborhood?.slug || 'guaianases'}/${b.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-[#F8F6F0] hover:bg-[#4FA6A6]/20 text-[#0E3B43]"
                                title="Ver vitrine pública"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                onClick={() => handleDeleteBusiness(b.id)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                                title="Excluir empresa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUBSCRIPTIONS & PAYMENTS */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-[#0E3B43]">Assinaturas Vitriniza Pro</h3>
                <p className="text-xs text-[#537379]">Controle manual de pagamentos, renovações e status das contas Pro.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#537379]">Total Ativas:</span>
                <span className="text-xl font-black text-[#0E3B43] block">{stats.activeSubscriptions}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#4FA6A6]/20 card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6F0] text-[#0E3B43] font-bold uppercase tracking-wider text-[10px] border-b border-[#E8E4DA]">
                    <tr>
                      <th className="py-3 px-4">Estabelecimento</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Início</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Controles Manuais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DA]">
                    {subscriptions.map((sub) => {
                      const biz = businesses.find((b) => b.id === sub.business_id);
                      return (
                        <tr key={sub.id} className="hover:bg-[#F8F6F0]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-black text-sm text-[#0E3B43]">{biz?.name || sub.business_id}</div>
                            <div className="text-[11px] text-[#537379]">{biz?.neighborhood?.name || 'Guaianases'}</div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-[#0E3B43]">{sub.plan_name}</td>
                          <td className="py-3.5 px-4 font-black text-[#0E3B43]">{formatCurrency(sub.price)}</td>
                          <td className="py-3.5 px-4 text-[#537379]">{sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('pt-BR') : '—'}</td>
                          <td className="py-3.5 px-4 font-bold text-[#0E3B43]">
                            {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('pt-BR') : '—'}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-black uppercase',
                                sub.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : sub.status === 'expired' || sub.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-stone-200 text-stone-600'
                              )}
                            >
                              {sub.status === 'active'
                                ? 'Ativa'
                                : sub.status === 'pending'
                                ? 'Pendente'
                                : sub.status === 'expired'
                                ? 'Vencida'
                                : sub.status === 'overdue'
                                ? 'Atrasada'
                                : 'Cancelada'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {sub.status !== 'active' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubscription(sub.id, 'active')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Confirmar Pgto
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRenewSubscription(sub.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#4FA6A6] hover:bg-[#3d8c8c] text-white text-[11px] font-bold cursor-pointer"
                              >
                                Renovar (+30d)
                              </button>

                              {sub.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubscription(sub.id, 'expired')}
                                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-red-50 text-red-600 text-[11px] font-bold cursor-pointer"
                                >
                                  Expirar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CREATE BUSINESS */}
        {activeTab === 'create_business' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
            <div>
              <h3 className="font-black text-lg text-[#0E3B43]">Cadastrar Novo Estabelecimento</h3>
              <p className="text-xs text-[#537379]">
                Selecione se o cadastro será um Cadastro Local (gratuito e sem login) ou Vitriniza Pro (com conta e painel).
              </p>
            </div>

            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Tipo de Presença *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, listing_type: 'local_free' })}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        createForm.listing_type === 'local_free'
                          ? 'border-[#0E3B43] bg-[#0E3B43]/5 text-[#0E3B43]'
                          : 'border-[#E8E4DA] bg-white text-[#537379]'
                      }`}
                    >
                      <span className="font-black text-xs block">Cadastro Local</span>
                      <span className="text-[11px]">Sem usuário, sem painel. Administrado pelo Master.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, listing_type: 'paid' })}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        createForm.listing_type === 'paid'
                          ? 'border-[#E36845] bg-[#E36845]/5 text-[#0E3B43]'
                          : 'border-[#E8E4DA] bg-white text-[#537379]'
                      }`}
                    >
                      <span className="font-black text-xs block text-[#E36845]">⭐ Vitriniza Pro</span>
                      <span className="text-[11px]">Cria conta, libera painel e ativa assinatura.</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Estabelecimento *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Sorveteria Sabor do Bairro"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none bg-[#F8F6F0]"
                  />
                </div>

                {createForm.listing_type === 'paid' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Responsável *</label>
                      <input
                        type="text"
                        required
                        value={createForm.owner_name}
                        onChange={(e) => setCreateForm({ ...createForm, owner_name: e.target.value })}
                        placeholder="Ex: Carlos Silva"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none bg-[#F8F6F0]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">E-mail para Acesso ao Painel *</label>
                      <input
                        type="email"
                        required
                        value={createForm.owner_email}
                        onChange={(e) => setCreateForm({ ...createForm, owner_email: e.target.value })}
                        placeholder="contato@sualoja.com.br"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none bg-[#F8F6F0]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">Senha temporária *</label>
                      <input
                        type="password"
                        minLength={8}
                        required
                        autoComplete="new-password"
                        value={createForm.owner_password}
                        onChange={(e) => setCreateForm({ ...createForm, owner_password: e.target.value })}
                        placeholder="Mínimo de 8 caracteres"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none bg-[#F8F6F0]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">Confirmar senha *</label>
                      <input
                        type="password"
                        minLength={8}
                        required
                        autoComplete="new-password"
                        value={createForm.owner_password_confirmation}
                        onChange={(e) => setCreateForm({ ...createForm, owner_password_confirmation: e.target.value })}
                        placeholder="Repita a senha"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none bg-[#F8F6F0]"
                      />
                    </div>
                  </>
                )}

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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none bg-[#F8F6F0]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-sm text-[#0E3B43] outline-none bg-[#F8F6F0]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Cadastrar Estabelecimento
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow">
              <h3 className="font-black text-lg text-[#0E3B43]">Histórico de Auditoria</h3>
              <p className="text-xs text-[#537379]">Registro de ações administrativas e alterações de plano.</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#4FA6A6]/20 card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6F0] text-[#0E3B43] font-bold uppercase tracking-wider text-[10px] border-b border-[#E8E4DA]">
                    <tr>
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4">Ação</th>
                      <th className="py-3 px-4">Estabelecimento</th>
                      <th className="py-3 px-4">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DA]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F8F6F0]/60 transition-colors">
                        <td className="py-3.5 px-4 text-[#537379]">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                        <td className="py-3.5 px-4 font-bold text-[#0E3B43]">
                          <span className="px-2 py-0.5 rounded bg-[#4FA6A6]/15 text-[#0E3B43] text-[10px] font-black uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-[#0E3B43]">{log.business_name || log.business_id || '—'}</td>
                        <td className="py-3.5 px-4 text-[#537379]">{log.admin_user_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
            <div>
              <h3 className="font-black text-lg text-[#0E3B43]">Configurações da Plataforma & SaaS</h3>
              <p className="text-xs text-[#537379]">Gerencie o valor oficial do Plano Vitriniza Pro e dados de contato.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Plano Pago</label>
                <input
                  type="text"
                  value={settingsForm.proName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, proName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Valor Mensal do Plano Pro (R$)</label>
                <input
                  type="number"
                  step="0.10"
                  value={settingsForm.proPrice}
                  onChange={(e) => setSettingsForm({ ...settingsForm, proPrice: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp Oficial da Vitriniza</label>
                <input
                  type="text"
                  value={settingsForm.contactWhatsApp}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactWhatsApp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">E-mail Oficial</label>
                <input
                  type="email"
                  value={settingsForm.contactEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#0E3B43] hover:bg-[#154e58] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL 1: CONVERT LOCAL -> PRO */}
      {isConvertModalOpen && convertingBiz && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#4FA6A6]/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E36845]" />
                <h3 className="font-black text-lg text-[#0E3B43]">Converter para Vitriniza Pro</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs text-[#0E3B43] space-y-1">
              <p><strong>Empresa:</strong> {convertingBiz.name}</p>
              <p><strong>URL Pública Preservada:</strong> /{convertingBiz.state_id?.toLowerCase() || 'sp'}/sao-paulo/{convertingBiz.neighborhood?.slug || 'guaianases'}/{convertingBiz.slug}</p>
              <p className="text-[11px] text-[#4FA6A6] font-bold">✓ Nenhum dado, foto ou histórico de SEO será alterado.</p>
            </div>

            {createdAccess ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-black">✓ Acesso ao painel liberado</p>
                  <p className="mt-1 text-xs">
                    {createdAccess.accountCreated ? 'A conta foi criada' : 'A conta existente foi vinculada'} para <strong>{createdAccess.email}</strong>.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Dados de acesso</label>
                  <textarea
                    readOnly
                    rows={3}
                    value={`E-mail: ${createdAccess.email}\nSenha temporária: ${createdAccess.password}\nAcesso: ${typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'}`}
                    className="w-full resize-none px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-[#F8F6F0] text-[11px] text-[#0E3B43] outline-none"
                  />
                  <p className="mt-1.5 text-[11px] text-amber-700">Envie somente ao proprietário. Oriente-o a guardar a senha em local seguro.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAccessLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0E3B43] px-4 py-3 text-xs font-black text-white"
                  >
                    <Copy className="w-4 h-4" /> Copiar acesso
                  </button>
                  <button
                    type="button"
                    onClick={handleSendAccessByWhatsApp}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white"
                  >
                    <WhatsAppSolidIcon className="w-4 h-4" /> Enviar pelo WhatsApp
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsConvertModalOpen(false);
                    setConvertingBiz(null);
                    setCreatedAccess(null);
                  }}
                  className="w-full rounded-xl bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-600"
                >
                  Concluir
                </button>
              </div>
            ) : (
            <form onSubmit={handleExecuteConvert} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Proprietário / Responsável *</label>
                <input
                  type="text"
                  required
                  value={convertForm.ownerName}
                  onChange={(e) => setConvertForm({ ...convertForm, ownerName: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">E-mail para Login no Painel *</label>
                <input
                  type="email"
                  required
                  value={convertForm.email}
                  onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
                  placeholder="comercio@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp Comercial</label>
                <input
                  type="tel"
                  value={convertForm.whatsapp}
                  onChange={(e) => setConvertForm({ ...convertForm, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Senha temporária *</label>
                  <input
                    type="password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    value={convertForm.password}
                    onChange={(e) => setConvertForm({ ...convertForm, password: e.target.value })}
                    placeholder="Mínimo de 8 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Confirmar senha *</label>
                  <input
                    type="password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    value={convertForm.passwordConfirmation}
                    onChange={(e) => setConvertForm({ ...convertForm, passwordConfirmation: e.target.value })}
                    placeholder="Repita a senha"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={convertForm.price}
                    onChange={(e) => setConvertForm({ ...convertForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Vencimento Inicial</label>
                  <input
                    type="date"
                    value={convertForm.expiresAt}
                    onChange={(e) => setConvertForm({ ...convertForm, expiresAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-xs font-bold text-stone-600 hover:bg-stone-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Converter e Ativar Pro
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: COMMERCIAL PITCH ("OFERECER PRO") */}
      {isPitchModalOpen && pitchBiz && pitchData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#4FA6A6]/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#4FA6A6]" />
                <h3 className="font-black text-lg text-[#0E3B43]">Resumo Comercial para Prospecção</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPitchModalOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E8E4DA]">
                <span className="text-[10px] text-[#537379] font-bold block">Visualizações</span>
                <span className="text-xl font-black text-[#0E3B43]">{pitchData.viewsCount}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block">Cliques WhatsApp</span>
                <span className="text-xl font-black text-emerald-700">{pitchData.whatsappClicks}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-[10px] text-blue-800 font-bold block">Pedidos de Rota</span>
                <span className="text-xl font-black text-blue-700">{pitchData.mapClicks}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">Mensagem Pronta para WhatsApp</label>
              <textarea
                rows={8}
                readOnly
                value={pitchData.pitchText}
                className="w-full p-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none select-all"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pitchData.pitchText);
                  alert('✓ Mensagem de prospecção copiada!');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0E3B43] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Mensagem</span>
              </button>

              <a
                href={buildWhatsAppUrl(pitchBiz.whatsapp, pitchData.pitchText)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <WhatsAppSolidIcon className="w-4 h-4 fill-white" />
                <span>Enviar no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT BUSINESS */}
      {isEditBizModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#4FA6A6]/30 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#0E3B43]">Editar Dados do Estabelecimento</h3>
              <button
                type="button"
                onClick={() => setIsEditBizModalOpen(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBiz} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={editBizForm.name}
                    onChange={(e) => setEditBizForm({ ...editBizForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Tipo de Presença</label>
                  <select
                    value={editBizForm.listing_type}
                    onChange={(e) => setEditBizForm({ ...editBizForm, listing_type: e.target.value as ListingType })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none bg-white"
                  >
                    <option value="local_free">Cadastro Local (Grátis)</option>
                    <option value="paid">Vitriniza Pro (Pago)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp Comercial *</label>
                  <input
                    type="text"
                    required
                    value={editBizForm.whatsapp}
                    onChange={(e) => setEditBizForm({ ...editBizForm, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Endereço</label>
                  <input
                    type="text"
                    value={editBizForm.address}
                    onChange={(e) => setEditBizForm({ ...editBizForm, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
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
                    <span>Ativo no Portal</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-[#0E3B43] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBizForm.is_featured}
                      onChange={(e) => setEditBizForm({ ...editBizForm, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded text-[#E36845]"
                    />
                    <span>★ Destaque</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-[#0E3B43] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBizForm.is_founder}
                      onChange={(e) => setEditBizForm({ ...editBizForm, is_founder: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>🏅 Negócio Fundador</span>
                  </label>
                </div>
              </div>

              {editingBizId &&
                editBizForm.listing_type === 'paid' &&
                !businesses.find((business) => business.id === editingBizId)?.owner_user_id && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                    <p className="font-black">Este negócio ainda não possui conta de acesso.</p>
                    <p className="mt-1">Ao salvar, será aberta a etapa para informar o responsável, o e-mail e gerar o link de criação da senha.</p>
                  </div>
                )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E4DA]">
                <button
                  type="button"
                  onClick={() => setIsEditBizModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0E3B43] text-white text-xs font-bold cursor-pointer"
                >
                  {editingBizId &&
                  editBizForm.listing_type === 'paid' &&
                  !businesses.find((business) => business.id === editingBizId)?.owner_user_id
                    ? 'Salvar e criar acesso'
                    : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
