'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function RecoverPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');

    if (password.length < 8 || password !== confirmation) {
      setMessage('Use ao menos 8 caracteres e confirme a mesma senha.');
      return;
    }
    if (!supabase) {
      setMessage('O serviço de autenticação está indisponível.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    setMessage(error ? 'O link é inválido ou expirou. Solicite um novo.' : 'Senha atualizada. Você já pode entrar.');
  };

  return (
    <div className="min-h-[80vh] bg-[#F8F6F0] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-5">
        <KeyRound className="w-12 h-12 mx-auto text-[#E36845]" />
        <div className="text-center">
          <h1 className="font-black text-2xl text-[#0E3B43]">Criar nova senha</h1>
          <p className="mt-2 text-xs text-[#537379]">Abra esta página pelo link enviado ao seu e-mail.</p>
        </div>
        {message && <p className="rounded-xl bg-[#F8F6F0] p-3 text-xs text-[#0E3B43]">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nova senha"
            className="w-full px-3.5 py-3 rounded-xl border border-[#E8E4DA] text-xs outline-none focus:border-[#E36845]"
          />
          <input
            type="password"
            minLength={8}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Confirmar nova senha"
            className="w-full px-3.5 py-3 rounded-xl border border-[#E8E4DA] text-xs outline-none focus:border-[#E36845]"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-[#E36845] text-white text-sm font-black disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Atualizar senha'}
          </button>
        </form>
        <Link href="/login" className="block text-center text-xs font-bold text-[#0E3B43] hover:text-[#E36845]">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
