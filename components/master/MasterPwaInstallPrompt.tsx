'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Crown, Sparkles, CheckCircle2 } from 'lucide-react';

export const MasterPwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check standalone mode
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      // Check if user dismissed recently
      const dismissed = localStorage.getItem('vitriniza_master_pwa_dismissed');
      const isDismissedRecent = dismissed && Date.now() - Number(dismissed) < 1000 * 60 * 60 * 24 * 7;

      // Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(iosDevice);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (!isDismissedRecent) {
          setShowBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Trigger custom window event for manual header button clicks
      const handleTriggerInstall = () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              setIsInstalled(true);
              setShowBanner(false);
            }
            setDeferredPrompt(null);
          });
        } else if (iosDevice) {
          setShowIosModal(true);
        } else {
          // Desktop Chrome/Edge/Brave instructions
          alert(
            'Para instalar o Vitriniza Master como aplicativo:\n\n' +
            '1. No Chrome ou Edge, clique no ícone de instalação na barra de endereço (canto superior direito) ou no menu de 3 pontinhos.\n' +
            '2. Selecione "Instalar Vitriniza Master" ou "Adicionar à Área de Trabalho".'
          );
        }
      };

      window.addEventListener('vitriniza-trigger-master-install', handleTriggerInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('vitriniza-trigger-master-install', handleTriggerInstall);
      };
    }
  }, [deferredPrompt]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      });
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      alert(
        'Para instalar o Vitriniza Master:\n\n' +
        'No menu do seu navegador (3 pontinhos), clique em "Instalar Vitriniza Master" ou "Adicionar à tela inicial".'
      );
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('vitriniza_master_pwa_dismissed', String(Date.now()));
  };

  if (isInstalled) return null;

  return (
    <>
      {/* FLOATING MASTER BOTTOM BANNER */}
      {showBanner && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-500">
          <div className="bg-[#082227] text-white p-5 rounded-3xl shadow-2xl border-2 border-[#E36845]/50 relative overflow-hidden group">
            {/* Background luxury gradient glow */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#E36845]/25 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#4FA6A6]/20 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0E3B43] to-[#082227] p-1.5 shadow-lg shrink-0 flex items-center justify-center border-2 border-[#E36845]/40 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-master-192.png" alt="Vitriniza Master" className="w-full h-full object-contain rounded-xl" />
                <span className="absolute -top-1.5 -right-1.5 bg-[#E36845] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                  PRO
                </span>
              </div>

              <div className="space-y-1 pr-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E36845]/20 text-[#F49C6B] text-[10px] font-black uppercase tracking-wider">
                  <Crown className="w-3 h-3 text-[#E36845]" /> App do Administrador
                </div>
                <h4 className="font-black text-sm text-white leading-snug">
                  Baixar App Vitriniza Master
                </h4>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  Tenha o Painel Master na sua tela inicial como um app independente para aprovar negócios e acompanhar métricas com 1 toque.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-4">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Instalar App Master</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Mais tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IOS SAFARI INSTRUCTIONS MODAL SPECIFIC FOR MASTER */}
      {showIosModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#082227] text-white rounded-3xl max-w-sm w-full p-6 space-y-5 text-center shadow-2xl relative border border-[#E36845]/40 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-stone-300 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0E3B43] to-[#082227] p-2 mx-auto shadow-xl flex items-center justify-center border-2 border-[#E36845]/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-master-192.png" alt="Vitriniza Master" className="w-full h-full object-contain rounded-2xl" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E36845]/20 text-[#F49C6B] text-[10px] font-black uppercase tracking-wider mb-2">
                <Crown className="w-3 h-3 text-[#E36845]" /> App Master no iPhone
              </div>
              <h3 className="font-black text-lg text-white">Instalar Vitriniza Master</h3>
              <p className="text-xs text-white/70 mt-1 font-medium">
                Siga os 2 passos no Safari para criar o ícone dedicado do Master na sua tela de início:
              </p>
            </div>

            <div className="space-y-3 text-left text-xs bg-white/5 p-4 rounded-2xl border border-white/10 text-white">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#E36845] text-white font-black flex items-center justify-center shrink-0">1</span>
                <span>Toque no botão <strong>Compartilhar</strong> <Share className="inline w-3.5 h-3.5 text-[#E36845]" /> na barra inferior do Safari.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#4FA6A6] text-white font-black flex items-center justify-center shrink-0">2</span>
                <span>Role para baixo e toque em <strong>Adicionar à Tela de Início</strong> <PlusSquare className="inline w-3.5 h-3.5 text-[#4FA6A6]" />.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-lg transition-all cursor-pointer"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Global trigger function to open the Master install prompt from any button
export function triggerMasterPwaInstall() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('vitriniza-trigger-master-install'));
  }
}
