'use client';

import React from 'react';
import { Smartphone, Download, ShieldCheck, Zap, Bell } from 'lucide-react';
import { triggerPwaInstall } from './PwaInstallPrompt';

export const PwaAppDownloadCard: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0E3B43] via-[#154E58] to-[#0E3B43] text-white rounded-3xl p-6 sm:p-10 border border-[#4FA6A6]/30 shadow-2xl group">
      {/* Decorative ambient background blur */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#E36845]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#4FA6A6]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Copy & CTAs */}
        <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-black tracking-wider uppercase backdrop-blur-md">
            <Smartphone className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Aplicativo Oficial do Seu Bairro</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight drop-shadow-sm">
            Tenha a Vitriniza direto no seu celular.
          </h2>

          <p className="text-sm sm:text-base text-white/85 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Baixe nosso aplicativo para encontrar comércios, consultar cardápios, aproveitar ofertas exclusivas e chamar lojistas no WhatsApp com um único toque!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-bold text-white/90">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
              <Zap className="w-4 h-4 text-[#E36845] shrink-0" />
              <span>Acesso ultrarrápido sem ocupar memória</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
              <Bell className="w-4 h-4 text-[#4FA6A6] shrink-0" />
              <span>Ofertas e promoções atualizadas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-[#E36845] shrink-0" />
              <span>Gratuito e sem instalar nada pesado</span>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button
              onClick={() => triggerPwaInstall()}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white font-black text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Baixar Aplicativo Agora</span>
            </button>
            <span className="text-xs text-white/70 font-semibold">
              ✓ Funciona em Android, iPhone e Computador
            </span>
          </div>
        </div>

        {/* Right Column: Visual Mockup */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-64 sm:w-72 bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-white/20 group-hover:scale-105 transition-transform duration-500">
            <div className="w-full bg-[#F8F6F0] rounded-[2rem] p-4 text-[#0E3B43] space-y-3 overflow-hidden border border-stone-200">
              {/* Phone Mockup Screen */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#0E3B43] p-1 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-black text-xs">Vitriniza App</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#E36845] bg-[#E36845]/10 px-2 py-0.5 rounded-full">INSTALADO</span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
                  <div className="h-2 w-20 bg-[#0E3B43] rounded-full" />
                  <div className="h-1.5 w-32 bg-stone-300 rounded-full" />
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
                  <div className="h-2 w-24 bg-[#E36845] rounded-full" />
                  <div className="h-1.5 w-28 bg-stone-300 rounded-full" />
                </div>
              </div>

              <div className="p-3 bg-[#0E3B43] text-white rounded-xl text-[11px] font-bold text-center">
                📲 Toque para Abrir a Vitrine
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
