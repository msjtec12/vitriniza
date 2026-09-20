'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2, Sparkles } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith('/master')) {
      return;
    }
    // Detect if already running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      // Check if user dismissed prompt recently
      const dismissed = localStorage.getItem('vitriniza_pwa_dismissed');
      if (dismissed && Date.now() - Number(dismissed) < 1000 * 60 * 60 * 24 * 3) {
        // Dismissed less than 3 days ago
      }

      // Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(iosDevice);

      // Listen for PWA install prompt event (Android / Chrome / Desktop)
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (!dismissed) {
          setShowBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Trigger custom window event for manual button clicks anywhere in the app
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
          // Fallback instructions for unsupported/desktop browsers
          alert('Para instalar o Vitriniza como App:\n\nNo navegador (Chrome/Edge/Brave), clique no menu de 3 pontinhos no canto superior e selecione "Instalar Vitriniza" ou "Adicionar à tela inicial".');
        }
      };

      window.addEventListener('vitriniza-trigger-pwa-install', handleTriggerInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('vitriniza-trigger-pwa-install', handleTriggerInstall);
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
      alert('Para instalar o Vitriniza:\nNo menu do navegador (3 pontinhos), clique em "Instalar Vitriniza" ou "Adicionar à tela inicial".');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('vitriniza_pwa_dismissed', String(Date.now()));
  };

  if (isInstalled || pathname?.startsWith('/master')) return null;

  return (
    <>
      {/* FLOATING BOTTOM BANNER PROMPT */}
      {showBanner && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-500">
          <div className="bg-[#0E3B43] text-white p-5 rounded-3xl shadow-2xl border border-[#4FA6A6]/40 relative overflow-hidden group">
            {/* Ambient visual background glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E36845]/20 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center border border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Vitriniza Logo" className="w-full h-full object-contain" />
              </div>

              <div className="space-y-1 pr-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4FA6A6]/20 text-[#4FA6A6] text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#E36845]" /> App Oficial
                </div>
                <h4 className="font-black text-sm text-white leading-snug">
                  Baixar Aplicativo Vitriniza
                </h4>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  Acesse comércios, promoções e fale no WhatsApp mais rápido direto da sua tela inicial!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-4">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Agora</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IOS SAFARI INSTRUCTIONS MODAL */}
      {showIosModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 text-center shadow-2xl relative border border-[#4FA6A6]/30 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-[#0E3B43] p-2.5 mx-auto shadow-lg flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Vitriniza" className="w-full h-full object-contain" />
            </div>

            <div>
              <h3 className="font-black text-lg text-[#0E3B43]">Instalar no iPhone / iPad</h3>
              <p className="text-xs text-[#537379] mt-1 font-medium">
                Siga os 2 passos simples no Safari para ter o App na sua tela inicial:
              </p>
            </div>

            <div className="space-y-3 text-left text-xs bg-[#F8F6F0] p-4 rounded-2xl border border-[#E8E4DA] text-[#0E3B43]">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#E36845] text-white font-black flex items-center justify-center shrink-0">1</span>
                <span>Toque no botão <strong>Compartilhar</strong> <Share className="inline w-3.5 h-3.5 text-[#E36845]" /> na barra do Safari.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#4FA6A6] text-white font-black flex items-center justify-center shrink-0">2</span>
                <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="inline w-3.5 h-3.5 text-[#4FA6A6]" />.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0E3B43] text-white text-xs font-black shadow-md hover:bg-[#154E58] transition-all cursor-pointer"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Helper trigger function to invoke PWA installation from any button
export function triggerPwaInstall() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('vitriniza-trigger-pwa-install'));
  }
}
