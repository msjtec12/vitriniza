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

export function getBusinessWhatsAppMessage(businessName: string, context?: 'product' | 'promo' | 'general', itemTitle?: string): string {
  if (context === 'product' && itemTitle) {
    return `Olá! Vi o produto "${itemTitle}" na Vitriniza e gostaria de saber mais informações e fazer um pedido.`;
  }
  if (context === 'promo' && itemTitle) {
    return `Olá! Vi a oferta "${itemTitle}" na Vitriniza e gostaria de aproveitar esta promoção.`;
  }
  return `Olá! Encontrei a ${businessName} pela Vitriniza e gostaria de mais informações.`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
