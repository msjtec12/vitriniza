'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Lock,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { store } from '@/lib/data/store';
import { Business } from '@/types';
import { formatPhone } from '@/lib/utils';
import { WhatsAppSolidIcon } from '@/components/ui/Icons';

function ReivindicarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessesList, setBusinessesList] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    whatsapp: '',
    password: '',
    notes: 'Sou o proprietário e estou ativando minha vitrine através do link de convite oficial.',
  });

  useEffect(() => {
    const allBusinesses = store.getBusinesses();
    setBusinessesList(allBusinesses);

    // Try finding business from token
    if (token) {
      // Pattern: claim_[biz_id]_[timestamp]
      const parts = token.split('_');
      let foundBiz: Business | undefined;

      if (parts.length >= 2) {
        // e.g. claim_biz-16_123 or claim_biz_16_123
        const potentialId = parts.slice(1, parts.length - 1).join('_');
        foundBiz = allBusinesses.find(
          (b) =>
            b.id === potentialId ||
            b.id === `biz-${potentialId}` ||
            token.includes(b.id) ||
            b.id.replace(/-/g, '_') === potentialId
        );
      }

      if (!foundBiz) {
        // Find most recent business created or first without owner
        foundBiz = allBusinesses[0];
      }

      if (foundBiz) {
        setBusiness(foundBiz);
        setSelectedBizId(foundBiz.id);
        setForm((prev) => ({
          ...prev,
          whatsapp: foundBiz?.whatsapp || prev.whatsapp,
        }));
      }
    } else if (allBusinesses.length > 0) {
      setBusiness(allBusinesses[0]);
      setSelectedBizId(allBusinesses[0].id);
    }
  }, [token]);

  const handleSelectBusiness = (bizId: string) => {
    setSelectedBizId(bizId);
    const found = businessesList.find((b) => b.id === bizId) || null;
    setBusiness(found);
    if (found) {
      setForm((prev) => ({
        ...prev,
        whatsapp: found.whatsapp || prev.whatsapp,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ownerName || !form.whatsapp || !form.password) return;

    setIsLoading(true);

    setTimeout(() => {
      // Register claim and approve
      if (business) {
        store.submitClaimRequest({
          business_id: business.id,
          requester_name: form.ownerName,
          requester_email: form.email || `${business.slug}@vitriniza.com.br`,
          requester_phone: form.whatsapp,
          proof_notes: form.notes,
        });

        // Activate ownership & mark verified
        store.updateBusiness(business.id, {
          is_verified: true,
          is_active: true,
          plan_status: 'active',
        });
      }

      setIsLoading(false);
      setIsSuccess(true);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#E36845', '#4FA6A6', '#0E3B43', '#F49C6B'],
        });
      } catch {
        // ignore if canvas blocked
      }
    }, 800);
  };

  return (
    <div className="min-h-[80vh] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#F8F6F0]">
      <div className="max-w-2xl mx-auto">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4FA6A6]/15 border border-[#4FA6A6]/30 shadow-2xs mb-4">
            <ShieldCheck className="w-4 h-4 text-[#E36845]" />
            <span className="text-xs font-black text-[#0E3B43] uppercase tracking-wider">
              Ativação & Reivindicação Oficial
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#0E3B43] tracking-tight">
            Assuma o controle da sua <span className="text-[#E36845]">Vitrine Digital</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#537379] mt-2 max-w-md mx-auto leading-relaxed">
            Finalize a ativação do seu perfil comercial para gerenciar produtos, fotos, ofertas e receber clientes no seu WhatsApp.
          </p>
        </div>

        {isSuccess ? (
          /* SUCCESS STATE */
          <div className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-[#4FA6A6] card-shadow text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#4FA6A6]/20 text-[#4FA6A6] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#0E3B43]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-[#E36845]/15 text-[#E36845] font-black text-xs uppercase tracking-wider">
                🎉 Ativação Concluída com Sucesso!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43] mt-3 mb-2">
                Parabéns, {form.ownerName}!
              </h2>
              <p className="text-xs sm:text-sm text-[#537379] max-w-md mx-auto leading-relaxed">
                Você agora é o administrador oficial da vitrine de <strong>{business?.name}</strong>.
              </p>
            </div>

            {/* Store Preview Card */}
            {business && (
              <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] text-left flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-[#E8E4DA] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm text-[#0E3B43] truncate">{business.name}</h4>
                  <p className="text-xs text-[#537379]">{business.neighborhood?.name}, {business.city?.name}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#4FA6A6]/20 text-[#0E3B43] font-bold text-[10px] uppercase">
                  Verificado ✓
                </span>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/painel"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-black shadow-lg transition-all active:scale-95"
              >
                <span>Acessar Painel do Comerciante</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {business && (
                <Link
                  href={`/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'guaianases'}/${business.slug}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-stone-50 border border-[#E8E4DA] text-[#0E3B43] text-sm font-bold shadow-xs transition-all"
                >
                  <Store className="w-4 h-4 text-[#4FA6A6]" />
                  <span>Ver Minha Vitrine ao Vivo</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-6">
            {/* Target Business Box */}
            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA]">
              <label className="block text-xs font-bold text-[#0E3B43] mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#E36845]" />
                <span>Estabelecimento a ser ativado:</span>
              </label>

              {businessesList.length > 0 && !token ? (
                <select
                  value={selectedBizId}
                  onChange={(e) => handleSelectBusiness(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] bg-white text-xs font-bold text-[#0E3B43] outline-none"
                >
                  {businessesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.neighborhood?.name} ({b.category?.name})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E8E4DA]">
                  {business?.logo_url && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-sm text-[#0E3B43] truncate">{business?.name || 'Comércio Local'}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#537379]">
                      <span className="text-[#4FA6A6] font-bold">{business?.category?.name}</span>
                      <span>•</span>
                      <span>{business?.neighborhood?.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Claim Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#4FA6A6]" />
                  <span>Nome do Proprietário / Responsável *</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1 flex items-center gap-1">
                    <WhatsAppSolidIcon className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp para Atendimento *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="11999998888"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#4FA6A6]" />
                    <span>E-mail Comercial</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contato@seunegocio.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#4FA6A6]" />
                  <span>Crie uma Senha para o Painel do Comerciante *</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Validando e ativando vitrine...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirmar e Assumir Controle da Vitrine</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-[#537379] text-center">
                Ao ativar, você concorda com os nossos <Link href="/termos" className="underline text-[#0E3B43]">Termos de Uso</Link> e <Link href="/privacidade" className="underline text-[#0E3B43]">Privacidade</Link>.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReivindicarPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-[#537379]">Carregando página de ativação...</div>}>
      <ReivindicarContent />
    </Suspense>
  );
}
