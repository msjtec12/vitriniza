'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Send, Building } from 'lucide-react';
import { store } from '@/lib/data/store';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !proofNotes) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      store.submitClaimRequest({
        business_id: businessId,
        requester_name: name,
        requester_email: email,
        requester_phone: phone,
        document,
        proof_notes: proofNotes,
      });
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E3B43]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E4DA] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full text-[#537379] hover:bg-[#F8F6F0] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#4FA6A6]/20 text-[#0E3B43] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#4FA6A6]" />
            </div>
            <h3 className="text-xl font-black text-[#0E3B43] mb-2">
              Solicitação enviada com sucesso!
            </h3>
            <p className="text-sm text-[#537379] max-w-sm mb-6 leading-relaxed">
              Nossa equipe administrativa entrará em contato via WhatsApp ou e-mail em até 24h úteis para validar suas informações e vincular o perfil.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#0E3B43] text-white text-sm font-bold shadow-sm hover:bg-[#154e58]"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43] flex items-center justify-center shrink-0">
                <Building className="w-6 h-6 text-[#E36845]" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#0E3B43]">Reivindicar Empresa</h3>
                <p className="text-xs text-[#537379]">
                  Você é proprietário de <strong className="text-[#0E3B43]">{businessName}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#4FA6A6]/10 rounded-2xl border border-[#4FA6A6]/30 mb-5 flex items-start gap-2.5 text-xs text-[#0E3B43]">
              <ShieldAlert className="w-4 h-4 text-[#E36845] shrink-0 mt-0.5" />
              <span>
                Para proteger o comércio local, verificamos cada solicitação antes de liberar o acesso de edição e painel do estabelecimento.
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                    E-mail de Contato *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                    WhatsApp Comercial *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                  CNPJ ou CPF do Titular (Opcional)
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                  Comprovação de Vínculo *
                </label>
                <textarea
                  required
                  rows={3}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Informe suas redes sociais (@instagram), telefone que bate com o anúncio ou detalhes para validarmos com rapidez."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Enviando solicitação...' : 'Enviar Solicitação de Posse'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
