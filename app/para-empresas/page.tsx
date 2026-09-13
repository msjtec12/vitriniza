'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  MapPin,
  MessageCircle,
  QrCode,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Wifi,
  Zap,
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { buildWhatsAppUrl, formatCurrency } from '@/lib/utils';
import { InstagramIcon, WhatsAppSolidIcon } from '@/components/ui/Icons';

type InterestType = 'local_free' | 'pro';

const founderPrice = 29.9;

export default function ParaEmpresasPage() {
  const settings = store.getPlatformSettings();
  const regularPrice = settings.pro_plan?.price || settings.plan_prices.pro || 49.9;
  const [form, setForm] = useState({
    interest_type: 'pro' as InterestType,
    businessName: '',
    whatsapp: '',
    instagram: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectInterest = (interestType: InterestType) => {
    setForm((current) => ({ ...current, interest_type: interestType }));
    window.setTimeout(() => document.querySelector('#previa')?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.businessName.trim().length < 2 || form.whatsapp.replace(/\D/g, '').length < 10) {
      alert('Informe o nome do negócio e um WhatsApp válido com DDD.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.businessName,
          whatsapp: form.whatsapp,
          instagram: form.instagram,
          interest_type: form.interest_type,
          message:
            form.interest_type === 'pro'
              ? 'Solicitação de prévia gratuita da Vitriniza Pro.'
              : 'Solicitação de Cadastro Local gratuito.',
        }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Não foi possível enviar a solicitação.');
      }

      setSubmitted(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      alert(`Erro ao enviar solicitação: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const masterPhone = settings.contact_whatsapp || '11987654321';
    const isPro = form.interest_type === 'pro';
    const message =
      `Olá, equipe Vitriniza! Enviei uma solicitação pelo site.\n\n` +
      `🏪 Negócio: *${form.businessName || 'Meu negócio'}*\n` +
      `📱 WhatsApp: *${form.whatsapp || 'A informar'}*\n` +
      (form.instagram ? `📷 Instagram: *${form.instagram}*\n` : '') +
      `✨ Interesse: *${isPro ? 'Prévia gratuita da Vitriniza Pro' : 'Cadastro Local gratuito'}*`;

    window.open(buildWhatsAppUrl(masterPhone, message), '_blank', 'noopener,noreferrer');
  };

  const included = [
    'Página profissional com link próprio',
    'Catálogo de produtos ou serviços',
    'Botão direto para o WhatsApp',
    'Localização, horários e redes sociais',
    'Promoções e ofertas em destaque',
    'QR Code e arte pronta para o balcão',
    'Painel simples para atualizar pelo celular',
    'Métricas de acessos, cliques e rotas',
  ];

  return (
    <main className="overflow-hidden bg-[#F8F6F0] pb-20 text-[#0E3B43]">
      <section className="relative border-b border-[#E8E4DA] bg-[#0E3B43] py-14 sm:py-20 lg:py-24">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#4FA6A6_0,transparent_35%),radial-gradient(circle_at_80%_70%,#E36845_0,transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-[#F8F6F0] backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#F49C6B]" />
              Prévia gratuita em até 24 horas
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Transforme seu Instagram e WhatsApp em uma{' '}
              <span className="text-[#F49C6B]">vitrine que vende 24 horas.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-[#F8F6F0]/80 sm:text-lg">
              Nós montamos uma prévia do seu negócio. Você vê tudo funcionando e só ativa se gostar — sem cartão e sem compromisso.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => selectInterest('pro')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E36845] px-7 py-4 text-sm font-black text-white shadow-xl transition hover:bg-[#F49C6B] active:scale-95"
              >
                Quero ver minha prévia grátis
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                href="/sp/sao-paulo/guaianases/teste"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/15"
              >
                <Eye className="h-5 w-5 text-[#4FA6A6]" />
                Ver uma vitrine funcionando
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-white/70">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#4FA6A6]" /> Sem cartão</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#4FA6A6]" /> Sem fidelidade</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#4FA6A6]" /> Atendimento pelo WhatsApp</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -left-8 top-12 h-40 w-40 rounded-full bg-[#4FA6A6]/30 blur-3xl" />
            <div className="relative rounded-[2.5rem] border-[9px] border-[#173F45] bg-white p-3 shadow-2xl">
              <div className="overflow-hidden rounded-[1.9rem] bg-[#F8F6F0]">
                <div className="h-36 bg-gradient-to-br from-[#4FA6A6] to-[#0E3B43] p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#E36845] shadow-lg">
                      <Store className="h-7 w-7" />
                    </div>
                    <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-black text-emerald-100">ABERTO AGORA</span>
                  </div>
                  <h2 className="mt-4 text-xl font-black">Seu negócio aqui</h2>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#537379]">
                    <MapPin className="h-4 w-4 text-[#E36845]" /> Seu bairro • Sua cidade
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-emerald-600 px-3 py-3 text-center text-xs font-black text-white">Chamar no WhatsApp</div>
                    <div className="rounded-xl bg-white px-3 py-3 text-center text-xs font-black shadow-sm">Como chegar</div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-wide">Produtos e serviços</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="space-y-2 rounded-xl bg-white p-2 shadow-sm">
                          <div className="aspect-square rounded-lg bg-gradient-to-br from-[#E8E4DA] to-[#4FA6A6]/30" />
                          <div className="h-1.5 w-4/5 rounded bg-[#0E3B43]/20" />
                          <div className="h-1.5 w-1/2 rounded bg-[#E36845]/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 rounded-2xl bg-white p-4 shadow-xl sm:-left-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E36845]/15 text-[#E36845]"><QrCode className="h-5 w-5" /></div>
                <div><p className="text-xs font-black">Link + QR Code</p><p className="text-[10px] text-[#537379]">Prontos para divulgar</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#E36845]">Simples do começo ao fim</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Você não precisa montar nada sozinho</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#537379]">Primeiro mostramos o resultado. Depois você decide se quer ativar.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: InstagramIcon, number: '1', title: 'Envie seu contato', text: 'Informe nome, WhatsApp e o Instagram do negócio, se tiver.' },
            { icon: Smartphone, number: '2', title: 'Receba a prévia', text: 'Montamos sua vitrine e enviamos o link para você avaliar pelo celular.' },
            { icon: Zap, number: '3', title: 'Ative se gostar', text: 'Aprovou? Ativamos a página, o painel e seu material de divulgação.' },
          ].map(({ icon: Icon, number, title, text }) => (
            <article key={number} className="relative rounded-3xl border border-[#4FA6A6]/20 bg-white p-7 shadow-sm">
              <span className="absolute right-5 top-4 text-5xl font-black text-[#0E3B43]/5">{number}</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43]"><Icon className="h-6 w-6" /></div>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#537379]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E8E4DA] bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div className="self-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#E36845]/10 px-3 py-1.5 text-xs font-black text-[#E36845]"><BadgeCheck className="h-4 w-4" /> Condição de lançamento</span>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Uma presença digital completa por menos de R$ 1 por dia.</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#537379]">A oferta de fundador vale para as 30 primeiras empresas e permanece enquanto a assinatura estiver ativa.</p>
            <div className="mt-7 flex items-end gap-3">
              <span className="pb-1 text-lg font-bold text-[#537379] line-through">{formatCurrency(regularPrice)}</span>
              <span className="text-5xl font-black text-[#E36845]">{formatCurrency(founderPrice)}</span>
              <span className="pb-2 text-sm font-bold text-[#537379]">/mês</span>
            </div>
            <button type="button" onClick={() => selectInterest('pro')} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E36845] px-7 py-4 text-sm font-black text-white shadow-lg transition hover:bg-[#F49C6B] sm:w-auto">
              Quero minha prévia gratuita <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-3xl bg-[#0E3B43] p-7 text-white shadow-xl sm:p-9">
            <h3 className="text-xl font-black">Tudo que sua empresa recebe</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-sm text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4FA6A6]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-2xl border border-[#F49C6B]/30 bg-[#E36845]/10 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E36845] text-white"><Wifi className="h-5 w-5" /></div>
                <div>
                  <p className="font-black text-[#F49C6B]">Placa inteligente QR + NFC</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/75">Adicional opcional por valor único de R$ 80. Direciona para sua vitrine, WhatsApp ou página para avaliação honesta no Google.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="previa" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-[#4FA6A6]/25 bg-white shadow-xl">
          <div className="bg-[#0E3B43] px-6 py-8 text-center text-white sm:px-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black"><Clock3 className="h-4 w-4 text-[#F49C6B]" /> Leva menos de 1 minuto</span>
            <h2 className="mt-4 text-3xl font-black">{form.interest_type === 'pro' ? 'Peça sua prévia gratuita' : 'Solicite o Cadastro Local'}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/75">{form.interest_type === 'pro' ? 'Você receberá o link pelo WhatsApp para ver como seu negócio pode ficar.' : 'Cadastre as informações básicas do seu negócio gratuitamente no portal.'}</p>
          </div>

          <div className="p-6 sm:p-10">
            {submitted ? (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></div>
                <h3 className="mt-5 text-2xl font-black">Pedido recebido!</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#537379]">Vamos falar com você pelo WhatsApp <strong>{form.whatsapp}</strong>{form.interest_type === 'pro' ? ' para preparar sua prévia.' : ' para confirmar seu cadastro.'}</p>
                <button type="button" onClick={handleOpenWhatsApp} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700 sm:w-auto">
                  <WhatsAppSolidIcon className="h-5 w-5" /> Continuar no WhatsApp
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F8F6F0] p-1.5">
                  <button type="button" onClick={() => setForm((current) => ({ ...current, interest_type: 'pro' }))} className={`rounded-xl px-3 py-3 text-xs font-black transition ${form.interest_type === 'pro' ? 'bg-[#E36845] text-white shadow-sm' : 'text-[#537379] hover:bg-white'}`}>Prévia Pro grátis</button>
                  <button type="button" onClick={() => setForm((current) => ({ ...current, interest_type: 'local_free' }))} className={`rounded-xl px-3 py-3 text-xs font-black transition ${form.interest_type === 'local_free' ? 'bg-[#0E3B43] text-white shadow-sm' : 'text-[#537379] hover:bg-white'}`}>Cadastro Local</button>
                </div>

                <div>
                  <label htmlFor="businessName" className="mb-1.5 block text-xs font-black">Nome do negócio *</label>
                  <input id="businessName" required maxLength={160} value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} placeholder="Ex.: Pizzaria da Vila" className="w-full rounded-xl border border-[#E8E4DA] bg-[#F8F6F0] px-4 py-3.5 text-sm outline-none transition focus:border-[#E36845] focus:ring-2 focus:ring-[#E36845]/10" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="whatsapp" className="mb-1.5 block text-xs font-black">WhatsApp com DDD *</label>
                    <input id="whatsapp" required inputMode="tel" maxLength={30} value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="(11) 99999-9999" className="w-full rounded-xl border border-[#E8E4DA] bg-[#F8F6F0] px-4 py-3.5 text-sm outline-none transition focus:border-[#E36845] focus:ring-2 focus:ring-[#E36845]/10" />
                  </div>
                  <div>
                    <label htmlFor="instagram" className="mb-1.5 block text-xs font-black">Instagram, se tiver</label>
                    <input id="instagram" maxLength={80} value={form.instagram} onChange={(event) => setForm((current) => ({ ...current, instagram: event.target.value }))} placeholder="@seunegocio" className="w-full rounded-xl border border-[#E8E4DA] bg-[#F8F6F0] px-4 py-3.5 text-sm outline-none transition focus:border-[#E36845] focus:ring-2 focus:ring-[#E36845]/10" />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E36845] px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-[#F49C6B] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Enviando...' : form.interest_type === 'pro' ? 'Quero receber minha prévia' : 'Solicitar cadastro gratuito'}
                  <Send className="h-4 w-4" />
                </button>
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#537379]"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Seus dados serão usados apenas para este atendimento.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center"><h2 className="text-2xl font-black sm:text-3xl">Dúvidas frequentes</h2></div>
        <div className="space-y-3">
          {[
            ['Preciso pagar para ver a prévia?', 'Não. Montamos a prévia sem cobrança e você só ativa a assinatura se gostar do resultado.'],
            ['O que acontece depois que eu enviar?', 'Entramos em contato pelo WhatsApp, confirmamos algumas informações e enviamos o link da sua vitrine para aprovação.'],
            ['Posso ficar apenas no cadastro gratuito?', 'Sim. O Cadastro Local mantém as informações básicas, WhatsApp, endereço e horários. Catálogo, ofertas, painel e métricas fazem parte do Pro.'],
            ['Existe fidelidade?', 'Não. O plano é mensal e pode ser cancelado. A condição de fundador permanece enquanto a assinatura estiver ativa.'],
            ['A placa QR/NFC está incluída?', 'A arte digital do QR Code está incluída no Pro. A placa física inteligente é opcional e tem valor único de R$ 80.'],
          ].map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-[#E8E4DA] bg-white p-5 open:border-[#4FA6A6]/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black">{question}<ChevronRight className="h-5 w-5 shrink-0 text-[#E36845] transition group-open:rotate-90" /></summary>
              <p className="mt-3 pr-8 text-sm leading-relaxed text-[#537379]">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-[#E36845] p-7 text-white shadow-xl sm:flex-row sm:p-10">
          <div><p className="text-xs font-black uppercase tracking-widest text-white/70">Ainda ficou com dúvida?</p><h2 className="mt-2 text-2xl font-black">Fale diretamente com a equipe Vitriniza.</h2></div>
          <a href={buildWhatsAppUrl(settings.contact_whatsapp || '11987654321', 'Olá! Quero entender melhor como funciona a Vitriniza para o meu negócio.')} target="_blank" rel="noopener noreferrer" className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#0E3B43] transition hover:bg-[#F8F6F0] sm:w-auto"><MessageCircle className="h-5 w-5 text-emerald-600" /> Falar no WhatsApp</a>
        </div>
      </section>
    </main>
  );
}
