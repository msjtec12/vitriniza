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
  QrCode,
  Lock,
  KeyRound,
  LogOut,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Upload,
  Award,
  Navigation,
  Share2,
  Copy,
  Store,
  Menu,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Flag,
} from 'lucide-react';
import { InstagramIcon, WhatsAppSolidIcon } from '@/components/ui/Icons';
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
import { formatCurrency, formatPhone, cn, fetchAddressByCep, buildWhatsAppUrl } from '@/lib/utils';
import { StoreQRCode } from '@/components/ui/StoreQRCode';
import { SocialShareCardGenerator } from '@/components/merchant/SocialShareCardGenerator';
import { supabase } from '@/lib/supabase/client';
import { getActiveMembershipBusinessIds, getAuthHeaders } from '@/lib/auth/client';

export default function MerchantPanelPage() {
  // Toast notification state (replaces browser alerts)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Compress and upload images to Supabase Storage; database rows keep URLs only.
  const handleImageFileUpload = async (
    file: File,
    callback: (publicUrl: string) => void,
    folder: 'profile' | 'products' | 'promotions' | 'logos' | 'covers' = 'profile'
  ) => {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showToast('Selecione uma imagem PNG, JPG ou WEBP.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('A imagem é muito grande. Escolha um arquivo de até 8MB.', 'error');
      return;
    }
    if (!supabase || !business) {
      showToast('Não foi possível iniciar o upload.', 'error');
      return;
    }

    try {
      showToast('Processando e enviando imagem...', 'info');

      // 1. Tentar upload via API segura do backend (/api/merchant/upload)
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('businessId', business.id);
        formData.append('folder', folder === 'profile' ? 'logos' : folder);

        const authHeaders = await getAuthHeaders();
        const response = await fetch('/api/merchant/upload', {
          method: 'POST',
          headers: { ...authHeaders },
          body: formData,
        });

        if (response.ok) {
          const resJson = (await response.json()) as { success?: boolean; url?: string; error?: string };
          if (resJson.success && resJson.url) {
            callback(resJson.url);
            showToast('✓ Imagem enviada com sucesso!', 'success');
            return;
          }
        }
      } catch (backendUploadErr) {
        console.warn('[Backend upload attempt failed, trying fallback]', backendUploadErr);
      }

      // 2. Fallback de compressão no cliente
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        reader.readAsDataURL(file);
      });

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const candidate = new Image();
        candidate.onload = () => resolve(candidate);
        candidate.onerror = () => reject(new Error('Imagem inválida.'));
        candidate.src = rawDataUrl;
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        let width = image.width;
        let height = image.height;
        const maxWidth = 1400;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('Falha ao compactar a imagem.'))),
          'image/jpeg',
          0.85
        );
      });

      if (supabase) {
        const path = `${business.id}/${folder}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('business-media')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from('business-media').getPublicUrl(path);
          if (data?.publicUrl) {
            callback(data.publicUrl);
            showToast('✓ Imagem enviada com sucesso!', 'success');
            return;
          }
        }
      }

      // Se nenhum storage funcionou, usa a URL em base64 segura para não perder a foto
      callback(rawDataUrl);
      showToast('✓ Imagem carregada localmente!', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Falha ao enviar imagem.', 'error');
    }
  };

  // SECURITY AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [memberBusinessIds, setMemberBusinessIds] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'profile' | 'products' | 'promotions' | 'qrcode' | 'reviews' | 'plan'
  >('overview');

  const [business, setBusiness] = useState<Business | null>(null);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState(store.getPlatformSettings());
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [cepLoading, setCepLoading] = useState(false);
  const [cepMsg, setCepMsg] = useState<{ text: string; success: boolean } | null>(null);

  const handleLookupMerchantCep = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepMsg({ text: 'Digite os 8 dígitos do CEP.', success: false });
      return;
    }
    setCepLoading(true);
    setCepMsg(null);
    const res = await fetchAddressByCep(cleanCep);
    setCepLoading(false);
    if (res) {
      const loc = store.ensureLocation(res.bairro || 'Centro', res.localidade || 'São Paulo', res.uf || 'SP');
      setProfileForm((prev) => ({
        ...prev,
        address: `${res.logradouro ? res.logradouro + ', ' : ''}${res.bairro} - ${res.localidade}/${res.uf}`,
        postal_code: res.cep,
        neighborhood_id: loc.neighborhood.id,
      }));
      setCepMsg({
        text: `✓ CEP Localizado: ${res.logradouro}, Bairro ${res.bairro} (${res.localidade} - ${res.uf})`,
        success: true,
      });
      showToast('Endereço preenchido automaticamente pelo CEP!', 'success');
    } else {
      setCepMsg({ text: '⚠️ CEP não encontrado no ViaCEP. Preencha manualmente.', success: false });
      showToast('CEP não encontrado. Preencha o endereço manualmente.', 'info');
    }
  };

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
    neighborhood_id: '',
    logo_url: '',
    cover_url: '',
    delivery_available: false,
    takeaway_available: false,
    dine_in_available: false,
    is_online_only: false,
  });

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    promo_price: '',
    category: '',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    is_available: true,
  });

  // Promotion modal
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [promoForm, setPromoForm] = useState({
    title: '',
    description: '',
    original_price: '',
    promo_price: '',
    rules: 'Válido enquanto durarem os estoques.',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  });

  // Validate the Supabase session and memberships on every page load.
  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      if (!supabase) {
        if (active) setIsAuthenticated(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (active) setIsAuthenticated(false);
        return;
      }

      const businessIds = await getActiveMembershipBusinessIds();

      if (!active) return;
      if (!businessIds.length) {
        setMemberBusinessIds([]);
        setIsAuthenticated(false);
        return;
      }

      setMemberBusinessIds(businessIds);
      setIsAuthenticated(true);
    };

    void validateSession();
    return () => {
      active = false;
    };
  }, []);

  const loadActiveBusiness = (bizId?: string) => {
    const list = store.getBusinesses();
    if (memberBusinessIds.length === 0) {
      setIsAuthenticated(false);
      setBusiness(null);
      return;
    }

    const myStores = list.filter((businessItem) => memberBusinessIds.includes(businessItem.id));
    const savedBusinessId =
      typeof window !== 'undefined' ? sessionStorage.getItem('vitriniza_selected_business') : null;

    setAllBusinesses(myStores);

    const requestedId = bizId || savedBusinessId || memberBusinessIds[0];
    const selected = myStores.find((businessItem) => businessItem.id === requestedId) || myStores[0];

    if (selected) {
      setBusiness(selected);
      setProfileForm({
        name: selected.name || '',
        short_description: selected.short_description || '',
        description: selected.description || '',
        whatsapp: selected.whatsapp || '',
        phone: selected.phone || '',
        instagram: selected.instagram || '',
        website: selected.website || '',
        address: selected.address || '',
        number: selected.number || '',
        postal_code: selected.postal_code || '',
        neighborhood_id: selected.neighborhood_id || '',
        logo_url: selected.logo_url || '',
        cover_url: selected.cover_url || '',
        delivery_available: selected.delivery_available || false,
        takeaway_available: selected.takeaway_available || false,
        dine_in_available: selected.dine_in_available || false,
        is_online_only: selected.is_online_only || false,
      });

      setReviews(store.getReviews(selected.id));
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      store.ensureCloudSynced().then(() => loadActiveBusiness());
      const unsub = store.subscribe(() => loadActiveBusiness());
      return () => unsub();
    }
  }, [isAuthenticated, memberBusinessIds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      setAuthError('Informe seu e-mail e senha de acesso.');
      return;
    }

    if (!supabase) {
      setAuthError('O serviço de autenticação está temporariamente indisponível.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });
    if (signInError) {
      setAuthError('E-mail ou senha incorretos.');
      return;
    }

    const businessIds = await getActiveMembershipBusinessIds();

    if (!businessIds.length) {
      await supabase.auth.signOut();
      setAuthError('Sua conta ainda não possui uma Vitrine Pro liberada.');
      return;
    }

    setMemberBusinessIds(businessIds);
    setIsAuthenticated(true);
    showToast('Acesso autorizado com segurança.', 'success');
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('vitriniza_selected_business');
    }
    setMemberBusinessIds([]);
    setIsAuthenticated(false);
    setBusiness(null);
    showToast('Você saiu do painel.', 'info');
  };

  // Top bar "Salvar alterações" action
  const handleSaveAllChanges = async () => {
    if (!business) return;
    setIsSavingChanges(true);

    try {
      const response = await fetch('/api/merchant/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          businessId: business.id,
          updates: {
            name: profileForm.name.trim(),
            short_description: profileForm.short_description.trim(),
            description: profileForm.description.trim(),
            whatsapp: profileForm.whatsapp.trim(),
            phone: profileForm.phone.trim(),
            instagram: profileForm.instagram.trim(),
            website: profileForm.website.trim(),
            address: profileForm.address.trim(),
            number: profileForm.number.trim(),
            postal_code: profileForm.postal_code.trim(),
            neighborhood_id: profileForm.neighborhood_id || business.neighborhood_id,
            logo_url: profileForm.logo_url,
            cover_url: profileForm.cover_url,
            delivery_available: profileForm.delivery_available,
            takeaway_available: profileForm.takeaway_available,
            dine_in_available: profileForm.dine_in_available,
            is_online_only: profileForm.is_online_only,
          },
        }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Não foi possível salvar as alterações.');
      }

      await store.ensureCloudSynced(true);
      loadActiveBusiness();
      showToast('✓ Alterações publicadas! Suas informações já estão disponíveis na vitrine.', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Não foi possível salvar as alterações.', 'error');
    } finally {
      setIsSavingChanges(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveAllChanges();
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      promo_price: '',
      category: '',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      is_available: true,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: p.price ? p.price.toString() : '',
      promo_price: p.promo_price ? p.promo_price.toString() : '',
      category: p.category || '',
      image_url: p.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      is_available: p.is_available !== false,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !productForm.name || !productForm.price) return;

    const parsedPrice = parseFloat(productForm.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      showToast('Por favor, informe um preço válido.', 'error');
      return;
    }

    const promoPrice = productForm.promo_price ? parseFloat(productForm.promo_price) : null;

    if (editingProduct) {
      let saved = false;

      // 1. Try secure API route
      try {
        const res = await fetch('/api/merchant/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
          body: JSON.stringify({
            businessId: business.id,
            productId: editingProduct.id,
            updates: {
              name: productForm.name.trim(),
              description: productForm.description.trim(),
              price: parsedPrice,
              promo_price: promoPrice,
              category: productForm.category.trim() || 'Geral',
              image_url: productForm.image_url,
              is_available: productForm.is_available,
            },
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) saved = true;
      } catch (err) {
        console.warn('API update failed, trying direct Supabase', err);
      }

      // 2. Direct Supabase fallback
      if (!saved && supabase) {
        const { error } = await supabase
          .from('products')
          .update({
            name: productForm.name.trim(),
            description: productForm.description.trim(),
            price: parsedPrice,
            promo_price: promoPrice,
            category: productForm.category.trim() || 'Geral',
            image_url: productForm.image_url,
            is_available: productForm.is_available,
          })
          .eq('id', editingProduct.id)
          .eq('business_id', business.id);

        if (!error) saved = true;
      }

      // 3. Local store update for instant reactivity
      store.updateProduct(editingProduct.id, {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parsedPrice,
        promo_price: promoPrice || undefined,
        category: productForm.category.trim() || 'Geral',
        image_url: productForm.image_url,
        is_available: productForm.is_available,
      });

      await store.ensureCloudSynced(true);
      loadActiveBusiness();
      setIsProductModalOpen(false);
      setEditingProduct(null);
      showToast('Item atualizado com sucesso!', 'success');
    } else {
      const newId = `prod_${crypto.randomUUID()}`;
      let created = false;

      // 1. Try secure API route
      try {
        const res = await fetch('/api/merchant/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
          body: JSON.stringify({
            businessId: business.id,
            product: {
              name: productForm.name.trim(),
              description: productForm.description.trim(),
              price: parsedPrice,
              promo_price: promoPrice,
              category: productForm.category.trim() || 'Geral',
              image_url: productForm.image_url,
              is_available: productForm.is_available,
              order_index: (business.products?.length || 0) + 1,
            },
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) created = true;
      } catch (err) {
        console.warn('API add failed, trying direct Supabase', err);
      }

      // 2. Direct Supabase fallback
      if (!created && supabase) {
        const { error } = await supabase.from('products').insert({
          id: newId,
          business_id: business.id,
          name: productForm.name.trim(),
          description: productForm.description.trim(),
          price: parsedPrice,
          promo_price: promoPrice,
          category: productForm.category.trim() || 'Geral',
          image_url: productForm.image_url,
          is_available: productForm.is_available,
          order_index: (business.products?.length || 0) + 1,
        });
        if (!error) created = true;
      }

      // 3. Local store add for instant reactivity
      store.createProduct({
        id: newId,
        business_id: business.id,
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parsedPrice,
        promo_price: promoPrice || undefined,
        category: productForm.category.trim() || 'Geral',
        image_url: productForm.image_url,
        is_available: productForm.is_available,
        order_index: (business.products?.length || 0) + 1,
      });

      await store.ensureCloudSynced(true);
      loadActiveBusiness();
      setIsProductModalOpen(false);
      showToast('Item adicionado com sucesso ao seu catálogo!', 'success');
    }

    setProductForm({
      name: '',
      description: '',
      price: '',
      promo_price: '',
      category: '',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      is_available: true,
    });
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!business) return;
    if (!window.confirm('Tem certeza que deseja remover este item do catálogo?')) return;

    try {
      await fetch('/api/merchant/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ businessId: business.id, productId: prodId }),
      });
    } catch {
      // Fallback
    }

    if (supabase) {
      await supabase.from('products').delete().eq('id', prodId).eq('business_id', business.id);
    }

    store.deleteProduct(prodId);
    await store.ensureCloudSynced(true);
    loadActiveBusiness();
    showToast('Item removido do catálogo.', 'info');
  };

  const handleToggleProductAvailability = async (p: Product) => {
    if (!business) return;
    const nextState = !p.is_available;

    try {
      await fetch('/api/merchant/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          businessId: business.id,
          productId: p.id,
          updates: { is_available: nextState },
        }),
      });
    } catch {
      // Fallback
    }

    if (supabase) {
      await supabase
        .from('products')
        .update({ is_available: nextState })
        .eq('id', p.id)
        .eq('business_id', business.id);
    }

    store.updateProduct(p.id, { is_available: nextState });
    loadActiveBusiness();
    showToast(nextState ? 'Item marcado como disponível.' : 'Item pausado / indisponível.', 'info');
  };

  const handleOpenAddPromotion = () => {
    setEditingPromotion(null);
    setPromoForm({
      title: '',
      description: '',
      original_price: '',
      promo_price: '',
      rules: 'Válido enquanto durarem os estoques.',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    });
    setIsPromoModalOpen(true);
  };

  const handleOpenEditPromotion = (pr: Promotion) => {
    setEditingPromotion(pr);
    setPromoForm({
      title: pr.title,
      description: pr.description || '',
      original_price: pr.original_price ? pr.original_price.toString() : '',
      promo_price: pr.promo_price ? pr.promo_price.toString() : '',
      rules: pr.rules || 'Válido enquanto durarem os estoques.',
      image_url: pr.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    });
    setIsPromoModalOpen(true);
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !supabase || !promoForm.title || !promoForm.original_price || !promoForm.promo_price) return;

    const originalPrice = parseFloat(promoForm.original_price);
    const promoPrice = parseFloat(promoForm.promo_price);
    if (Number.isNaN(originalPrice) || Number.isNaN(promoPrice)) {
      showToast('Por favor, informe preços válidos.', 'error');
      return;
    }

    if (editingPromotion) {
      const { error } = await supabase
        .from('promotions')
        .update({
          title: promoForm.title.trim(),
          description: promoForm.description.trim() || promoForm.title.trim(),
          original_price: originalPrice,
          promo_price: promoPrice,
          rules: promoForm.rules,
          image_url: promoForm.image_url,
        })
        .eq('id', editingPromotion.id)
        .eq('business_id', business.id);

      if (error) {
        showToast('Não foi possível salvar as alterações da oferta.', 'error');
        return;
      }
      store.updatePromotion(editingPromotion.id, {
        title: promoForm.title.trim(),
        description: promoForm.description.trim() || promoForm.title.trim(),
        original_price: originalPrice,
        promo_price: promoPrice,
        rules: promoForm.rules,
        image_url: promoForm.image_url,
      });
      showToast('Oferta atualizada com sucesso!', 'success');
    } else {
      const newId = `promo_${crypto.randomUUID()}`;
      const { error } = await supabase.from('promotions').insert({
        id: newId,
        business_id: business.id,
        title: promoForm.title.trim(),
        description: promoForm.description.trim() || promoForm.title.trim(),
        original_price: originalPrice,
        promo_price: promoPrice,
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        rules: promoForm.rules,
        image_url: promoForm.image_url,
        is_active: true,
      });

      if (error) {
        showToast('Não foi possível publicar a oferta. Verifique sua assinatura e tente novamente.', 'error');
        return;
      }
      showToast('Oferta publicada com sucesso na Vitriniza!', 'success');
    }

    await store.ensureCloudSynced(true);
    loadActiveBusiness();

    setIsPromoModalOpen(false);
    setEditingPromotion(null);
    setPromoForm({
      title: '',
      description: '',
      original_price: '',
      promo_price: '',
      rules: 'Válido enquanto durarem os estoques.',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    });
  };

  const handleDeletePromotion = async (promoId: string) => {
    if (!business || !supabase) return;
    if (!window.confirm('Deseja realmente encerrar esta oferta?')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', promoId).eq('business_id', business.id);
    if (error) {
      showToast('Não foi possível encerrar a oferta.', 'error');
      return;
    }
    await store.ensureCloudSynced(true);
    showToast('Oferta encerrada.', 'info');
  };

  // Dynamic Catalog nomenclature based on category
  const getDynamicCatalogLabel = (categorySlug?: string, categoryName?: string) => {
    const cat = (categorySlug || categoryName || '').toLowerCase();
    if (
      cat.includes('aliment') ||
      cat.includes('restaurante') ||
      cat.includes('pizz') ||
      cat.includes('lanch') ||
      cat.includes('hamburg') ||
      cat.includes('doce') ||
      cat.includes('festa')
    ) {
      return 'Cardápio';
    }
    if (
      cat.includes('loja') ||
      cat.includes('comercio') ||
      cat.includes('moda') ||
      cat.includes('vest') ||
      cat.includes('artesanato') ||
      cat.includes('presente') ||
      cat.includes('mercado')
    ) {
      return 'Produtos';
    }
    if (
      cat.includes('servico') ||
      cat.includes('reforma') ||
      cat.includes('beleza') ||
      cat.includes('estetica') ||
      cat.includes('barbearia') ||
      cat.includes('salao') ||
      cat.includes('saude') ||
      cat.includes('profissional') ||
      cat.includes('imoveis') ||
      cat.includes('detetive') ||
      cat.includes('tecnologia') ||
      cat.includes('automotivo') ||
      cat.includes('domestico')
    ) {
      return 'Serviços';
    }
    if (cat.includes('pet')) {
      return 'Produtos & Serviços';
    }
    return 'Produtos & Serviços';
  };

  // Profile Completeness Calculation (Requirement #6)
  const calculateCompleteness = (b: Business) => {
    const checks = [
      { id: 'logo', label: 'Logo adicionada', done: Boolean(b.logo_url && !b.logo_url.includes('photo-1513104890138-7c749659a591')), tab: 'profile' },
      { id: 'cover', label: 'Foto de capa', done: Boolean(b.cover_url && b.cover_url.length > 5), tab: 'profile' },
      { id: 'desc', label: 'Descrição preenchida', done: Boolean((b.description && b.description.length > 15) || (b.short_description && b.short_description.length > 10)), tab: 'profile' },
      { id: 'hours', label: 'Horário de funcionamento', done: Boolean(b.hours && b.hours.length > 0), tab: 'profile' },
      { id: 'address', label: 'Localização e Endereço', done: Boolean(b.address && b.address.length > 3), tab: 'profile' },
      { id: 'items', label: 'Pelo menos 3 produtos ou serviços', done: Boolean(b.products && b.products.length >= 3), tab: 'products' },
    ];

    const completed = checks.filter((c) => c.done).length;
    const percentage = Math.round((completed / checks.length) * 100);

    return { checks, completed, percentage };
  };

  // LOGIN SCREEN
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-4 sm:p-6">
        {toast && (
          <div className={cn(
            'fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-3',
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : toast.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-[#0E3B43] text-white border-[#4FA6A6]'
          )}>
            <span>{toast.message}</span>
          </div>
        )}

        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#0E3B43] text-white mx-auto flex items-center justify-center shadow-md">
              <Store className="w-7 h-7 text-[#4FA6A6]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E36845]" />
              <span>Área do Comerciante</span>
            </div>
            <h2 className="font-black text-2xl text-[#0E3B43]">Acesse sua Vitrine</h2>
            <p className="text-xs text-[#537379] leading-relaxed">
              Digite o e-mail da sua conta Vitriniza Pro e sua senha.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">E-mail cadastrado *</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Ex: contato@sualoja.com.br"
                className="w-full px-3.5 py-3 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">Senha de Acesso *</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full px-3.5 py-3 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs sm:text-sm font-black shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Entrar no Painel</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#E8E4DA] space-y-2 text-xs text-[#537379]">
            <p>Quer ter acesso ao painel do comerciante?</p>
            <Link
              href="/para-empresas"
              className="inline-flex items-center gap-1 font-bold text-[#E36845] hover:underline"
            >
              <span>Conheça a Vitriniza Pro</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (!business) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-4 text-xs font-bold text-[#537379]">
        Carregando painel do comerciante...
      </div>
    );
  }

  // GATING: If business is Cadastro Local, block access with upgrade prompt
  const access = store.canAccessMerchantPanel(business.id);
  if (access.isLocalFree) {
    return (
      <div className="min-h-[85vh] bg-[#F8F6F0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#4FA6A6]/20 card-shadow text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0E3B43]/10 text-[#0E3B43] mx-auto flex items-center justify-center">
            <Store className="w-8 h-8 text-[#0E3B43]" />
          </div>
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-bold uppercase tracking-wider">
              Cadastro Local
            </div>
            <h2 className="text-2xl font-black text-[#0E3B43]">{business.name}</h2>
            <p className="text-xs text-[#537379] leading-relaxed">
              Este comércio é um <strong>Cadastro Local Gratuito</strong>. O Cadastro Local garante presença nas buscas e no portal do bairro, mas não possui acesso ao painel de gerenciamento.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs text-[#0E3B43] space-y-2 text-left">
            <span className="font-black block uppercase tracking-wider text-[10px] text-[#4FA6A6]">
              Com a Vitriniza Pro você libera:
            </span>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">✓ Painel exclusivo para gerenciar fotos e dados</li>
              <li className="flex items-center gap-2">✓ Catálogo de produtos e serviços</li>
              <li className="flex items-center gap-2">✓ Publicação contínua de ofertas em destaque 🔥</li>
              <li className="flex items-center gap-2">✓ Display oficial de balcão com QR Code</li>
              <li className="flex items-center gap-2">✓ Métricas em tempo real de acessos</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Link
              href="/para-empresas"
              className="w-full py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Quero Minha Vitrine Pro</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#0E3B43] text-xs font-bold cursor-pointer"
            >
              Trocar de Conta / Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  const catalogLabel = getDynamicCatalogLabel(business.category?.slug, business.category?.name);
  const limits: PlanLimits = store.getPlanLimits(business.plan_id);
  const stats = store.getBusinessStats(business.id);
  const businessPublicUrl = `/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'bairro'}/${business.slug}`;
  const completeness = calculateCompleteness(business);

  // Simulated chart data
  const chartData = [
    { name: 'Seg', visualizacoes: stats.viewsCount > 0 ? Math.round(stats.viewsCount * 0.1) : 0, cliquesWhatsApp: stats.whatsappClicks > 0 ? Math.round(stats.whatsappClicks * 0.1) : 0 },
    { name: 'Ter', visualizacoes: stats.viewsCount > 0 ? Math.round(stats.viewsCount * 0.15) : 0, cliquesWhatsApp: stats.whatsappClicks > 0 ? Math.round(stats.whatsappClicks * 0.15) : 0 },
    { name: 'Qua', visualizacoes: stats.viewsCount > 0 ? Math.round(stats.viewsCount * 0.15) : 0, cliquesWhatsApp: stats.whatsappClicks > 0 ? Math.round(stats.whatsappClicks * 0.15) : 0 },
    { name: 'Qui', visualizacoes: stats.viewsCount > 0 ? Math.round(stats.viewsCount * 0.2) : 0, cliquesWhatsApp: stats.whatsappClicks > 0 ? Math.round(stats.whatsappClicks * 0.2) : 0 },
    { name: 'Sex', visualizacoes: stats.viewsCount > 0 ? Math.round(stats.viewsCount * 0.25) : 0, cliquesWhatsApp: stats.whatsappClicks > 0 ? Math.round(stats.whatsappClicks * 0.25) : 0 },
    { name: 'Sáb', visualizacoes: stats.viewsCount > 0 ? Math.round(stats.viewsCount * 0.3) : 0, cliquesWhatsApp: stats.whatsappClicks > 0 ? Math.round(stats.whatsappClicks * 0.3) : 0 },
    { name: 'Dom', visualizacoes: stats.viewsCount > 0 ? Math.round(stats.viewsCount * 0.2) : 0, cliquesWhatsApp: stats.whatsappClicks > 0 ? Math.round(stats.whatsappClicks * 0.2) : 0 },
  ];

  const friendlyPlanName = access.isExpired ? 'Vitriniza Pro (Vencido)' : 'Vitriniza Pro';

  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'profile', label: 'Minha Vitrine', icon: Store },
    { id: 'products', label: catalogLabel, icon: ShoppingBag, badge: business.products?.length || 0 },
    { id: 'promotions', label: 'Ofertas', icon: Flame, badge: business.promotions?.length || 0 },
    { id: 'qrcode', label: 'QR Code & Divulgação', icon: QrCode },
    { id: 'reviews', label: 'Avaliações', icon: Star, badge: reviews.length },
    { id: 'plan', label: 'Plano e Pagamentos', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F0] pb-24">
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-3',
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : toast.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-[#0E3B43] text-white border-[#4FA6A6]'
        )}>
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-white border-b border-[#E8E4DA] sticky top-16 sm:top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          {/* Left: Store identity and switcher */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E8E4DA] bg-stone-100 shrink-0 flex items-center justify-center">
              {business.logo_url && !business.logo_url.includes('photo-1513104890138-7c749659a591') ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-[#537379]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {allBusinesses.length > 1 ? (
                  <select
                    value={business.id}
                    onChange={(e) => {
                      sessionStorage.setItem('vitriniza_selected_business', e.target.value);
                      loadActiveBusiness(e.target.value);
                    }}
                    className="font-black text-xs sm:text-sm text-[#0E3B43] bg-transparent border-b border-[#E8E4DA] outline-none cursor-pointer pr-2 max-w-[180px] sm:max-w-[240px] truncate"
                  >
                    {allBusinesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.neighborhood?.name})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-black text-xs sm:text-sm text-[#0E3B43] truncate block max-w-[160px] sm:max-w-[240px]">
                    {business.name}
                  </span>
                )}

                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#4FA6A6]/15 text-[#0E3B43] border border-[#4FA6A6]/30 shrink-0">
                  {friendlyPlanName}
                </span>
              </div>
              <span className="text-[11px] text-[#537379] block truncate">
                {[business.neighborhood?.name, business.city?.name || 'SP'].filter(Boolean).join(' - ')}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={businessPublicUrl}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-bold border border-[#E8E4DA] transition-all"
            >
              <span>Ver Vitrine</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#E36845]" />
            </Link>

            {/* Requirement #2: "Salvar alterações" action */}
            <button
              type="button"
              onClick={handleSaveAllChanges}
              disabled={isSavingChanges}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 min-h-[38px]"
              title="Salvar e publicar alterações na vitrine"
            >
              <Save className={cn('w-3.5 h-3.5', isSavingChanges && 'animate-spin')} />
              <span>{isSavingChanges ? 'Salvando...' : 'Salvar alterações'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-500 text-xs font-bold transition-colors cursor-pointer"
              title="Sair do painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EXPIRED BANNER (If subscription is expired, display warning without locking viewing) */}
        {access.isExpired && (
          <div className="bg-amber-500 text-white px-4 py-2.5 text-center text-xs font-black flex flex-wrap items-center justify-center gap-2 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>Seu Plano Vitriniza Pro está vencido. Renove para continuar administrando seus produtos e promoções.</span>
            <a
              href={`https://wa.me/55${settings.contact_whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de renovar a assinatura Vitriniza Pro do meu comércio *${business.name}*.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-[#0E3B43] hover:bg-[#154e58] text-white text-[11px] font-bold shadow-xs transition-all"
            >
              Renovar no WhatsApp
            </a>
          </div>
        )}

        {/* MOBILE HORIZONTAL NAVIGATION PILLS */}
        <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-t border-[#E8E4DA] overflow-x-auto no-scrollbar bg-white">
          {menuItems.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 min-h-[40px]',
                  isSelected
                    ? 'bg-[#0E3B43] text-white shadow-xs'
                    : 'bg-[#F8F6F0] text-[#0E3B43] border border-[#E8E4DA]'
                )}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={cn('px-1.5 py-0.2 rounded-full text-[10px]', isSelected ? 'bg-white/20' : 'bg-[#4FA6A6]/20')}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FOUNDER HIGHLIGHT BANNER (Requirement #7) */}
      {business.is_founder && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-orange-500/10 border-2 border-amber-400/50 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
                <Award className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                  🏅 NEGÓCIO FUNDADOR LOCAL
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#0E3B43]">
                  Você faz parte dos primeiros negócios parceiros da Vitriniza na sua região.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">
              Selo Ativo na Vitrine ✓
            </span>
          </div>
        </div>
      )}

      {/* PROFILE COMPLETENESS WIDGET (Requirement #6) */}
      {completeness.percentage < 100 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#4FA6A6]/20 card-shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-black">
                    {completeness.percentage}% CONCLUÍDO
                  </span>
                  <h4 className="font-black text-sm text-[#0E3B43]">Complete sua Vitrine</h4>
                </div>
                <p className="text-xs text-[#537379] mt-0.5">
                  Vitrines completas com fotos, horários e produtos recebem até 3x mais acessos e contatos no WhatsApp.
                </p>
              </div>

              <div className="w-full sm:w-48 bg-[#F8F6F0] rounded-full h-3 overflow-hidden border border-[#E8E4DA]">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-[#E8E4DA]">
              {completeness.checks.map((check) => (
                <button
                  key={check.id}
                  type="button"
                  onClick={() => setActiveTab(check.tab as any)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/10 border border-[#E8E4DA] text-left transition-all cursor-pointer text-xs"
                >
                  <span className={cn('font-bold', check.done ? 'text-emerald-800 line-through opacity-70' : 'text-[#0E3B43]')}>
                    {check.label}
                  </span>
                  {check.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                  ) : (
                    <span className="text-[10px] font-black text-[#E36845] bg-[#E36845]/15 px-2 py-0.5 rounded-md shrink-0 ml-2">
                      Completar →
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* DESKTOP SIDEBAR MENU (3 cols) */}
          <div className="hidden lg:block lg:col-span-3 space-y-2 sticky top-40">
            {menuItems.map((tab) => {
              const IconComp = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer',
                    isSelected
                      ? 'bg-[#0E3B43] text-white shadow-md'
                      : 'bg-white text-[#0E3B43] hover:bg-[#F8F6F0] border border-[#E8E4DA]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={cn('w-4 h-4', isSelected ? 'text-[#4FA6A6]' : 'text-[#537379]')} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-black',
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#4FA6A6]/15 text-[#0E3B43]'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="p-4 rounded-2xl bg-white border border-[#E8E4DA] space-y-2 mt-4 text-xs">
              <span className="font-black text-[#0E3B43] block">Dúvidas ou Suporte?</span>
              <p className="text-[11px] text-[#537379]">Fale diretamente com nossa equipe no WhatsApp da Vitriniza.</p>
              <a
                href="https://wa.me/5511999999999?text=Olá!+Preciso+de+ajuda+no+painel+da+Vitriniza."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E36845] hover:underline"
              >
                <WhatsAppSolidIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                <span>Suporte no WhatsApp</span>
              </a>
            </div>
          </div>

          {/* TAB CONTENT (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. OVERVIEW TAB (Requirement #5) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-xl text-[#0E3B43]">Visão Geral da Sua Vitrine</h3>
                  <p className="text-xs text-[#537379]">Desempenho e acessos dos clientes da sua região nos últimos 30 dias</p>
                </div>

                {/* 5 Real Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#537379]">
                      <span className="font-bold truncate">Visualizações</span>
                      <Eye className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                    </div>
                    <div className="text-2xl font-black text-[#0E3B43]">{stats.viewsCount}</div>
                    <span className="text-[10px] text-[#537379] block truncate">
                      {stats.viewsCount === 0 ? 'Sem visitas ainda' : 'Acessos à vitrine'}
                    </span>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#537379]">
                      <span className="font-bold truncate">WhatsApp</span>
                      <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                    <div className="text-2xl font-black text-[#0E3B43]">{stats.whatsappClicks}</div>
                    <span className="text-[10px] text-[#537379] block truncate">
                      {stats.whatsappClicks === 0 ? 'Sem contatos ainda' : 'Contatos diretos'}
                    </span>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#537379]">
                      <span className="font-bold truncate">Como chegar</span>
                      <Navigation className="w-4 h-4 text-[#E36845] shrink-0" />
                    </div>
                    <div className="text-2xl font-black text-[#0E3B43]">{stats.mapClicks || 0}</div>
                    <span className="text-[10px] text-[#537379] block truncate">Pedidos de rota</span>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#537379]">
                      <span className="font-bold truncate">Compartilhamentos</span>
                      <Share2 className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                    </div>
                    <div className="text-2xl font-black text-[#0E3B43]">{stats.shareClicks || 0}</div>
                    <span className="text-[10px] text-[#537379] block truncate">Divulgações</span>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-xs text-[#537379]">
                      <span className="font-bold truncate">Ofertas</span>
                      <Flame className="w-4 h-4 text-[#E36845] shrink-0" />
                    </div>
                    <div className="text-2xl font-black text-[#0E3B43]">{stats.offerViews || 0}</div>
                    <span className="text-[10px] text-[#537379] block truncate">Visualizações ofertas</span>
                  </div>
                </div>

                {/* Graph or Empty State */}
                <div className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-4">
                  <h4 className="font-black text-sm text-[#0E3B43]">Desempenho da Sua Vitrine</h4>

                  {stats.viewsCount === 0 && stats.whatsappClicks === 0 ? (
                    <div className="p-8 text-center bg-[#F8F6F0] rounded-2xl border border-dashed border-[#E8E4DA] space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#4FA6A6]/15 flex items-center justify-center mx-auto text-[#0E3B43]">
                        <TrendingUp className="w-6 h-6 text-[#E36845]" />
                      </div>
                      <h4 className="font-black text-sm text-[#0E3B43]">Ainda não temos dados suficientes.</h4>
                      <p className="text-xs text-[#537379] max-w-md mx-auto leading-relaxed">
                        Compartilhe o link da sua vitrine nas suas redes sociais e no WhatsApp para começar a receber acessos e novos clientes!
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('qrcode')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0E3B43] text-white text-xs font-black shadow-xs hover:bg-[#154E58] transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#4FA6A6]" />
                        <span>Divulgar Minha Vitrine Agora</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" />
                          <XAxis dataKey="name" stroke="#537379" fontSize={11} />
                          <YAxis stroke="#537379" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#0E3B43', color: '#fff', borderRadius: '12px', border: 'none' }} />
                          <Area type="monotone" dataKey="visualizacoes" stroke="#4FA6A6" fill="#4FA6A6" fillOpacity={0.2} name="Visualizações" />
                          <Area type="monotone" dataKey="cliquesWhatsApp" stroke="#E36845" fill="#E36845" fillOpacity={0.3} name="Cliques WhatsApp" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Social Share Banner inside Overview */}
                <SocialShareCardGenerator business={business} onToast={showToast} />
              </div>
            )}

            {/* 2. MINHA VITRINE TAB (Requirement #1: Clean image previews, no raw base64) */}
            {activeTab === 'profile' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
                <div>
                  <h3 className="font-black text-xl text-[#0E3B43]">Minha Vitrine & Perfil</h3>
                  <p className="text-xs text-[#537379]">Informações públicas exibidas para os clientes no seu bairro e cidade</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* IDENTIDADE VISUAL: LOGO & FOTO DE CAPA (SEM TEXT INPUTS EXPOSTOS) */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-6">
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#0E3B43] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#E36845]" />
                      <span>Identidade Visual: Logo e Foto de Capa</span>
                    </h4>

                    {/* LOGO DA EMPRESA (Requirement #1) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#0E3B43]">Logo da Empresa</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#E8E4DA] p-1.5 shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
                          {profileForm.logo_url && !profileForm.logo_url.includes('photo-1513104890138-7c749659a591') ? (
                            <img src={profileForm.logo_url} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                          ) : (
                            <Store className="w-8 h-8 text-[#537379]/40" />
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-[#4FA6A6]/40 text-xs font-bold text-[#0E3B43] cursor-pointer shadow-2xs transition-all active:scale-95 min-h-[44px]">
                              <Upload className="w-3.5 h-3.5 text-[#E36845]" />
                              <span>{profileForm.logo_url ? 'Trocar logo' : 'Enviar logo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageFileUpload(file, (dataUrl) => {
                                      setProfileForm((prev) => ({ ...prev, logo_url: dataUrl }));
                                      showToast('Logo atualizada!', 'success');
                                    }, 'profile');
                                  }
                                }}
                              />
                            </label>

                            {profileForm.logo_url && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileForm((prev) => ({ ...prev, logo_url: '' }));
                                  showToast('Logo removida.', 'info');
                                }}
                                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-red-50 text-stone-500 hover:text-red-500 border border-[#E8E4DA] text-xs font-bold transition-all cursor-pointer min-h-[44px]"
                              >
                                Remover logo
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-[#537379]">Formatos aceitos: PNG, JPG ou WEBP até 15MB.</p>
                        </div>
                      </div>
                    </div>

                    {/* FOTO DE CAPA (Requirement #1) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#0E3B43]">Foto de Capa (Banner Principal)</label>

                      <div className="relative h-36 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#E8E4DA] bg-stone-900">
                        {profileForm.cover_url ? (
                          <img src={profileForm.cover_url} alt="Capa" className="w-full h-full object-cover opacity-90" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50 text-xs font-bold">
                            Nenhuma foto de capa adicionada
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#4FA6A6]/40 text-xs font-bold text-[#0E3B43] hover:bg-stone-50 cursor-pointer shadow-2xs transition-all active:scale-95 min-h-[44px]">
                            <Upload className="w-3.5 h-3.5 text-[#E36845]" />
                            <span>{profileForm.cover_url ? 'Trocar foto' : 'Enviar foto'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageFileUpload(file, (dataUrl) => {
                                    setProfileForm((prev) => ({ ...prev, cover_url: dataUrl }));
                                    showToast('Foto de capa atualizada!', 'success');
                                  }, 'profile');
                                }
                              }}
                            />
                          </label>

                          {profileForm.cover_url && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileForm((prev) => ({ ...prev, cover_url: '' }));
                                showToast('Foto de capa removida.', 'info');
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-red-50 text-stone-500 hover:text-red-500 border border-[#E8E4DA] text-xs font-bold transition-all cursor-pointer min-h-[44px]"
                            >
                              Remover foto
                            </button>
                          )}
                        </div>

                        {/* Suggestions */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-[#537379] font-medium">Sugestões de fotos:</span>
                          <button
                            type="button"
                            onClick={() => setProfileForm((prev) => ({ ...prev, cover_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&auto=format&fit=crop&q=80' }))}
                            className="px-2 py-1 rounded-md bg-white border border-[#E8E4DA] text-[#0E3B43] font-bold hover:border-[#E36845] cursor-pointer"
                          >
                            Gastronomia
                          </button>
                          <button
                            type="button"
                            onClick={() => setProfileForm((prev) => ({ ...prev, cover_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&auto=format&fit=crop&q=80' }))}
                            className="px-2 py-1 rounded-md bg-white border border-[#E8E4DA] text-[#0E3B43] font-bold hover:border-[#E36845] cursor-pointer"
                          >
                            Beleza
                          </button>
                          <button
                            type="button"
                            onClick={() => setProfileForm((prev) => ({ ...prev, cover_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format&fit=crop&q=80' }))}
                            className="px-2 py-1 rounded-md bg-white border border-[#E8E4DA] text-[#0E3B43] font-bold hover:border-[#E36845] cursor-pointer"
                          >
                            Serviços
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INFORMAÇÕES BÁSICAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Estabelecimento *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp para Atendimento *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.whatsapp}
                        onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">Telefone Fixo (Opcional)</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none min-h-[44px]"
                      />
                    </div>

                    {/* ENDEREÇO & CEP */}
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-3">
                      <label className="block text-xs font-bold text-[#0E3B43]">Endereço & Localização (ViaCEP)</label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={profileForm.postal_code}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProfileForm({ ...profileForm, postal_code: val });
                            if (val.replace(/\D/g, '').length === 8) {
                              handleLookupMerchantCep(val);
                            }
                          }}
                          placeholder="08410-000"
                          className="w-full pl-3.5 pr-28 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white font-medium focus:border-[#E36845] min-h-[44px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleLookupMerchantCep(profileForm.postal_code)}
                          disabled={cepLoading}
                          className="absolute right-1 px-3.5 py-2 rounded-lg bg-[#0E3B43] hover:bg-[#154E58] text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 min-h-[36px]"
                        >
                          {cepLoading ? '...' : '🔍 Buscar CEP'}
                        </button>
                      </div>

                      {cepMsg && (
                        <div
                          className={cn(
                            'p-2.5 rounded-xl text-xs font-bold flex items-center gap-2',
                            cepMsg.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          )}
                        >
                          <span>{cepMsg.text}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-[#0E3B43] mb-1">Endereço Completo</label>
                        <input
                          type="text"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          placeholder="Ex: Rua das Flores, 500 - Centro"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-white min-h-[44px]"
                        />
                      </div>
                    </div>

                    {/* MODALIDADES DE ATENDIMENTO */}
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-3">
                      <label className="block text-xs font-black text-[#0E3B43] uppercase tracking-wider">
                        Modalidades de Atendimento
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] cursor-pointer hover:border-[#4FA6A6] transition-colors min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={profileForm.dine_in_available}
                            onChange={(e) => setProfileForm({ ...profileForm, dine_in_available: e.target.checked })}
                            className="w-4 h-4 rounded text-[#4FA6A6]"
                          />
                          <span>🏢 Atendimento Presencial no Local</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] cursor-pointer hover:border-[#4FA6A6] transition-colors min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={profileForm.is_online_only}
                            onChange={(e) => setProfileForm({ ...profileForm, is_online_only: e.target.checked })}
                            className="w-4 h-4 rounded text-[#4FA6A6]"
                          />
                          <span>🌐 Atendimento 100% Online & Remoto</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] cursor-pointer hover:border-[#4FA6A6] transition-colors min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={profileForm.delivery_available}
                            onChange={(e) => setProfileForm({ ...profileForm, delivery_available: e.target.checked })}
                            className="w-4 h-4 rounded text-[#E36845]"
                          />
                          <span>🚀 Faz Delivery / Envio em Domicílio</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] cursor-pointer hover:border-[#4FA6A6] transition-colors min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={profileForm.takeaway_available}
                            onChange={(e) => setProfileForm({ ...profileForm, takeaway_available: e.target.checked })}
                            className="w-4 h-4 rounded text-[#4FA6A6]"
                          />
                          <span>📦 Aceita Retirada no Balcão</span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                        Frase Curta de Apresentação (Exibido no cartão do comércio)
                      </label>
                      <input
                        type="text"
                        value={profileForm.short_description}
                        onChange={(e) => setProfileForm({ ...profileForm, short_description: e.target.value })}
                        placeholder="Ex: A melhor pizza no forno a lenha do bairro com entrega rápida."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] mb-3 min-h-[44px]"
                      />

                      <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                        Descrição Completa & História
                      </label>
                      <textarea
                        rows={4}
                        value={profileForm.description}
                        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                        placeholder="Conte mais sobre seu negócio, anos no bairro, diferenciais e serviços..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] resize-y"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingChanges}
                    className="px-6 py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 min-h-[44px]"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingChanges ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* 3. PRODUTOS & SERVIÇOS TAB (Requirement #4: Dynamic Category adaptation) */}
            {activeTab === 'products' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-black text-xl text-[#0E3B43]">{catalogLabel}</h3>
                    <p className="text-xs text-[#537379]">Adicione e edite itens, fotos e preços exibidos na sua vitrine</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className="px-4 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 text-[#4FA6A6]" />
                    <span>Adicionar {catalogLabel === 'Cardápio' ? 'Item ao Cardápio' : catalogLabel === 'Serviços' ? 'Serviço' : 'Produto'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business.products && business.products.length > 0 ? (
                    business.products.map((p) => (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl bg-[#F8F6F0] border transition-all flex items-center gap-3 ${
                          p.is_available === false ? 'opacity-60 border-stone-300' : 'border-[#E8E4DA]'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-[#E8E4DA] relative">
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          {p.is_available === false && (
                            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-wider">
                              Pausado
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-xs text-[#0E3B43] truncate">{p.name}</h4>
                            {p.is_available === false && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                                Pausado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-black text-sm text-[#E36845]">{formatCurrency(p.price)}</span>
                            {p.promo_price && (
                              <span className="text-[11px] text-stone-400 line-through">
                                {formatCurrency(p.promo_price)}
                              </span>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-[11px] text-[#537379] line-clamp-1 truncate mt-0.5">
                              {p.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleProductAvailability(p)}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[38px] ${
                              p.is_available === false
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-white text-stone-400 border-[#E8E4DA] hover:text-[#0E3B43]'
                            }`}
                            title={p.is_available === false ? 'Reativar item no catálogo' : 'Pausar temporariamente'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-2 rounded-xl bg-white border border-[#E8E4DA] text-[#0E3B43] hover:bg-[#0E3B43] hover:text-white transition-all cursor-pointer min-h-[38px]"
                            title="Editar item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 rounded-xl bg-white border border-[#E8E4DA] text-stone-400 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer min-h-[38px]"
                            title="Excluir item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sm:col-span-2 p-8 text-center bg-[#F8F6F0] rounded-2xl border border-dashed border-[#E8E4DA] space-y-2">
                      <ShoppingBag className="w-10 h-10 mx-auto text-[#537379]/40" />
                      <h4 className="font-black text-xs text-[#0E3B43]">Nenhum item cadastrado ainda</h4>
                      <p className="text-xs text-[#537379]">
                        Clique no botão acima para adicionar seu primeiro item ao catálogo.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. OFERTAS TAB (Requirement #3) */}
            {activeTab === 'promotions' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-black text-xl text-[#0E3B43]">Ofertas & Promoções</h3>
                    <p className="text-xs text-[#537379]">Publique promoções com desconto para atrair clientes no bairro</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddPromotion}
                    className="px-4 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[44px]"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Criar Oferta 🔥</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {business.promotions && business.promotions.length > 0 ? (
                    business.promotions.map((pr) => (
                      <div key={pr.id} className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0">
                            <img src={pr.image_url} alt={pr.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-xs text-[#0E3B43] truncate">{pr.title}</h4>
                            <div className="flex items-center gap-2 text-xs mt-0.5">
                              <span className="line-through text-stone-400">{formatCurrency(pr.original_price)}</span>
                              <span className="font-black text-[#E36845]">{formatCurrency(pr.promo_price)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPromotion(pr)}
                            className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] hover:bg-stone-50 cursor-pointer min-h-[38px] flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePromotion(pr.id)}
                            className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-red-500 hover:bg-red-50 cursor-pointer min-h-[38px]"
                          >
                            Encerrar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-[#F8F6F0] rounded-2xl border border-dashed border-[#E8E4DA] space-y-2">
                      <Flame className="w-10 h-10 mx-auto text-[#E36845]/40" />
                      <h4 className="font-black text-xs text-[#0E3B43]">Nenhuma oferta ativa no momento</h4>
                      <p className="text-xs text-[#537379]">
                        Crie uma oferta promocional para aparecer no carrossel de ofertas da sua região!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. QR CODE & DIVULGAÇÃO TAB (Requirement #8 & #9) */}
            {activeTab === 'qrcode' && (
              <div className="space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
                  <div>
                    <h3 className="font-black text-xl text-[#0E3B43]">Divulgue sua Vitrine</h3>
                    <p className="text-xs text-[#537379]">
                      Use seu QR Code e materiais de divulgação para ajudar clientes a acessar sua página na Vitriniza.
                    </p>
                  </div>

                  <StoreQRCode
                    businessName={business.name}
                    businessSlug={business.slug}
                    businessLogoUrl={business.logo_url}
                    businessUrl={businessPublicUrl}
                    neighborhoodName={business.neighborhood?.name || ''}
                    categoryName={business.category?.name}
                    variant="full_hub"
                    onToast={showToast}
                  />
                </div>

                <SocialShareCardGenerator business={business} onToast={showToast} />
              </div>
            )}

            {/* 6. AVALIAÇÕES TAB (Requirement #11) */}
            {activeTab === 'reviews' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-black text-xl text-[#0E3B43]">Avaliações de Clientes</h3>
                    <p className="text-xs text-[#537379]">Opiniões reais deixadas pelos moradores do bairro</p>
                  </div>

                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{stats.rating.toFixed(1)} ({reviews.length} avaliações)</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {reviews.length > 0 ? (
                    reviews.map((r) => (
                      <div key={r.id} className="p-4 sm:p-5 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-[#0E3B43]">{r.author_name}</span>
                            <div className="flex items-center text-amber-500 text-xs">
                              {'★'.repeat(r.rating)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => showToast('Denúncia registrada para moderação.', 'info')}
                            className="text-[10px] text-stone-400 hover:text-red-500 flex items-center gap-1 font-bold cursor-pointer"
                            title="Denunciar avaliação abusiva"
                          >
                            <Flag className="w-3 h-3" />
                            <span>Denunciar</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#537379] leading-relaxed">“{r.comment}”</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-[#F8F6F0] rounded-2xl border border-dashed border-[#E8E4DA] space-y-2">
                      <Star className="w-10 h-10 mx-auto text-amber-400/40" />
                      <h4 className="font-black text-xs text-[#0E3B43]">Você ainda não recebeu avaliações.</h4>
                      <p className="text-xs text-[#537379] max-w-sm mx-auto">
                        Compartilhe sua vitrine com seus clientes para começar a receber opiniões e notas de 5 estrelas!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. PLANO E PAGAMENTOS TAB (Vitriniza Pro SaaS) */}
            {activeTab === 'plan' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-black text-xl text-[#0E3B43]">Plano e Pagamentos</h3>
                    <p className="text-xs text-[#537379]">Informações da sua assinatura oficial na Vitriniza</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-[#E36845] text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{friendlyPlanName}</span>
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0E3B43] text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs text-[#4FA6A6] font-bold block uppercase tracking-wider">Assinatura Oficial</span>
                      <h4 className="text-2xl font-black text-white">Vitriniza Pro</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">{formatCurrency(settings.pro_plan?.price || 49.90)}</span>
                      <span className="text-xs text-white/70 block">/mês</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-[#F8F6F0]/90 gap-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Painel de lojista 100% liberado</span>
                    </span>
                    <a
                      href={`https://wa.me/55${settings.contact_whatsapp}?text=${encodeURIComponent(`Olá! Sou do comércio *${business.name}* e gostaria de falar sobre a assinatura Vitriniza Pro.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold transition-all"
                    >
                      <WhatsAppSolidIcon className="w-3.5 h-3.5 fill-white" />
                      <span>Suporte / Faturas</span>
                    </a>
                  </div>
                </div>

                {/* Included Features */}
                <div className="space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-wider text-[#0E3B43]">
                    Recursos Inclusos no Seu Plano Pro
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#0E3B43]">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA]">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Painel do Lojista:</strong> edição completa da vitrine</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA]">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Catálogo Ilimitado:</strong> produtos e serviços</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA]">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Ofertas e Promoções 🔥:</strong> com destaque no bairro</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA]">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Display de Balcão:</strong> arte pronta em PNG de alta resolução</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA]">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Gerador de Artes:</strong> Instagram Stories e WhatsApp Status</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA]">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Métricas em Tempo Real:</strong> cliques no WhatsApp e rotas</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCT MODAL (Requirement #1: Clean image upload, no raw base64) */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-[#4FA6A6]/20 shadow-2xl animate-fade-in cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#0E3B43]">
                {editingProduct ? 'Editar ' : 'Adicionar '}
                {catalogLabel === 'Cardápio' ? 'Item do Cardápio' : catalogLabel === 'Serviços' ? 'Serviço' : 'Produto'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 cursor-pointer min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Item *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Pizza Calabresa Especial"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] min-h-[44px]"
                />
              </div>

              {/* Product Image Clean Upload */}
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Foto do Item</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#E8E4DA] bg-stone-100 shrink-0">
                    <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-stone-100 border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] cursor-pointer shadow-2xs min-h-[44px]">
                    <Upload className="w-3.5 h-3.5 text-[#E36845]" />
                    <span>Escolher Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageFileUpload(file, (dataUrl) => {
                            setProductForm((prev) => ({ ...prev, image_url: dataUrl }));
                          }, 'products');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Normal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="49.90"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Preço Promo (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.promo_price}
                    onChange={(e) => setProductForm({ ...productForm, promo_price: e.target.value })}
                    placeholder="39.90"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Categoria ou Seção (Opcional)</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="Ex: Pizzas Salgadas, Bebidas, Cortes de Cabelo..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Descrição / Ingredientes</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Ingredientes ou detalhes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none resize-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={productForm.is_available}
                    onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                    className="rounded text-[#E36845] focus:ring-[#E36845] h-4 w-4"
                  />
                  <span className="text-xs font-bold text-[#0E3B43]">
                    Item disponível para os clientes (ativo na vitrine)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E4DA] text-xs font-bold text-[#537379] hover:bg-stone-50 cursor-pointer min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md transition-all cursor-pointer min-h-[44px]"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Adicionar ao Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTION MODAL (Requirement #1: Clean image upload, no raw base64) */}
      {isPromoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => {
            setIsPromoModalOpen(false);
            setEditingPromotion(null);
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-[#4FA6A6]/20 shadow-2xl animate-fade-in cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#0E3B43] flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#E36845]" />
                <span>{editingPromotion ? 'Editar Oferta Especial' : 'Criar Oferta Especial 🔥'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsPromoModalOpen(false);
                  setEditingPromotion(null);
                }}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 cursor-pointer min-h-[36px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Título da Oferta *</label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  placeholder="Ex: Pizza em Dobro Terça e Quarta!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] min-h-[44px]"
                />
              </div>

              {/* Promo Image Clean Upload */}
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Foto da Oferta</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#E8E4DA] bg-stone-100 shrink-0">
                    <img src={promoForm.image_url} alt="Preview Oferta" className="w-full h-full object-cover" />
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-stone-100 border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] cursor-pointer shadow-2xs min-h-[44px]">
                    <Upload className="w-3.5 h-3.5 text-[#E36845]" />
                    <span>Escolher Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageFileUpload(file, (dataUrl) => {
                            setPromoForm((prev) => ({ ...prev, image_url: dataUrl }));
                          }, 'promotions');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">De (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={promoForm.original_price}
                    onChange={(e) => setPromoForm({ ...promoForm, original_price: e.target.value })}
                    placeholder="85.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Por apenas (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={promoForm.promo_price}
                    onChange={(e) => setPromoForm({ ...promoForm, promo_price: e.target.value })}
                    placeholder="49.90"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Regras & Condições</label>
                <textarea
                  rows={2}
                  value={promoForm.rules}
                  onChange={(e) => setPromoForm({ ...promoForm, rules: e.target.value })}
                  placeholder="Ex: Válido para pedidos efetuados pelo WhatsApp."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPromoModalOpen(false);
                    setEditingPromotion(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E4DA] text-xs font-bold text-[#537379] hover:bg-stone-50 cursor-pointer min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md transition-all cursor-pointer min-h-[44px]"
                >
                  {editingPromotion ? 'Salvar Alterações' : 'Publicar Oferta 🔥'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
