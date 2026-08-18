'use client';

import React from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ArrowRight,
  MessageCircle,
  TrendingUp,
  Store,
  ShieldCheck,
  Star,
  QrCode,
  Users,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { formatCurrency } from '@/lib/utils';

export default function ParaEmpresasPage() {
  const settings = store.getPlatformSettings();

  const benefits = [
    {
      icon: MessageCircle,
      title: 'Vendas Diretas no WhatsApp',
      desc: 'Sem intermediários ou taxas abusivas. Cada cliente clica e fala direto no seu celular para pedir ou agendar.',
    },
    {
      icon: Store,
      title: 'Página Profissional Completa',
      desc: 'Sua vitrine com logo, fotos em alta resolução, horários de funcionamento, cardápio e endereço no mapa.',
    },
    {
      icon: Sparkles,
      title: 'Divulgação de Ofertas',
      desc: 'Crie promoções com desconto para atrair moradores do bairro nos dias de menor movimento.',
    },
    {
      icon: TrendingUp,
      title: 'Painel de Métricas e Cliques',
      desc: 'Acompanhe exatamente quantas pessoas viram sua vitrine, clicaram no seu WhatsApp e se interessaram por seus produtos.',
    },
    {
      icon: QrCode,
      title: 'QR Code Exclusivo de Balcão',
      desc: 'Gere e baixe seu QR Code para imprimir e colocar no balcão da sua loja ou mesa do seu salão.',
    },
    {
      icon: Users,
      title: 'Fortalecimento da Comunidade',
      desc: 'Faça parte do movimento que valoriza quem produz, empreende e gera renda no seu bairro.',
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
              Para Comerciantes, Autônomos e Prestadores de Serviço
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0E3B43] tracking-tight max-w-3xl mx-auto leading-tight mb-6">
            Faça seu negócio ser encontrado por quem está <span className="text-[#E36845]">perto de você.</span>
          </h1>

          <p className="text-sm sm:text-lg text-[#537379] max-w-2xl mx-auto mb-8 leading-relaxed">
            Crie sua vitrine digital na <strong>Vitriniza</strong> e alcance centenas de moradores do seu bairro que procuram seus produtos e serviços todos os dias.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/painel"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-base font-black shadow-lg transition-all active:scale-95"
            >
              <span>Cadastrar meu negócio agora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={`https://wa.me/55${settings.contact_whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre a Vitriniza para o meu comércio.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-stone-50 border border-[#4FA6A6]/40 text-[#0E3B43] text-base font-bold shadow-xs transition-all"
            >
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <span>Tirar dúvidas pelo WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight mb-3">
            Por que ter sua vitrine na Vitriniza?
          </h2>
          <p className="text-xs sm:text-sm text-[#537379]">
            Ferramentas modernas e simples pensadas especialmente para a realidade do pequeno empreendedor de bairro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => {
            const IconComp = b.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow card-shadow-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43] flex items-center justify-center mb-4">
                    <IconComp className="w-6 h-6 text-[#E36845]" />
                  </div>
                  <h3 className="font-black text-lg text-[#0E3B43] mb-2">{b.title}</h3>
                  <p className="text-xs sm:text-sm text-[#537379] leading-relaxed">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Plans Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#E36845] uppercase tracking-wider">
            Planos Acessíveis
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight mt-1 mb-3">
            Escolha o plano ideal para seu momento
          </h2>
          <p className="text-xs sm:text-sm text-[#537379]">
            Sem contrato de fidelidade. Você no controle total do seu comércio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Plan 1: Gratuito */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E4DA] card-shadow flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-[#537379] uppercase">Básico</span>
              <h3 className="font-black text-xl text-[#0E3B43] mt-1 mb-2">Gratuito</h3>
              <div className="text-3xl font-black text-[#0E3B43] mb-4">R$ 0</div>
              <p className="text-xs text-[#537379] mb-6">Página essencial para começar a ser encontrado no bairro.</p>

              <ul className="space-y-2.5 text-xs text-[#0E3B43] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Página exclusiva do negócio
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Botão WhatsApp direto
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Endereço e mapa
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Até 3 fotos no perfil
                </li>
              </ul>
            </div>

            <Link
              href="/painel"
              className="w-full py-3 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-bold text-center block transition-all"
            >
              Começar Grátis
            </Link>
          </div>

          {/* Plan 2: Destaque */}
          <div className="p-6 rounded-3xl bg-white border border-[#4FA6A6]/30 card-shadow flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-[#E36845] uppercase">Mais buscado</span>
              <h3 className="font-black text-xl text-[#0E3B43] mt-1 mb-2">Destaque</h3>
              <div className="text-3xl font-black text-[#E36845] mb-4">
                {formatCurrency(settings.plan_prices.destaque)}
                <span className="text-xs font-normal text-[#537379]">/mês</span>
              </div>
              <p className="text-xs text-[#537379] mb-6">Catálogo de produtos e prioridade na sua categoria.</p>

              <ul className="space-y-2.5 text-xs text-[#0E3B43] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Tudo do plano Gratuito
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Selo oficial "Destaque"
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Até 20 produtos no catálogo
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Até 10 fotos na galeria
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Métricas de cliques
                </li>
              </ul>
            </div>

            <Link
              href="/painel"
              className="w-full py-3 rounded-xl bg-[#F8F6F0] hover:bg-[#E36845] hover:text-white border border-[#4FA6A6]/30 text-[#0E3B43] text-xs font-bold text-center block transition-all"
            >
              Escolher Destaque
            </Link>
          </div>

          {/* Plan 3: Pro */}
          <div className="relative p-6 rounded-3xl bg-[#0E3B43] text-[#F8F6F0] card-shadow flex flex-col justify-between shadow-2xl border border-[#1a5560]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#E36845] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              Recomendado
            </div>

            <div>
              <span className="font-bold text-xs text-[#4FA6A6] uppercase">Completo</span>
              <h3 className="font-black text-xl text-[#F8F6F0] mt-1 mb-2">Pro</h3>
              <div className="text-3xl font-black text-[#F8F6F0] mb-4">
                {formatCurrency(settings.plan_prices.pro)}
                <span className="text-xs font-normal text-[#F8F6F0]/70">/mês</span>
              </div>
              <p className="text-xs text-[#F8F6F0]/80 mb-6">Produtos ilimitados, ofertas e analytics completo.</p>

              <ul className="space-y-2.5 text-xs text-[#F8F6F0]/90 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Produtos ILIMITADOS
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Publicação de OFERTAS 🔥
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> QR Code balcão para download
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Até 25 fotos em alta resolução
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Analytics completo (7/30/90d)
                </li>
              </ul>
            </div>

            <Link
              href="/painel"
              className="w-full py-3 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black text-center block transition-all shadow-md"
            >
              Escolher Pro
            </Link>
          </div>

          {/* Plan 4: Premium */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E4DA] card-shadow flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-[#4FA6A6] uppercase">Máxima Exposição</span>
              <h3 className="font-black text-xl text-[#0E3B43] mt-1 mb-2">Premium</h3>
              <div className="text-3xl font-black text-[#0E3B43] mb-4">
                {formatCurrency(settings.plan_prices.premium)}
                <span className="text-xs font-normal text-[#537379]">/mês</span>
              </div>
              <p className="text-xs text-[#537379] mb-6">Destaque fixo na Homepage da cidade.</p>

              <ul className="space-y-2.5 text-xs text-[#0E3B43] mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Tudo do plano Pro
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Destaque fixo na Homepage
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Prioridade máxima nas buscas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Fotos ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4FA6A6]" /> Suporte VIP via WhatsApp
                </li>
              </ul>
            </div>

            <Link
              href="/painel"
              className="w-full py-3 rounded-xl bg-[#F8F6F0] hover:bg-[#0E3B43] hover:text-white border border-[#E8E4DA] text-[#0E3B43] text-xs font-bold text-center block transition-all"
            >
              Escolher Premium
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
