'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  ShieldCheck,
  KeyRound,
  ChevronRight,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { store } from '@/lib/data/store';

export default function LoginPage() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = loginInput.trim();
    const cleanDigits = loginInput.replace(/\D/g, '');
    const cleanPass = password.trim();

    if (!cleanInput || !cleanPass) {
      setError('Por favor, informe seu WhatsApp/E-mail e sua senha.');
      return;
    }

    setIsLoading(true);

    const businesses = store.getBusinesses();
    const matched = businesses.find((b) => {
      const bizPhone = b.whatsapp.replace(/\D/g, '');
      const passMatches = b.password === cleanPass || (!b.password && cleanPass === '123456');
      const phoneMatches = cleanDigits && (bizPhone.includes(cleanDigits) || cleanDigits.includes(bizPhone));
      const emailMatches = b.owner_id === cleanInput || cleanInput.includes(b.slug);
      return (phoneMatches || emailMatches) && passMatches;
    });

    setIsLoading(false);

    if (matched) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('vitriniza_merchant_auth', matched.id);
        sessionStorage.setItem('vitriniza_merchant_phone', cleanDigits || cleanInput);
      }
      router.push('/painel');
    } else {
      setError('Credenciais incorretas. Verifique seu WhatsApp/E-mail e senha.');
    }
  };

  const handleForgotPassword = () => {
    const settings = store.getPlatformSettings();
    const whatsapp = settings.contact_whatsapp || '11987654321';
    const text = `Olá Equipe Vitriniza! Esqueci minha senha de acesso ao Painel do Comerciante. Meu estabelecimento é: ${loginInput || ''}`;
    window.open(`https://wa.me/55${whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-[85vh] bg-[#F8F6F0] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#0E3B43] text-white mx-auto flex items-center justify-center shadow-md">
            <Store className="w-7 h-7 text-[#4FA6A6]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-black">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Área do Comerciante</span>
          </div>
          <h1 className="font-black text-2xl text-[#0E3B43]">Área do Comerciante</h1>
          <p className="text-xs text-[#537379] leading-relaxed">
            Acesse para administrar sua Vitrine.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0E3B43] mb-1">WhatsApp ou E-mail Cadastrado *</label>
            <input
              type="text"
              required
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Ex: 11987654321 ou contato@sualoja.com.br"
              className="w-full px-3.5 py-3 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#0E3B43]">Senha de Acesso *</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] font-bold text-[#E36845] hover:underline cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-3 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs sm:text-sm font-black shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isLoading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>

        <div className="text-center pt-3 border-t border-[#E8E4DA] space-y-2 text-xs text-[#537379]">
          <p>Quer ter acesso ao painel?</p>
          <Link
            href="/para-empresas"
            className="inline-flex items-center gap-1 font-bold text-[#0E3B43] hover:text-[#E36845] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Conheça a Vitriniza Pro</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
