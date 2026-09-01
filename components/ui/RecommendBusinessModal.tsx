'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, Store, MessageCircle, CheckCircle2 } from 'lucide-react';
import { store } from '@/lib/data/store';

interface RecommendBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultNeighborhood?: string;
}

export const RecommendBusinessModal: React.FC<RecommendBusinessModalProps> = ({
  isOpen,
  onClose,
  defaultNeighborhood = 'Guaianases',
}) => {
  const [form, setForm] = useState({
    businessName: '',
    category: 'Alimentação',
    contactInfo: '',
    recommendedBy: '',
    neighborhoodName: defaultNeighborhood,
  });

  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim()) return;

    store.recommendBusiness({
      business_name: form.businessName.trim(),
      category: form.category,
      contact_info: form.contactInfo.trim(),
      recommended_by: form.recommendedBy.trim(),
      neighborhood_name: form.neighborhoodName,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setForm({
        businessName: '',
        category: 'Alimentação',
        contactInfo: '',
        recommendedBy: '',
        neighborhoodName: defaultNeighborhood,
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-[#4FA6A6]/30 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <h3 className="font-black text-xl text-[#0E3B43]">Indicação Enviada!</h3>
            <p className="text-xs text-[#537379]">
              Obrigado por ajudar a fortalecer o comércio de Guaianases! Vamos entrar em contato com o estabelecimento.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E36845]/15 text-[#E36845] text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fortaleça o Bairro</span>
              </div>
              <h3 className="font-black text-2xl text-[#0E3B43]">Indicar um Negócio</h3>
              <p className="text-xs text-[#537379] leading-relaxed">
                Conhece um restaurante, salão, encanador ou loja de Guaianases que deveria estar na Vitriniza? Indique abaixo!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                  Nome do Estabelecimento / Profissional *
                </label>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Ex: Pizzaria Don Giovanni, Ana Manicure"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Categoria</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none bg-[#F8F6F0] font-bold"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Beleza">Beleza</option>
                    <option value="Saúde e Bem-estar">Saúde e Bem-estar</option>
                    <option value="Pet">Pet</option>
                    <option value="Casa e Serviços">Casa e Serviços</option>
                    <option value="Automotivo">Automotivo</option>
                    <option value="Moda">Moda</option>
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Festas e Eventos">Festas e Eventos</option>
                    <option value="Profissionais">Profissionais</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E3B43] mb-1">Bairro</label>
                  <input
                    type="text"
                    value={form.neighborhoodName}
                    onChange={(e) => setForm({ ...form, neighborhoodName: e.target.value })}
                    placeholder="Guaianases"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                  WhatsApp ou Instagram (opcional)
                </label>
                <input
                  type="text"
                  value={form.contactInfo}
                  onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                  placeholder="Ex: 11 99999-8888 ou @nomedaloja"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                  Seu Nome (opcional)
                </label>
                <input
                  type="text"
                  value={form.recommendedBy}
                  onChange={(e) => setForm({ ...form, recommendedBy: e.target.value })}
                  placeholder="Ex: Maria vizinha do bairro"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none focus:border-[#E36845] bg-[#F8F6F0]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Indicação</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
