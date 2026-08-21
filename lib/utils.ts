import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  // If no country code, add 55 (Brazil)
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

export function getBusinessWhatsAppMessage(
  businessName: string,
  context?: 'product' | 'promo' | 'general' | 'quote' | 'property',
  itemTitle?: string
): string {
  if (context === 'product' && itemTitle) {
    const lower = itemTitle.toLowerCase();
    if (lower.includes('sobrado') || lower.includes('apartamento') || lower.includes('casa') || lower.includes('salão') || lower.includes('imóvel') || lower.includes('imovel')) {
      return `Olá! Vi o imóvel "${itemTitle}" na Vitriniza e gostaria de mais informações e agendar uma visita.`;
    }
    if (lower.includes('plano') || lower.includes('saúde') || lower.includes('saude') || lower.includes('convênio') || lower.includes('convenio') || lower.includes('odonto') || lower.includes('seguro')) {
      return `Olá! Vi a opção "${itemTitle}" na Vitriniza e gostaria de solicitar uma cotação personalizada sem compromisso.`;
    }
    if (lower.includes('instalação') || lower.includes('revisão') || lower.includes('diária') || lower.includes('faxina') || lower.includes('serviço') || lower.includes('eletricista') || lower.includes('reparo')) {
      return `Olá! Vi o serviço "${itemTitle}" na Vitriniza e gostaria de solicitar um orçamento e disponibilidade de agenda.`;
    }
    return `Olá! Vi "${itemTitle}" na Vitriniza e gostaria de saber mais informações e fazer um pedido.`;
  }
  if (context === 'promo' && itemTitle) {
    return `Olá! Vi a oportunidade "${itemTitle}" na Vitriniza e gostaria de aproveitar com você.`;
  }
  return `Olá! Encontrei o perfil de ${businessName} pela Vitriniza e gostaria de tirar algumas dúvidas e solicitar um atendimento.`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export interface CepAddressResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCep(cep: string): Promise<CepAddressResult | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!res.ok) return null;
    const data: CepAddressResult = await res.json();
    if (data.erro) return null;
    return data;
  } catch (err) {
    console.error('Erro ao consultar CEP:', err);
    return null;
  }
}

export function formatDatePtBr(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
