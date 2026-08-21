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
  QrCode,
  Users,
  Zap,
  Flame,
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

      {/* Pricing Plans Table: 3 Clear Plans (Gratuito, Semanal R$ 19,90, Mensal R$ 49,90) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#E36845] uppercase tracking-wider">
            Planos Acessíveis & Transparentes
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight mt-1 mb-3">
            Escolha o plano ideal para seu momento
          </h2>
          <p className="text-xs sm:text-sm text-[#537379]">
            Sem fidelidade ou multas. Você no controle total da presença digital do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Plan 1: Gratuito */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E4DA] card-shadow flex flex-col justify-between hover:border-[#4FA6A6]/40 transition-all">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-stone-100 text-xs font-bold text-[#537379] uppercase tracking-wider mb-3">
                Início
              </div>
              <h3 className="font-black text-2xl text-[#0E3B43] mb-2">Gratuito</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-[#0E3B43]">R$ 0</span>
                <span className="text-xs text-[#537379] font-medium">/sempre</span>
              </div>
              <p className="text-xs text-[#537379] mb-6 leading-relaxed">
                Página essencial para começar a marcar presença e ser encontrado por vizinhos no bairro.
              </p>

              <ul className="space-y-3 text-xs text-[#0E3B43] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Página exclusiva do estabelecimento</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Botão de WhatsApp direto nos produtos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Endereço completo e rota no mapa</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Horários de funcionamento em tempo real</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Até 3 fotos no perfil</span>
                </li>
              </ul>
            </div>

            <Link
              href="/painel"
              className="w-full py-3.5 rounded-xl bg-[#F8F6F0] hover:bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-bold text-center block transition-all border border-[#E8E4DA]"
            >
              Começar Grátis
            </Link>
          </div>

          {/* Plan 2: Destaque Semanal (R$ 19,90 / semana) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#4FA6A6]/35 card-shadow flex flex-col justify-between hover:border-[#E36845]/50 transition-all">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-xs font-bold text-[#0E3B43] uppercase tracking-wider mb-3">
                <Zap className="w-3.5 h-3.5 text-[#E36845]" />
                <span>Flexível</span>
              </div>
              <h3 className="font-black text-2xl text-[#0E3B43] mb-2">Destaque Semanal</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-[#E36845]">
                  {formatCurrency(settings.plan_prices.semanal || 19.90)}
                </span>
                <span className="text-xs text-[#537379] font-medium">/ 7 dias</span>
              </div>
              <p className="text-xs text-[#537379] mb-6 leading-relaxed">
                Ideal para promoções pontuais, lançamentos, eventos ou para testar o retorno rápido de clientes.
              </p>

              <ul className="space-y-3 text-xs text-[#0E3B43] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span className="font-bold">Tudo do plano Gratuito</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Selo oficial de <strong>Destaque</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Publicação de <strong>OFERTAS com desconto 🔥</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Até 20 produtos no catálogo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Prioridade nos resultados por 7 dias</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Até 10 fotos na galeria</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Métricas de cliques no WhatsApp</span>
                </li>
              </ul>
            </div>

            <Link
              href="/painel"
              className="w-full py-3.5 rounded-xl bg-[#F8F6F0] hover:bg-[#E36845] hover:text-white border border-[#4FA6A6]/30 text-[#0E3B43] text-xs font-bold text-center block transition-all"
            >
              Escolher Semanal
            </Link>
          </div>

          {/* Plan 3: Mensal Completo (R$ 49,90 / mês) - RECOMENDADO */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-[#0E3B43] text-[#F8F6F0] card-shadow flex flex-col justify-between shadow-2xl border-2 border-[#E36845] scale-100 sm:scale-105 z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#E36845] text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Mais Vantajoso</span>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-[#4FA6A6]/20 text-xs font-bold text-[#4FA6A6] uppercase tracking-wider mb-3 mt-1">
                Completo & Ilimitado
              </div>
              <h3 className="font-black text-2xl text-[#F8F6F0] mb-2">Mensal Completo</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-[#F8F6F0]">
                  {formatCurrency(settings.plan_prices.mensal || 49.90)}
                </span>
                <span className="text-xs text-[#F8F6F0]/70 font-medium">/mês</span>
              </div>
              <p className="text-xs text-[#F8F6F0]/80 mb-6 leading-relaxed">
                Máxima visibilidade contínua, produtos ilimitados, ofertas constantes e display de balcão.
              </p>

              <ul className="space-y-3 text-xs text-[#F8F6F0]/90 mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span className="font-bold">Tudo do plano Semanal</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Produtos e serviços <strong>ILIMITADOS</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Publicação contínua de <strong>OFERTAS 🔥</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span><strong>QR Code com Logo</strong> e Placa para Balcão</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Selo oficial <strong>Destaque & Verificado</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Destaque na Homepage e topo das buscas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Até 50 fotos em alta resolução</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Painel Analytics completo (7, 30 e 90 dias)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            <Link
              href="/painel"
              className="w-full py-4 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black text-center block transition-all shadow-lg active:scale-95"
            >
              Escolher Plano Mensal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
