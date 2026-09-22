'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Plus,
  Upload,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Place, PlaceCategoryGroup, Neighborhood } from '@/types';
import { store } from '@/lib/data/store';
import { ZONA_LESTE_PLACES } from '@/lib/data/zonaleste-catalog';
import { PLACE_CATEGORY_META } from '@/components/ui/PlaceCard';
import { MasterPlaceModal } from './MasterPlaceModal';
import { MasterMassImportModal } from './MasterMassImportModal';

interface MasterPlacesTabProps {
  places: Place[];
  neighborhoods: Neighborhood[];
  onRefresh: () => void;
}

export const MasterPlacesTab: React.FC<MasterPlacesTabProps> = ({
  places,
  neighborhoods,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [placeToEdit, setPlaceToEdit] = useState<Place | null>(null);
  const [isMassImportOpen, setIsMassImportOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchesSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGroup =
        selectedGroup === 'all' || p.category_group === selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }, [places, searchTerm, selectedGroup]);

  const handleDelete = (place: Place) => {
    if (confirm(`Tem certeza que deseja excluir o local público "${place.name}"?`)) {
      store.deletePlace(place.id);
      onRefresh();
    }
  };

  const handleToggleActive = (place: Place) => {
    store.updatePlace(place.id, { is_active: !place.is_active });
    onRefresh();
  };

  const handleSyncZonaLeste = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);

      // 1. Ingestão local no store (garante atualização instantânea)
      const resImport = store.importPlaces(ZONA_LESTE_PLACES);

      // 2. Sincronização com o Supabase via API
      let cloudMsg = '';
      try {
        const response = await fetch('/api/places/sync-zonaleste', { method: 'POST' });
        const json = await response.json();
        if (json?.database_synced) {
          cloudMsg = ' e sincronizados no banco Supabase';
        }
      } catch (err) {
        console.warn('API cloud sync warning:', err);
      }

      setSyncMessage(
        `⚡ Sucesso! ${ZONA_LESTE_PLACES.length} equipamentos da Zona Leste SP carregados com fotos reais${cloudMsg}.`
      );
      onRefresh();
    } catch (err: any) {
      setSyncMessage(`❌ Erro ao sincronizar: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Sync Notification Banner */}
      {syncMessage && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
          <span>{syncMessage}</span>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-teal-700 hover:text-teal-900 text-xs underline font-normal"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#4FA6A6]/20 card-shadow">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center font-bold shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0E3B43]">
              Pontos de Interesse & Utilidade Pública ({places.length})
            </h2>
            <p className="text-xs text-[#537379]">
              Hospitais, UBS, escolas, parques, transporte e órgãos públicos que ancoram o guia local
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncZonaLeste}
            className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            title="Importar automaticamente todos os parques, UBSs, escolas e hospitais da Zona Leste com fotos reais"
          >
            <Sparkles className={`w-4 h-4 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando ZL...' : '⚡ Sincronizar ZL (Fotos Reais)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMassImportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0D9488] border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Importação em Massa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPlaceToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-teal-300" />
            <span>+ Novo Local</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-2xl border border-[#4FA6A6]/20 card-shadow">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#537379]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome, subcategoria ou endereço..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none"
          />
        </div>

        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] outline-none cursor-pointer"
        >
          <option value="all">Todos os Grupos de Categoria</option>
          {Object.entries(PLACE_CATEGORY_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {/* Places Table */}
      <div className="bg-white rounded-3xl border border-[#4FA6A6]/20 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F6F0] text-[#537379] font-bold border-b border-[#E8E4DA]">
              <tr>
                <th className="p-4">Local / Equipamento</th>
                <th className="p-4">Grupo</th>
                <th className="p-4">Endereço & Bairro</th>
                <th className="p-4">Horário & Contato</th>
                <th className="p-4">Fonte / Status</th>
                <th className="p-4">Ativo</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DA]">
              {filteredPlaces.length > 0 ? (
                filteredPlaces.map((place) => {
                  const meta = PLACE_CATEGORY_META[place.category_group] || PLACE_CATEGORY_META.outros;
                  const Icon = meta.icon;

                  return (
                    <tr key={place.id} className="hover:bg-[#F8F6F0]/60 transition-colors">
                      {/* Name & Subcategory */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-[#0E3B43] block text-sm">
                              {place.name}
                            </span>
                            <span className="text-[11px] text-[#537379] font-medium">
                              {place.subcategory || 'Utilidade Pública'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.bg}`}>
                          {meta.label}
                        </span>
                      </td>

                      {/* Address */}
                      <td className="p-4 text-[#537379]">
                        <div className="flex items-start gap-1 max-w-[220px]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#4FA6A6] mt-0.5" />
                          <span className="truncate">
                            {place.address}{place.number ? `, ${place.number}` : ''}
                            <br />
                            <strong className="text-[#0E3B43]">{place.neighborhood?.name || place.neighborhood_name || 'SP'}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Hours & Phone */}
                      <td className="p-4 text-[#537379]">
                        <div className="space-y-0.5">
                          {place.opening_hours && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-teal-600" />
                              <span className="truncate max-w-[140px]">{place.opening_hours}</span>
                            </span>
                          )}
                          {place.phone && (
                            <span className="text-[11px] font-bold text-[#0E3B43]">
                              {place.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Source & Verification */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-[#0E3B43] block">
                            {place.source_name || 'Oficial'}
                          </span>
                          {place.verification_status === 'verified' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              Oficial
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(place)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            place.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          {place.is_active ? '✓ Ativo' : 'Inativo'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/lugares/${place.slug}`}
                            target="_blank"
                            title="Ver página pública no guia"
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-teal-50 text-[#0E3B43] hover:text-[#0D9488] transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setPlaceToEdit(place);
                              setIsCreateModalOpen(true);
                            }}
                            title="Editar local"
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-blue-50 text-[#0E3B43] hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(place)}
                            title="Excluir local"
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-[#0E3B43] hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#537379]">
                    Nenhum ponto de interesse encontrado para os filtros informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MasterPlaceModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPlaceToEdit(null);
        }}
        placeToEdit={placeToEdit}
        onSuccess={onRefresh}
        neighborhoods={neighborhoods}
      />

      <MasterMassImportModal
        isOpen={isMassImportOpen}
        onClose={() => setIsMassImportOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};
