'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building,
  ShoppingBag,
  Flame,
  Image as ImageIcon,
  Star,
  CreditCard,
  Settings,
  TrendingUp,
  MessageCircle,
  Phone,
  MapPin,
  Eye,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Save,
  Clock,
} from 'lucide-react';
import { InstagramIcon } from '@/components/ui/Icons';
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
import { Business, Product, Promotion, BusinessImage, Review, PlanLimits } from '@/types';
import { formatCurrency, formatPhone, cn } from '@/lib/utils';

export default function MerchantPanelPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'profile' | 'products' | 'promotions' | 'gallery' | 'reviews' | 'plan'
  >('overview');

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for profile
  const [profileForm, setProfileForm] = useState({
    name: '',
    short_description: '',
    description: '',
    whatsapp: '',
    phone: '',
    instagram: '',
    website: '',
    address: '',
    number: '',
    postal_code: '',
    delivery_available: false,
    takeaway_available: false,
    dine_in_available: false,
  });

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    promo_price: '',
    category: '',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  });

  // Promotion modal
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({
    title: '',
    description: '',
    original_price: '',
    promo_price: '',
    rules: 'Válido de terça a quinta enquanto durarem os estoques.',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  });

  // Load first business
  useEffect(() => {
    const all = store.getBusinesses();
    if (all.length > 0) {
      const b = all[0];
      setBusiness(b);
      setReviews(store.getReviews(b.id));
      setProfileForm({
        name: b.name,
        short_description: b.short_description || '',
        description: b.description,
        whatsapp: b.whatsapp,
        phone: b.phone,
        instagram: b.instagram || '',
        website: b.website || '',
        address: b.address,
        number: b.number,
        postal_code: b.postal_code,
        delivery_available: b.delivery_available,
        takeaway_available: b.takeaway_available,
        dine_in_available: b.dine_in_available,
      });
    }
  }, []);

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-xs text-[#537379]">
        Carregando painel do comerciante...
      </div>
    );
  }

  const limits: PlanLimits = store.getPlanLimits(business.plan_id);
  const stats = store.getBusinessStats(business.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateBusiness(business.id, profileForm);
    setBusiness(store.getBusinessById(business.id) || business);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    if (limits.max_products !== -1 && (business.products?.length || 0) >= limits.max_products) {
      alert(`Seu plano atual (${business.plan_id}) permite até ${limits.max_products} produtos. Faça upgrade para cadastrar mais!`);
      return;
    }

    store.addProduct(business.id, {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      promo_price: productForm.promo_price ? parseFloat(productForm.promo_price) : undefined,
      category: productForm.category,
      image_url: productForm.image_url,
      is_available: true,
    });

    setBusiness(store.getBusinessById(business.id) || business);
    setIsProductModalOpen(false);
    setProductForm({
      name: '',
      description: '',
      price: '',
      promo_price: '',
      category: '',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    });
  };

  const handleDeleteProduct = (prodId: string) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      store.deleteProduct(prodId);
      setBusiness(store.getBusinessById(business.id) || business);
    }
  };

  const handleAddPromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.title || !promoForm.original_price || !promoForm.promo_price) return;

    if (!limits.can_post_promotions) {
      alert(`O recurso de publicação de Ofertas está disponível a partir do Plano Pro!`);
      return;
    }

    store.addPromotion(business.id, {
      title: promoForm.title,
      description: promoForm.description,
      original_price: parseFloat(promoForm.original_price),
      promo_price: parseFloat(promoForm.promo_price),
      image_url: promoForm.image_url,
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      rules: promoForm.rules,
    });

    setBusiness(store.getBusinessById(business.id) || business);
    setIsPromoModalOpen(false);
    setPromoForm({
      title: '',
      description: '',
      original_price: '',
      promo_price: '',
      rules: 'Válido de terça a quinta enquanto durarem os estoques.',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    });
  };

  const handleDeletePromotion = (promoId: string) => {
    if (confirm('Tem certeza que deseja encerrar esta promoção?')) {
      store.deletePromotion(promoId);
      setBusiness(store.getBusinessById(business.id) || business);
    }
  };

  const businessPublicUrl = `/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'guaianases'}/${business.slug}`;

  // Chart data simulation
  const chartData = [
    { name: 'Seg', visualizacoes: 45, cliquesWhatsApp: 18 },
    { name: 'Ter', visualizacoes: 62, cliquesWhatsApp: 26 },
    { name: 'Qua', visualizacoes: 78, cliquesWhatsApp: 34 },
    { name: 'Qui', visualizacoes: 95, cliquesWhatsApp: 42 },
    { name: 'Sex', visualizacoes: 140, cliquesWhatsApp: 68 },
    { name: 'Sáb', visualizacoes: 190, cliquesWhatsApp: 92 },
    { name: 'Dom', visualizacoes: 165, cliquesWhatsApp: 75 },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F0] pb-20">
      {/* Top Merchant Subheader */}
      <div className="bg-white border-b border-[#E8E4DA] sticky top-16 sm:top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E8E4DA] bg-stone-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-[#0E3B43]">{business.name}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#4FA6A6]/15 text-[#0E3B43] border border-[#4FA6A6]/30">
                  Plano {business.plan_id}
                </span>
              </div>
              <span className="text-[11px] text-[#537379]">{business.neighborhood?.name} - SP</span>
            </div>
          </div>

          <Link
            href={businessPublicUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-bold border border-[#E8E4DA] transition-all"
          >
            <span>Ver Vitrine Pública</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#E36845]" />
          </Link>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar (3 cols) */}
          <aside className="lg:col-span-3 space-y-2">
            <div className="bg-white p-3 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-1">
              {[
                { id: 'overview', label: 'Visão Geral & Métricas', icon: LayoutDashboard },
                { id: 'profile', label: 'Minha Empresa & Perfil', icon: Building },
                { id: 'products', label: 'Produtos & Cardápio', icon: ShoppingBag, count: business.products?.length },
                { id: 'promotions', label: 'Ofertas & Promoções', icon: Flame, count: business.promotions?.length },
                { id: 'gallery', label: 'Fotos & Galeria', icon: ImageIcon },
                { id: 'reviews', label: 'Avaliações', icon: Star, count: reviews.length },
                { id: 'plan', label: 'Meu Plano & Limites', icon: CreditCard },
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all',
                      isSelected
                        ? 'bg-[#E36845] text-white shadow-xs'
                        : 'text-[#0E3B43] hover:bg-[#F8F6F0]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-[#4FA6A6]')} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-black',
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#4FA6A6]/15 text-[#0E3B43]'
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Tab Content Body (9 cols) */}
          <main className="lg:col-span-9 space-y-6">
            {/* TAB 1: OVERVIEW & ANALYTICS */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#537379] uppercase">Visualizações</span>
                      <Eye className="w-4 h-4 text-[#4FA6A6]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0E3B43]">{stats.views}</div>
                    <span className="text-[10px] font-bold text-[#4FA6A6] mt-1 block">Na vitrine digital</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#537379] uppercase">Cliques WhatsApp</span>
                      <MessageCircle className="w-4 h-4 text-[#E36845]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#E36845]">{stats.whatsappClicks}</div>
                    <span className="text-[10px] font-bold text-[#4FA6A6] mt-1 block">Conversões diretas</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#537379] uppercase">Cliques Telefone</span>
                      <Phone className="w-4 h-4 text-[#0E3B43]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0E3B43]">{stats.phoneClicks}</div>
                    <span className="text-[10px] font-bold text-[#537379] mt-1 block">Ligações diretas</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#537379] uppercase">Rotas no Mapa</span>
                      <MapPin className="w-4 h-4 text-[#4FA6A6]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0E3B43]">{stats.mapClicks}</div>
                    <span className="text-[10px] font-bold text-[#4FA6A6] mt-1 block">Indo até o local</span>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="p-6 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-base text-[#0E3B43]">Desempenho da Vitrine</h3>
                      <p className="text-xs text-[#537379]">Visualizações vs. Cliques gerados no WhatsApp</p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA]">
                      {(['7d', '30d', '90d'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setTimeRange(r)}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                            timeRange === r ? 'bg-white text-[#E36845] shadow-xs' : 'text-[#537379]'
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-64 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4FA6A6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#4FA6A6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorWpp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E36845" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#E36845" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4DA" />
                        <XAxis dataKey="name" stroke="#537379" fontSize={11} tickLine={false} />
                        <YAxis stroke="#537379" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0E3B43',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#F8F6F0',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="visualizacoes"
                          stroke="#4FA6A6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          name="Visualizações"
                        />
                        <Area
                          type="monotone"
                          dataKey="cliquesWhatsApp"
                          stroke="#E36845"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorWpp)"
                          name="Cliques WhatsApp"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE EDITOR */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DA]">
                  <div>
                    <h3 className="font-black text-lg text-[#0E3B43]">Informações do Negócio</h3>
                    <p className="text-xs text-[#537379]">Atualize os dados exibidos publicamente na sua vitrine</p>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-[#4FA6A6]/15 text-[#0E3B43] rounded-xl text-xs font-bold flex items-center gap-2 border border-[#4FA6A6]/30">
                    <Check className="w-4 h-4 text-[#4FA6A6]" />
                    <span>Alterações salvas com sucesso!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome Fantasia do Estabelecimento</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp Comercial (com DDD)</label>
                    <input
                      type="text"
                      required
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Telefone Fixo / Celular</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Instagram (@usuario)</label>
                    <input
                      type="text"
                      value={profileForm.instagram}
                      onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Site Oficial (Opcional)</label>
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Descrição Curta</label>
                    <input
                      type="text"
                      value={profileForm.short_description}
                      onChange={(e) => setProfileForm({ ...profileForm, short_description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#0E3B43] mb-1">Descrição Completa</label>
                    <textarea
                      rows={4}
                      value={profileForm.description}
                      onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Service Modalities */}
                <div className="pt-4 border-t border-[#E8E4DA] space-y-3">
                  <h4 className="text-xs font-bold text-[#537379] uppercase tracking-wider">Modalidades de Atendimento</h4>
                  <div className="flex items-center gap-6 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0E3B43]">
                      <input
                        type="checkbox"
                        checked={profileForm.delivery_available}
                        onChange={(e) => setProfileForm({ ...profileForm, delivery_available: e.target.checked })}
                        className="w-4 h-4 rounded text-[#E36845]"
                      />
                      <span>Faz Delivery</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0E3B43]">
                      <input
                        type="checkbox"
                        checked={profileForm.takeaway_available}
                        onChange={(e) => setProfileForm({ ...profileForm, takeaway_available: e.target.checked })}
                        className="w-4 h-4 rounded text-[#E36845]"
                      />
                      <span>Retirada no Balcão</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0E3B43]">
                      <input
                        type="checkbox"
                        checked={profileForm.dine_in_available}
                        onChange={(e) => setProfileForm({ ...profileForm, dine_in_available: e.target.checked })}
                        className="w-4 h-4 rounded text-[#E36845]"
                      />
                      <span>Atendimento Presencial</span>
                    </label>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg text-[#0E3B43]">Produtos & Cardápio</h3>
                    <p className="text-xs text-[#537379]">
                      {business.products?.length || 0} de {limits.max_products === -1 ? 'Ilimitados' : limits.max_products} produtos cadastrados
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Produto</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {business.products?.map((p) => (
                    <div key={p.id} className="relative bg-white rounded-2xl border border-[#4FA6A6]/20 p-3 card-shadow flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-xs text-[#0E3B43] line-clamp-1">{p.name}</h4>
                          <span className="text-xs font-black text-[#E36845]">{formatCurrency(p.price)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E8E4DA]">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PROMOTIONS */}
            {activeTab === 'promotions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg text-[#0E3B43]">Ofertas & Promoções</h3>
                    <p className="text-xs text-[#537379]">Divulgue descontos especiais para atrair mais clientes</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Nova Oferta</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business.promotions?.map((promo) => (
                    <div key={promo.id} className="bg-white rounded-2xl border border-[#4FA6A6]/20 p-4 card-shadow flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E36845] text-white">
                              {Math.round(((promo.original_price - promo.promo_price) / promo.original_price) * 100)}% OFF
                            </span>
                          </div>
                          <h4 className="font-black text-xs text-[#0E3B43] line-clamp-1">{promo.title}</h4>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-[11px] text-[#537379] line-through">{formatCurrency(promo.original_price)}</span>
                            <span className="text-sm font-black text-[#E36845]">{formatCurrency(promo.promo_price)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end pt-2 border-t border-[#E8E4DA]">
                          <button
                            type="button"
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="text-xs text-red-500 hover:underline font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Encerrar Oferta</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: GALLERY */}
            {activeTab === 'gallery' && (
              <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg text-[#0E3B43]">Fotos do Estabelecimento</h3>
                  <span className="text-xs text-[#537379]">Até {limits.max_photos === -1 ? 'Ilimitadas' : limits.max_photos} fotos no seu plano</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={business.cover_url} alt="Capa" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">Foto de Capa</span>
                  </div>
                  {business.gallery?.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image_url} alt="Galeria" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow">
                  <h3 className="font-black text-lg text-[#0E3B43] mb-1">Avaliações dos Moradores</h3>
                  <p className="text-xs text-[#537379]">Acompanhe o que os clientes dizem sobre o seu atendimento</p>
                </div>
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-2xl bg-white border border-[#4FA6A6]/20 card-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#0E3B43]">{r.author_name}</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-current' : 'text-stone-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#0E3B43]/80">&ldquo;{r.comment}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: PLAN */}
            {activeTab === 'plan' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DA]">
                  <div>
                    <h3 className="font-black text-lg text-[#0E3B43]">Meu Plano</h3>
                    <p className="text-xs text-[#537379]">Você está utilizando o <strong>Plano {business.plan_id.toUpperCase()}</strong></p>
                  </div>
                  <Link
                    href="/para-empresas"
                    className="px-5 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Fazer Upgrade
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
                    <span className="text-xs text-[#537379]">Produtos no Catálogo</span>
                    <div className="text-xl font-black text-[#0E3B43] mt-1">
                      {business.products?.length || 0} / {limits.max_products === -1 ? '∞' : limits.max_products}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
                    <span className="text-xs text-[#537379]">Ofertas Ativas</span>
                    <div className="text-xl font-black text-[#0E3B43] mt-1">
                      {limits.can_post_promotions ? 'Permitido (Ilimitado)' : 'Bloqueado'}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
                    <span className="text-xs text-[#537379]">Selo de Destaque</span>
                    <div className="text-xl font-black text-[#0E3B43] mt-1">
                      {limits.has_featured_badge ? 'Ativo 🌟' : 'Inativo'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E3B43]/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-2xl">
            <h3 className="font-black text-lg text-[#0E3B43] mb-4">Adicionar Novo Produto</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Produto / Serviço *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Pizza Calabresa Especial"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Normal (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="45.00"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Ingredientes ou detalhes do serviço..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-[#537379] text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E36845] text-white text-xs font-bold"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Promotion Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E3B43]/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-2xl">
            <h3 className="font-black text-lg text-[#0E3B43] mb-4">Criar Oferta Especial</h3>
            <form onSubmit={handleAddPromotion} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Título da Oferta *</label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  placeholder="Ex: Combo Família + Refri Grátis"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Normal De: *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={promoForm.original_price}
                    onChange={(e) => setPromoForm({ ...promoForm, original_price: e.target.value })}
                    placeholder="80.00"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Por: *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={promoForm.promo_price}
                    onChange={(e) => setPromoForm({ ...promoForm, promo_price: e.target.value })}
                    placeholder="59.90"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Regras ou Condições</label>
                <input
                  type="text"
                  value={promoForm.rules}
                  onChange={(e) => setPromoForm({ ...promoForm, rules: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-[#537379] text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E36845] text-white text-xs font-bold"
                >
                  Publicar Oferta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
