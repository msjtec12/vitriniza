'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ArrowRight,
  MessageCircle,
  TrendingUp,
  Store,
  QrCode,
  Users,
  Flame,
  ShieldCheck,
  X,
  Send,
  HelpCircle,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { formatCurrency, buildWhatsAppUrl } from '@/lib/utils';
import { WhatsAppSolidIcon } from '@/components/ui/Icons';

export default function ParaEmpresasPage() {
  const settings = store.getPlatformSettings();
  const proPrice = settings.pro_plan?.price || settings.plan_prices.pro || 49.90;

  const [form, setForm] = useState({
    interest_type: 'pro' as 'local_free' | 'pro',
    businessName: '',
    ownerName: '',
    whatsapp: '',
    email: '',
    instagram: '',
    neighborhood: 'Guaianases',
    category: 'Alimentação & Gastronomia',
    address: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.ownerName || !form.whatsapp) {
      alert('Por favor, preencha o nome do estabelecimento, responsável e WhatsApp.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save request in store / database
      await store.addBusinessRequest({
        owner_name: form.ownerName,
        business_name: form.businessName,
        whatsapp: form.whatsapp,
        email: form.email || undefined,
        instagram: form.instagram || undefined,
        category_name: form.category,
        neighborhood_name: form.neighborhood,
        address: form.address || undefined,
        interest_type: form.interest_type,
        message: form.message || undefined,
      });

      // 2. Also try API route for multi-device sync
      try {
        await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner_name: form.ownerName,
            business_name: form.businessName,
            whatsapp: form.whatsapp,
            email: form.email,
            instagram: form.instagram,
            category_name: form.category,
            neighborhood_name: form.neighborhood,
            address: form.address,
            interest_type: form.interest_type,
            message: form.message,
          }),
        });
      } catch (e) {
        // Local store handled
      }

      setSubmitted(true);
    } catch (err: any) {
      alert('Erro ao enviar solicitação: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDirectWhatsApp = () => {
    const masterPhone = settings.contact_whatsapp || '11987654321';
    const typeLabel = form.interest_type === 'pro' ? 'Vitriniza Pro' : 'Cadastro Local Gratuito';
    const message =
      `Olá Equipe Vitriniza! Acabei de enviar uma solicitação para cadastrar meu negócio:\n\n` +
      `🏢 Estabelecimento: *${form.businessName || 'Meu Comércio'}*\n` +
      `👤 Responsável: *${form.ownerName || 'Responsável'}*\n` +
      `📱 WhatsApp: *${form.whatsapp || 'WhatsApp'}*\n` +
      `📍 Bairro: *${form.neighborhood}*\n` +
      `🏷️ Categoria: *${form.category}*\n` +
      `⭐ Interesse: *${typeLabel}*`;

    const url = buildWhatsAppUrl(masterPhone, message);
    window.open(url, '_blank');
  };

  const benefits = [
    {
      icon: MessageCircle,
      title: 'Vendas Diretas no WhatsApp',
      desc: 'Sem taxas abusivas ou comissões por venda. O morador clica e fala direto no seu celular para pedir, tirar dúvidas ou agendar.',
    },
    {
      icon: Store,
      title: 'Vitrine Digital Completa',
      desc: 'Sua página oficial com logo, fotos, horários de funcionamento, cardápio/catálogo e endereço com rota no Google Maps.',
    },
    {
      icon: Sparkles,
      title: 'Divulgação de Ofertas no Bairro',
      desc: 'Publique promoções exclusivas para atrair moradores vizinhos nos dias de menor movimento.',
    },
    {
      icon: TrendingUp,
      title: 'Métricas Reais de Desempenho',
      desc: 'Acompanhe quantas pessoas viram sua vitrine, clicaram no seu WhatsApp e solicitaram rota até seu endereço.',
    },
    {
      icon: QrCode,
      title: 'QR Code de Balcão & Display',
      desc: 'Baixe a arte pronta da placa de mesa/balcão para imprimir ou solicite o display físico em acrílico para o seu estabelecimento.',
    },
    {
      icon: Users,
      title: 'Fortalecimento do Comércio Local',
      desc: 'Faça parte da rede oficial que conecta quem mora a quem empreende e produz dentro de Guaianases.',
    },
  ];

  return (
    <div className="pb-20 space-y-16 sm:space-y-24 bg-[#F8F6F0]">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:py-20 bg-gradient-to-b from-[#F8F6F0] via-white to-[#F8F6F0] border-b border-[#E8E4DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4FA6A6]/15 border border-[#4FA6A6]/30 shadow-2xs mb-6">
            <Sparkles className="w-4 h-4 text-[#E36845]" />
            <span className="text-xs font-black text-[#0E3B43]">
              Para Comerciantes, Autônomos e Prestadores de Serviço em Guaianases
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0E3B43] tracking-tight max-w-3xl mx-auto leading-tight mb-6">
            Seu negócio merece ser encontrado <span className="text-[#E36845]">pelos moradores do bairro.</span>
          </h1>

          <p className="text-sm sm:text-lg text-[#537379] max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Conecte sua empresa aos moradores que procuram produtos, serviços, alimentação e profissionais em Guaianases. Escolha a presença ideal para o seu estabelecimento:
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#opcoes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-base font-black shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span>Quero minha Vitrine</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href={`https://wa.me/55${settings.contact_whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre a Vitriniza para o meu comércio.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-stone-50 border border-[#4FA6A6]/40 text-[#0E3B43] text-base font-bold shadow-xs transition-all cursor-pointer"
            >
              <WhatsAppSolidIcon className="w-5 h-5 text-emerald-600" />
              <span>Falar com a equipe no WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Plan Comparison Section (2 Options Only) */}
      <section id="opcoes" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Modelos de Presença Comercial</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0E3B43] tracking-tight mb-3">
            Escolha como sua empresa vai participar
          </h2>
          <p className="text-xs sm:text-sm text-[#537379]">
            Opções transparentes e sem burocracia para comércios de todos os portes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* OPTION 1: CADASTRO LOCAL */}
          <div className="p-7 sm:p-9 rounded-3xl bg-white border-2 border-[#E8E4DA] card-shadow flex flex-col justify-between hover:border-[#4FA6A6]/40 transition-all">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-stone-100 text-xs font-bold text-[#537379] uppercase tracking-wider mb-4">
                Presença Básica
              </div>
              <h3 className="font-black text-2xl sm:text-3xl text-[#0E3B43] mb-2">Cadastro Local</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-[#0E3B43]">Gratuito</span>
              </div>
              <p className="text-xs sm:text-sm text-[#537379] mb-6 leading-relaxed font-medium">
                Apareça na Vitriniza e seja encontrado por moradores da região através das buscas e do portal do bairro.
              </p>

              <div className="space-y-4 mb-8">
                <div className="text-xs font-black text-[#0E3B43] uppercase tracking-wider">O que está incluso:</div>
                <ul className="space-y-3 text-xs sm:text-sm text-[#0E3B43]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Presença garantida no portal de Guaianases</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Botão direto para seu WhatsApp de atendimento</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Endereço completo e rota no Google Maps</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Horário de funcionamento e informações principais</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Aparece nas buscas por categoria e bairro</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-stone-100">
                  <ul className="space-y-2 text-xs text-[#537379]">
                    <li className="flex items-center gap-2">
                      <span className="text-stone-400 font-bold">—</span>
                      <span>Sem painel de gerenciamento próprio</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-stone-400 font-bold">—</span>
                      <span>Sem publicação de ofertas e promoções</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-stone-400 font-bold">—</span>
                      <span>Sem métricas e relatórios de cliques</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <a
              href="#formulario"
              onClick={() => setForm((prev) => ({ ...prev, interest_type: 'local_free' }))}
              className="w-full py-4 rounded-2xl bg-[#F8F6F0] hover:bg-stone-200 border border-[#E8E4DA] text-[#0E3B43] text-sm font-black text-center block transition-all cursor-pointer"
            >
              Solicitar Cadastro Local
            </a>
          </div>

          {/* OPTION 2: VITRINIZA PRO */}
          <div className="relative p-7 sm:p-9 rounded-3xl bg-[#0E3B43] text-[#F8F6F0] card-shadow flex flex-col justify-between shadow-2xl border-2 border-[#E36845]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#E36845] text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Vitrine Completa & Painel Próprio</span>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-[#4FA6A6]/20 text-xs font-bold text-[#4FA6A6] uppercase tracking-wider mb-4 mt-1">
                Plano Oficial
              </div>
              <h3 className="font-black text-2xl sm:text-3xl text-white mb-2">Vitriniza Pro</h3>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-4xl sm:text-5xl font-black text-white">{formatCurrency(proPrice)}</span>
                <span className="text-xs text-[#F8F6F0]/70 font-medium">/mês</span>
              </div>
              <p className="text-xs sm:text-sm text-[#F8F6F0]/85 mb-6 leading-relaxed font-medium">
                Tenha sua vitrine completa, administre tudo pelo seu painel exclusivo e receba ferramentas para vender mais no bairro.
              </p>

              <div className="space-y-4 mb-8">
                <div className="text-xs font-black text-[#4FA6A6] uppercase tracking-wider">Tudo do Cadastro Local, mais:</div>
                <ul className="space-y-3 text-xs sm:text-sm text-white">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#4FA6A6] shrink-0 mt-0.5" />
                    <span><strong>Painel do Comerciante exclusivo</strong> para gerenciar tudo pelo celular</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#4FA6A6] shrink-0 mt-0.5" />
                    <span><strong>Catálogo de produtos & serviços</strong> ilimitado com fotos e preços</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#4FA6A6] shrink-0 mt-0.5" />
                    <span><strong>Publicação contínua de OFERTAS 🔥</strong> com destaque na página inicial</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#4FA6A6] shrink-0 mt-0.5" />
                    <span><strong>QR Code com Logo</strong> e arte pronta do display de balcão/mesa</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#4FA6A6] shrink-0 mt-0.5" />
                    <span><strong>Gerador de artes</strong> prontas para Instagram Stories e WhatsApp Status</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#4FA6A6] shrink-0 mt-0.5" />
                    <span><strong>Métricas em tempo real:</strong> acessos, cliques no WhatsApp e rotas</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#4FA6A6] shrink-0 mt-0.5" />
                    <span><strong>Avaliações e depoimentos</strong> verificados de moradores</span>
                  </li>
                </ul>
              </div>
            </div>

            <a
              href="#formulario"
              onClick={() => setForm((prev) => ({ ...prev, interest_type: 'pro' }))}
              className="w-full py-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-black text-center block transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Quero minha Vitrine Pro
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight mb-3">
            Vantagens de estar na Vitriniza
          </h2>
          <p className="text-xs sm:text-sm text-[#537379]">
            A vitrine digital feita sob medida para a dinâmica de comércio de bairro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#4FA6A6]/15 flex items-center justify-center text-[#0E3B43]">
                  <Icon className="w-6 h-6 text-[#E36845]" />
                </div>
                <h3 className="font-black text-lg text-[#0E3B43]">{b.title}</h3>
                <p className="text-xs sm:text-sm text-[#537379] leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Unified Interest Form */}
      <section id="formulario" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#4FA6A6]/20 card-shadow space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E36845]/15 text-[#E36845] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Solicitação de Participação</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43]">
              Cadastre sua Empresa na Vitriniza
            </h2>
            <p className="text-xs sm:text-sm text-[#537379] max-w-xl mx-auto">
              Preencha os dados abaixo. Nossa equipe entrará em contato para confirmar as informações e ativar sua presença no portal.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 rounded-3xl bg-[#F8F6F0] border-2 border-[#4FA6A6]/40 text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#0E3B43]">Recebemos sua solicitação!</h3>
                <p className="text-sm text-[#537379] max-w-md mx-auto">
                  Entraremos em contato pelo WhatsApp <strong>{form.whatsapp}</strong> para confirmar as informações e publicar sua vitrine.
                </p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenDirectWhatsApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-black shadow-md transition-all cursor-pointer"
                >
                  <WhatsAppSolidIcon className="w-4 h-4" />
                  <span>Falar com o Admin no WhatsApp Agora</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] hover:bg-stone-50 cursor-pointer"
                >
                  Enviar outra solicitação
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selector Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#0E3B43] uppercase tracking-wider">
                  Tipo de Presença Desejado *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, interest_type: 'local_free' })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      form.interest_type === 'local_free'
                        ? 'border-[#0E3B43] bg-[#0E3B43]/5 text-[#0E3B43]'
                        : 'border-[#E8E4DA] bg-white text-[#537379] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm">Cadastro Local</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">Grátis</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">Presença básica no portal, busca e WhatsApp.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, interest_type: 'pro' })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                      form.interest_type === 'pro'
                        ? 'border-[#E36845] bg-[#E36845]/5 text-[#0E3B43]'
                        : 'border-[#E8E4DA] bg-white text-[#537379] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm text-[#0E3B43] flex items-center gap-1">
                        <span>Vitriniza Pro</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#E36845]" />
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E36845] text-white">
                        {formatCurrency(proPrice)}/mês
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">Vitrine completa com painel, catálogo, ofertas e display balcão.</p>
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Estabelecimento *</label>
                  <input
                    type="text"
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Ex: Pizzaria Don Giovanni"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Responsável / Proprietário *</label>
                  <input
                    type="text"
                    required
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp Comercial (com DDD) *</label>
                  <input
                    type="tel"
                    required
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="Ex: 11987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">E-mail de Contato</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Ex: contato@sualoja.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Categoria / Ramo de Atuação *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  >
                    <option value="Alimentação & Gastronomia">Alimentação & Gastronomia</option>
                    <option value="Comércio & Lojas">Comércio & Lojas</option>
                    <option value="Beleza & Estética">Beleza & Estética</option>
                    <option value="Saúde & Bem-Estar">Saúde & Bem-Estar</option>
                    <option value="Serviços Residenciais">Serviços Residenciais / Reformas</option>
                    <option value="Automotivo">Automotivo</option>
                    <option value="Pet Shop & Veterinária">Pet Shop & Veterinária</option>
                    <option value="Outros Serviços">Outros Serviços</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Ex: Guaianases"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Endereço / Ponto de Referência</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Ex: Rua Salvador Gianetti, 450 - próximo à estação"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Instagram (@usuario)</label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    placeholder="Ex: @suapizzaria"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Mensagem ou Observações (Opcional)</label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Conte um pouco sobre o seu comércio ou produtos que deseja divulgar..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-black shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enviando solicitação...' : 'Enviar solicitação de cadastro'}</span>
                </button>
                <p className="text-[11px] text-[#537379] text-center mt-3">
                  Ao enviar, seus dados serão encaminhados à equipe da Vitriniza para análise e ativação manual.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-[#0E3B43]">Dúvidas Frequentes</h2>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E8E4DA] space-y-1.5">
            <h4 className="font-bold text-sm text-[#0E3B43]">Qual a diferença entre o Cadastro Local e a Vitriniza Pro?</h4>
            <p className="text-xs text-[#537379] leading-relaxed">
              O <strong>Cadastro Local</strong> é gratuito e serve para seu comércio aparecer nas buscas e no portal com endereço, horários e WhatsApp. O <strong>Vitriniza Pro</strong> libera o painel para você mesmo cadastrar fotos, produtos, publicar ofertas, receber o display de balcão com QR Code e acompanhar métricas de acessos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8E4DA] space-y-1.5">
            <h4 className="font-bold text-sm text-[#0E3B43]">Posso começar com o Cadastro Local e virar Pro depois?</h4>
            <p className="text-xs text-[#537379] leading-relaxed">
              Sim! Quando você decidir assinar a Vitriniza Pro, sua vitrine existente é promovida mantendo o mesmo link, fotos e histórico sem nenhuma interrupção.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8E4DA] space-y-1.5">
            <h4 className="font-bold text-sm text-[#0E3B43]">Como funciona a cobrança da Vitriniza Pro?</h4>
            <p className="text-xs text-[#537379] leading-relaxed">
              O plano Pro custa {formatCurrency(proPrice)} por mês. O pagamento é feito diretamente via Pix ou transferência, sem fidelidade ou contratos complicados.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
