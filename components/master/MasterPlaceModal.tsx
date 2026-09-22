'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Building2,
  Clock,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  ExternalLink,
  Search,
  Upload,
  ImageIcon,
  Trash2,
} from 'lucide-react';
import { Place, PlaceCategoryGroup, PlaceVerificationStatus, Neighborhood } from '@/types';
import { store } from '@/lib/data/store';
import { fetchAddressByCep } from '@/lib/utils';
import { PLACE_CATEGORY_META } from '@/lib/places';
import { supabase } from '@/lib/supabase/client';

interface MasterPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeToEdit?: Place | null;
  onSuccess: () => void;
  neighborhoods: Neighborhood[];
}

export const MasterPlaceModal: React.FC<MasterPlaceModalProps> = ({
  isOpen,
  onClose,
  placeToEdit,
  onSuccess,
  neighborhoods,
}) => {
  const [formData, setFormData] = useState<Partial<Place>>({
    name: '',
    slug: '',
    category_group: 'saude',
    subcategory: 'UBS / Posto de Saúde',
    address: '',
    number: '',
    complement: '',
    neighborhood_id: neighborhoods[0]?.id || 'neigh-guaianases',
    neighborhood_name: neighborhoods[0]?.name || 'Guaianases',
    city_name: 'São Paulo',
    state_id: 'SP',
    postal_code: '',
    latitude: -23.5424,
    longitude: -46.4178,
    phone: '',
    email: '',
    website: '',
    opening_hours: 'Seg a Sex 07h às 19h',
    photo_url: '',
    cover_url: '',
    source_name: 'Prefeitura / SMS',
    source_url: '',
    verification_status: 'verified',
    is_active: true,
    short_description: '',
    description: '',
  });

  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (placeToEdit) {
      setFormData({ ...placeToEdit });
    } else {
      setFormData({
        name: '',
        slug: '',
        category_group: 'saude',
        subcategory: 'UBS / Posto de Saúde',
        address: '',
        number: '',
        complement: '',
        neighborhood_id: neighborhoods[0]?.id || 'neigh-guaianases',
        neighborhood_name: neighborhoods[0]?.name || 'Guaianases',
        city_name: 'São Paulo',
        state_id: 'SP',
        postal_code: '',
        latitude: -23.5424,
        longitude: -46.4178,
        phone: '',
        email: '',
        website: '',
        opening_hours: 'Seg a Sex 07h às 19h',
        photo_url: '',
        cover_url: '',
        image_url: '',
        source_name: 'Prefeitura / SMS',
        source_url: '',
        verification_status: 'verified',
        is_active: true,
        short_description: '',
        description: '',
      });
    }
    setCepMessage(null);
  }, [placeToEdit, neighborhoods, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const { data: sessionData } = (await supabase?.auth.getSession()) || {};
      const token = sessionData?.session?.access_token;

      const fd = new FormData();
      fd.append('file', file);
      fd.append('businessId', formData.id || 'master-place');
      fd.append('folder', 'places');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/merchant/upload', {
        method: 'POST',
        headers,
        body: fd,
      });

      if (res.ok) {
        const json = (await res.json()) as { success?: boolean; url?: string };
        if (json.success && json.url) {
          setFormData((prev) => ({
            ...prev,
            photo_url: json.url,
            cover_url: json.url,
            image_url: json.url,
          }));
          setUploadingImage(false);
          return;
        }
      }

      // Fallback: FileReader Base64 for instant local preview & persistence
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({
            ...prev,
            photo_url: reader.result as string,
            cover_url: reader.result as string,
            image_url: reader.result as string,
          }));
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({
            ...prev,
            photo_url: reader.result as string,
            cover_url: reader.result as string,
            image_url: reader.result as string,
          }));
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCepLookup = async () => {
    const cleanCep = (formData.postal_code || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepMessage('Digite os 8 números do CEP.');
      return;
    }
    setCepLoading(true);
    setCepMessage(null);

    const res = await fetchAddressByCep(cleanCep);
    setCepLoading(false);

    if (res) {
      const loc = store.ensureLocation(res.bairro || 'Centro', res.localidade || 'São Paulo', res.uf || 'SP');
      setFormData((prev) => ({
        ...prev,
        address: res.logradouro || prev.address,
        postal_code: res.cep,
        neighborhood_id: loc.neighborhood.id,
        neighborhood_name: loc.neighborhood.name,
        city_name: loc.city.name,
        state_id: loc.stateId || loc.city?.state_id || 'SP',
      }));
      setCepMessage(`✓ ${res.logradouro ? res.logradouro + ', ' : ''}Bairro ${res.bairro} (${res.localidade}/${res.uf})`);
    } else {
      setCepMessage('⚠️ CEP não encontrado via ViaCEP.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.address?.trim()) {
      alert('Nome do local e endereço são obrigatórios.');
      return;
    }

    const resolvedImg = formData.photo_url || formData.cover_url || formData.image_url || '';
    const payload = {
      ...formData,
      image_url: resolvedImg,
      photo_url: resolvedImg,
      cover_url: resolvedImg,
    };

    if (placeToEdit) {
      store.updatePlace(placeToEdit.id, payload);
      alert('✓ Local público atualizado com sucesso!');
    } else {
      store.createPlace(payload);
      alert('✓ Novo ponto de interesse cadastrado com sucesso!');
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#4FA6A6]/30 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0E3B43] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">
                {placeToEdit ? 'Editar Ponto de Interesse' : 'Cadastrar Ponto de Interesse'}
              </h3>
              <p className="text-[11px] text-teal-200">
                Equipamento público, lazer, transporte ou utilidade comunitária
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Name, Subcategory, Category Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Nome do Local / Equipamento *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: UBS Bandeirantes, Parque Chácara das Flores..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Grupo de Categoria *
              </label>
              <select
                value={formData.category_group || 'saude'}
                onChange={(e) => setFormData({ ...formData, category_group: e.target.value as PlaceCategoryGroup })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
              >
                {Object.entries(PLACE_CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Subcategory & Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Subcategoria / Tipo Específico
              </label>
              <input
                type="text"
                value={formData.subcategory || ''}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="Ex: UBS, Hospital Geral, Parque Municipal, Estação CPTM..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Status de Verificação
              </label>
              <select
                value={formData.verification_status || 'verified'}
                onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as PlaceVerificationStatus })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
              >
                <option value="verified">Oficial Verificado (Prefeitura / Governo)</option>
                <option value="public_info">Informação Pública Aberta</option>
                <option value="community_submitted">Submetido pela Comunidade</option>
              </select>
            </div>
          </div>

          {/* Row 3: Address & CEP with lookup */}
          <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-3">
            <span className="block text-xs font-black text-[#0E3B43] uppercase tracking-wider">
              Localização & Endereço
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#537379] mb-1">CEP</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCepLookup}
                    disabled={cepLoading}
                    className="px-2.5 py-2 rounded-xl bg-[#0E3B43] text-white text-xs font-bold hover:bg-[#154E58] shrink-0"
                    title="Buscar endereço pelo CEP"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#537379] mb-1">Logradouro *</label>
                <input
                  type="text"
                  required
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, Avenida, Praça..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#537379] mb-1">Número</label>
                <input
                  type="text"
                  value={formData.number || ''}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="123 ou S/N"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
                />
              </div>
            </div>

            {cepMessage && (
              <p className="text-[11px] font-bold text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-200">
                {cepMessage}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#537379] mb-1">Bairro</label>
                <select
                  value={formData.neighborhood_id || ''}
                  onChange={(e) => {
                    const sel = neighborhoods.find((n) => n.id === e.target.value);
                    setFormData({
                      ...formData,
                      neighborhood_id: e.target.value,
                      neighborhood_name: sel?.name || formData.neighborhood_name,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
                >
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#537379] mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude || 0}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#537379] mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude || 0}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Contacts & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Horário de Atendimento
              </label>
              <input
                type="text"
                value={formData.opening_hours || ''}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                placeholder="Ex: Seg a Sex 07h às 19h / 24h"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Telefone Oficial
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 2555-0000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Site / Portal Oficial
              </label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://capital.sp.gov.br/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
              />
            </div>
          </div>

          {/* Row 5: Source & Transparency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Nome da Fonte Oficial
              </label>
              <input
                type="text"
                value={formData.source_name || ''}
                onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                placeholder="Ex: Secretaria Municipal da Saúde / CPTM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B43] mb-1">
                Link da Fonte Oficial
              </label>
              <input
                type="url"
                value={formData.source_url || ''}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
              />
            </div>
          </div>

          {/* Row 6: Image Upload & Preview */}
          <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#0E3B43] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#4FA6A6]" />
                <span>Foto / Imagem de Capa do Local</span>
              </label>
              {(formData.photo_url || formData.cover_url || formData.image_url) && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, photo_url: '', cover_url: '', image_url: '' })}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remover Imagem</span>
                </button>
              )}
            </div>

            {/* Preview if image exists */}
            {(formData.photo_url || formData.cover_url || formData.image_url) && (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#E8E4DA] bg-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.photo_url || formData.cover_url || formData.image_url}
                  alt="Prévia do local"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold shadow-sm transition-all text-center">
                  <Upload className="w-3.5 h-3.5 text-teal-300" />
                  <span>{uploadingImage ? 'Enviando imagem...' : '📁 Escolher Foto do Computador/Celular'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <div>
                <input
                  type="url"
                  value={formData.photo_url || formData.cover_url || formData.image_url || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      photo_url: val,
                      cover_url: val,
                      image_url: val,
                    });
                  }}
                  placeholder="Ou cole a URL direta (https://...)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#537379]">
              Formatos aceitos: JPG, PNG, WebP. A foto é salva instantaneamente e exibida tanto nos cartões quanto na página de detalhes do local.
            </p>
          </div>

          {/* Descriptions */}
          <div>
            <label className="block text-xs font-bold text-[#0E3B43] mb-1">
              Resumo Curto
            </label>
            <input
              type="text"
              value={formData.short_description || ''}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Ex: Unidade Básica de Saúde com atendimento ambulatorial e vacinação."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0E3B43] mb-1">
              Descrição Completa & Serviços Oferecidos
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva as especialidades, serviços, linhas de ônibus ou instruções de atendimento..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="place_active"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded text-[#0E3B43]"
            />
            <label htmlFor="place_active" className="text-xs font-bold text-[#0E3B43] cursor-pointer">
              Ponto de Interesse Ativo no Portal
            </label>
          </div>

          {/* Footer CTAs */}
          <div className="pt-4 border-t border-[#E8E4DA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold shadow-md transition-all"
            >
              {placeToEdit ? 'Salvar Alterações' : 'Cadastrar Ponto de Interesse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
