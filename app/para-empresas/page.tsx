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
  Zap,
  Flame,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { formatCurrency, buildWhatsAppUrl } from '@/lib/utils';
import { WhatsAppSolidIcon } from '@/components/ui/Icons';

export default function ParaEmpresasPage() {
  const settings = store.getPlatformSettings();

  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    whatsapp: '',
    neighborhood: 'Guaianases',
    category: 'Alimentação & Gastronomia',
    plan: 'Mensal Completo (R$ 49,90/mês)',
  });

  const handleSendToMasterWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.ownerName || !form.whatsapp) {
      alert('Por favor, preencha o nome do estabelecimento, responsável e WhatsApp.');
      return;
    }

    const masterPhone = settings.contact_whatsapp || '11999998888';
    const message =
      `Olá Admin Vitriniza! Gostaria de cadastrar minha empresa no Portal:\n\n` +
      `🏢 Estabelecimento: ${form.businessName}\n` +
      `👤 Proprietário(a): ${form.ownerName}\n` +
      `📱 WhatsApp: ${form.whatsapp}\n` +
      `📍 Bairro: ${form.neighborhood}\n` +
      `🏷️ Ramo/Categoria: ${form.category}\n` +
      `⭐ Plano Desejado: ${form.plan}`;

    const url = buildWhatsAppUrl(masterPhone, message);
    window.open(url, '_blank');
  };

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
            <a
              href="#cadastrar"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-base font-black shadow-lg transition-all active:scale-95"
            >
              <span>Cadastrar meu negócio agora</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href={`https://wa.me/55${settings.contact_whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre a Vitriniza para o meu comércio.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-stone-50 border border-[#4FA6A6]/40 text-[#0E3B43] text-base font-bold shadow-xs transition-all"
            >
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <span>Falar com Admin no WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight mb-3">
            Tudo o que você precisa para vender mais no seu bairro
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => {
            const IconComp = b.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-[#4FA6A6]/20 card-shadow space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#4FA6A6]/15 flex items-center justify-center">
                  <IconComp className="w-6 h-6 text-[#E36845]" />
                </div>
                <h3 className="font-black text-lg text-[#0E3B43]">{b.title}</h3>
                <p className="text-xs text-[#537379] leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plans Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43] tracking-tight mb-3">
            Planos simples e acessíveis
          </h2>
          <p className="text-xs sm:text-sm text-[#537379]">
            Escolha a opção ideal para o momento do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Gratuito */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow flex flex-col justify-between">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-stone-100 text-xs font-bold text-[#537379] uppercase tracking-wider mb-3">
                Gratuito
              </div>
              <h3 className="font-black text-2xl text-[#0E3B43] mb-2">Plano Grátis</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-[#0E3B43]">R$ 0</span>
              </div>
              <p className="text-xs text-[#537379] mb-6 leading-relaxed">
                Para quem quer marcar presença e começar a ser encontrado pelos moradores.
              </p>
              <ul className="space-y-3 text-xs text-[#0E3B43] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Perfil completo com logo e fotos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Botão direto para o seu WhatsApp</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Até 3 produtos/serviços no catálogo</span>
                </li>
              </ul>
            </div>

            <a
              href="#cadastrar"
              className="w-full py-3.5 rounded-xl bg-[#F8F6F0] hover:bg-stone-200 border border-[#E8E4DA] text-[#0E3B43] text-xs font-bold text-center block transition-all"
            >
              Escolher Grátis
            </a>
          </div>

          {/* Plan 2: Semanal */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#4FA6A6]/20 card-shadow flex flex-col justify-between">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-[#E36845]/15 text-xs font-bold text-[#E36845] uppercase tracking-wider mb-3">
                Ideal para Promoções
              </div>
              <h3 className="font-black text-2xl text-[#0E3B43] mb-2">Destaque Semanal</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-[#0E3B43]">
                  {formatCurrency(settings.plan_prices.semanal || 19.90)}
                </span>
                <span className="text-xs text-[#537379] font-medium">/semana</span>
              </div>
              <p className="text-xs text-[#537379] mb-6 leading-relaxed">
                Perfeito para impulsionar eventos, novidades ou liquidações do seu comércio.
              </p>
              <ul className="space-y-3 text-xs text-[#0E3B43] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Destaque no topo da categoria por 7 dias</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Até 15 produtos no catálogo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4FA6A6] shrink-0" />
                  <span>Publicação de 1 Oferta em Destaque</span>
                </li>
              </ul>
            </div>

            <a
              href="#cadastrar"
              className="w-full py-3.5 rounded-xl bg-[#F8F6F0] hover:bg-[#E36845] hover:text-white border border-[#4FA6A6]/30 text-[#0E3B43] text-xs font-bold text-center block transition-all"
            >
              Escolher Semanal
            </a>
          </div>

          {/* Plan 3: Mensal Completo */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-[#0E3B43] text-[#F8F6F0] card-shadow flex flex-col justify-between shadow-2xl border-2 border-[#E36845]">
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
              </ul>
            </div>

            <a
              href="#cadastrar"
              className="w-full py-4 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black text-center block transition-all shadow-lg active:scale-95"
            >
              Escolher Plano Mensal
            </a>
          </div>
        </div>
      </section>

      {/* Registration Form Section (Direct WhatsApp to Admin Master) */}
      <section id="cadastrar" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#4FA6A6]/20 card-shadow space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E36845]/15 text-[#E36845] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Solicitação de Cadastro</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0E3B43]">
              Cadastre seu Comércio na Vitriniza
            </h2>
            <p className="text-xs sm:text-sm text-[#537379] max-w-xl mx-auto">
              Preencha os dados da sua loja abaixo. As informações serão enviadas diretamente ao WhatsApp do <strong>Admin Master</strong> para ativação e envio do seu link de acesso.
            </p>
          </div>

          <form onSubmit={handleSendToMasterWhatsapp} className="space-y-4">
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
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Nome do Proprietário / Responsável *</label>
                <input
                  type="text"
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp para Atendimento *</label>
                <input
                  type="text"
                  required
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="11999998888"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Bairro do Comércio *</label>
                <select
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-[#F8F6F0] font-bold cursor-pointer"
                >
                  <option value="Guaianases">Guaianases</option>
                  <option value="Lajeado">Lajeado</option>
                  <option value="Cidade Tiradentes">Cidade Tiradentes</option>
                  <option value="Itaquera">Itaquera</option>
                  <option value="São Miguel Paulista">São Miguel Paulista</option>
                  <option value="Poá">Poá</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Ramo / Categoria *</label>
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: Pizzaria, Barbearia, Roupas, Eletricista"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Plano Desejado</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-[#F8F6F0] font-bold cursor-pointer"
                >
                  <option value="Mensal Completo (R$ 49,90/mês)">Mensal Completo (R$ 49,90/mês) ⭐ Recomendado</option>
                  <option value="Destaque Semanal (R$ 19,90/semana)">Destaque Semanal (R$ 19,90/semana)</option>
                  <option value="Gratuito (R$ 0)">Gratuito (R$ 0)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-4"
            >
              <WhatsAppSolidIcon className="w-4 h-4 fill-white" />
              <span>Enviar Solicitação para o WhatsApp do Admin Master</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
