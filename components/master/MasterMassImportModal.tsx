'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
} from 'lucide-react';
import { Place, PlaceCategoryGroup } from '@/types';
import { store } from '@/lib/data/store';

interface MasterMassImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_JSON = `[
  {
    "name": "UBS Jardim Helena",
    "category_group": "saude",
    "subcategory": "UBS / Posto de Saúde",
    "address": "Rua Kumaki Aoki",
    "number": "785",
    "neighborhood_name": "Jardim Helena",
    "city_name": "São Paulo",
    "state_id": "SP",
    "postal_code": "08080-000",
    "latitude": -23.4981,
    "longitude": -46.4251,
    "opening_hours": "Seg a Sex 07h às 19h",
    "phone": "(11) 2561-2244",
    "source_name": "Prefeitura de SP / SMS",
    "source_url": "https://capital.sp.gov.br",
    "verification_status": "verified"
  },
  {
    "name": "Parque Chico Mendes",
    "category_group": "lazer",
    "subcategory": "Parque Municipal",
    "address": "Rua Cembira",
    "number": "1201",
    "neighborhood_name": "Vila Curuçá",
    "city_name": "São Paulo",
    "state_id": "SP",
    "postal_code": "08032-010",
    "latitude": -23.5098,
    "longitude": -46.4182,
    "opening_hours": "Todos os dias 06h às 18h",
    "phone": "(11) 2035-2244",
    "source_name": "SVMA",
    "source_url": "https://capital.sp.gov.br",
    "verification_status": "verified"
  }
]`;

const SAMPLE_CSV = `name;category_group;subcategory;address;number;neighborhood_name;city_name;postal_code;latitude;longitude;opening_hours;phone;source_name
UBS Vila Nova Curuçá;saude;UBS;Avenida Nordestina;3400;Vila Curuçá;São Paulo;08032-000;-23.5110;-46.4210;Seg a Sex 07h às 19h;(11) 2035-1100;Prefeitura SP
CEU Parque Veredas;educacao;CEU / Escola;Rua Daniel Muller;347;Itaim Paulista;São Paulo;08140-000;-23.5020;-46.3980;Seg a Sex 07h às 22h;(11) 2563-6000;SME SP`;

export const MasterMassImportModal: React.FC<MasterMassImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [rawText, setRawText] = useState('');
  const [previewRows, setPreviewRows] = useState<Partial<Place>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReport, setSuccessReport] = useState<{ inserted: number; updated: number } | null>(null);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    if (format === 'json') {
      setRawText(SAMPLE_JSON);
    } else {
      setRawText(SAMPLE_CSV);
    }
    setPreviewRows([]);
    setParseErrors([]);
    setSuccessReport(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setRawText(content);
        if (file.name.endsWith('.json')) setFormat('json');
        if (file.name.endsWith('.csv')) setFormat('csv');
      }
    };
    reader.readAsText(file);
  };

  const parseCsvText = (text: string): Partial<Place>[] => {
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Detect separator (; or ,)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine.split(separator).map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

    const records: Partial<Place>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map((v) => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 2) continue;

      const obj: any = {};
      headers.forEach((h, idx) => {
        const val = values[idx] || '';
        if (h === 'latitude' || h === 'longitude') {
          obj[h] = parseFloat(val.replace(',', '.')) || 0;
        } else {
          obj[h] = val;
        }
      });

      if (obj.name && obj.address) {
        records.push({
          ...obj,
          category_group: (obj.category_group as PlaceCategoryGroup) || 'outros',
          subcategory: obj.subcategory || 'Ponto de Interesse',
          verification_status: obj.verification_status || 'public_info',
          is_active: true,
        });
      }
    }

    return records;
  };

  const handlePreview = () => {
    setParseErrors([]);
    setSuccessReport(null);

    if (!rawText.trim()) {
      setParseErrors(['Por favor, cole os dados em formato JSON ou CSV para pré-visualizar.']);
      return;
    }

    try {
      if (format === 'json') {
        const parsed = JSON.parse(rawText);
        if (!Array.isArray(parsed)) {
          setParseErrors(['O JSON deve ser uma lista (Array) de objetos. Exemplo: [{"name": "..."}, ...]']);
          setPreviewRows([]);
          return;
        }

        const valid: Partial<Place>[] = [];
        const errs: string[] = [];

        parsed.forEach((item: any, idx: number) => {
          if (!item.name || !item.address) {
            errs.push(`Registro #${idx + 1}: "name" e "address" são obrigatórios.`);
          } else {
            valid.push({
              ...item,
              category_group: (item.category_group as PlaceCategoryGroup) || 'outros',
              subcategory: item.subcategory || 'Ponto de Interesse',
              verification_status: item.verification_status || 'verified',
              is_active: item.is_active ?? true,
            });
          }
        });

        setPreviewRows(valid);
        setParseErrors(errs);
      } else {
        const parsed = parseCsvText(rawText);
        if (parsed.length === 0) {
          setParseErrors(['Não foi possível extrair registros válidos do CSV. Verifique os cabeçalhos.']);
        }
        setPreviewRows(parsed);
      }
    } catch (err: any) {
      setParseErrors([`Erro ao processar sintaxe: ${err.message}`]);
      setPreviewRows([]);
    }
  };

  const handleExecuteImport = () => {
    if (previewRows.length === 0) {
      alert('Nenhum registro validado para importar. Clique em "Processar & Pré-visualizar" primeiro.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = store.importPlaces(previewRows);
      setSuccessReport({ inserted: result.inserted, updated: result.updated });
      setIsProcessing(false);
      onSuccess();
    } catch (err: any) {
      setIsProcessing(false);
      alert('Erro durante importação: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#4FA6A6]/30 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0E3B43] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E36845] text-white flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">
                Importação em Massa de Pontos de Interesse
              </h3>
              <p className="text-[11px] text-stone-300">
                Cadastre dezenas ou centenas de UBS, escolas, parques e estações via JSON ou CSV
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Format selector & template helper */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8F6F0] p-3.5 rounded-2xl border border-[#E8E4DA]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormat('json');
                  setPreviewRows([]);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  format === 'json'
                    ? 'bg-[#0E3B43] text-white shadow-xs'
                    : 'bg-white text-[#0E3B43] border border-[#E8E4DA]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Formato JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormat('csv');
                  setPreviewRows([]);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  format === 'csv'
                    ? 'bg-[#0E3B43] text-white shadow-xs'
                    : 'bg-white text-[#0E3B43] border border-[#E8E4DA]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Formato CSV (Planilha)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-[#E8E4DA] text-xs font-bold text-[#0E3B43] cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#4FA6A6]" />
                <span>Carregar Arquivo</span>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-xs font-bold text-teal-800 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Carregar Exemplo Modelo</span>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#0E3B43]">
                Cole abaixo os dados em {format.toUpperCase()}:
              </label>
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setPreviewRows([]);
                    setParseErrors([]);
                  }}
                  className="text-[11px] text-red-600 hover:underline font-bold"
                >
                  Limpar texto
                </button>
              )}
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={
                format === 'json'
                  ? '[{"name": "UBS Jardim Helena", "category_group": "saude", "address": "..."}, ...]'
                  : 'name;category_group;subcategory;address;number;neighborhood_name;...\nUBS Modelo;saude;UBS;Rua Exemplo;123;Bairro;...'
              }
              className="w-full p-4 font-mono text-xs bg-[#F8F6F0] rounded-2xl border border-[#E8E4DA] text-[#0E3B43] outline-none"
            />
          </div>

          {/* Action: Parse & Preview */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreview}
              className="px-5 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold shadow-sm transition-all"
            >
              Processar & Pré-visualizar Registros
            </button>

            {previewRows.length > 0 && (
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                ✓ {previewRows.length} locais prontos para importação
              </span>
            )}
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                <AlertTriangle className="w-4 h-4" />
                <span>Avisos de processamento:</span>
              </div>
              <ul className="text-xs text-rose-700 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Live Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-[#0E3B43] uppercase tracking-wider">
                  Pré-visualização dos Registros ({previewRows.length})
                </h4>
              </div>

              <div className="border border-[#E8E4DA] rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F6F0] text-[#537379] font-bold border-b border-[#E8E4DA] sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Nome do Local</th>
                      <th className="p-2.5">Grupo</th>
                      <th className="p-2.5">Subcategoria</th>
                      <th className="p-2.5">Endereço & Bairro</th>
                      <th className="p-2.5">Coordenadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DA]">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#F8F6F0]/50">
                        <td className="p-2.5 text-[#537379] font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-[#0E3B43]">{row.name}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                            {row.category_group || 'outros'}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#537379]">{row.subcategory}</td>
                        <td className="p-2.5 text-[#537379] truncate max-w-[200px]">
                          {row.address}{row.number ? `, ${row.number}` : ''} {row.neighborhood_name ? `(${row.neighborhood_name})` : ''}
                        </td>
                        <td className="p-2.5 text-[#537379] font-mono text-[11px]">
                          {row.latitude?.toFixed(4)}, {row.longitude?.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success Report */}
          {successReport && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Importação finalizada com sucesso!</strong> {successReport.inserted} novos locais criados e {successReport.updated} atualizados.
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Concluir
              </button>
            </div>
          )}

          {/* Footer CTAs */}
          <div className="pt-4 border-t border-[#E8E4DA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={previewRows.length === 0 || isProcessing}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                previewRows.length === 0 || isProcessing
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#E36845] hover:bg-[#F49C6B] text-white cursor-pointer active:scale-95'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Importando...'
                  : `Confirmar e Importar ${previewRows.length} Locais`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
