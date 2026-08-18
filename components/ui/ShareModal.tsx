'use client';

import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, Check, Share2, Download, MessageCircle } from 'lucide-react';
import { store } from '@/lib/data/store';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessSlug: string;
  businessUrl: string;
  businessId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  businessName,
  businessUrl,
  businessId,
}) => {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${businessUrl}`
    : `https://vitriniza.com.br${businessUrl}`;

  const shareText = `Conheça ${businessName} na Vitriniza - O comércio perto de você! ${fullUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    store.logAnalyticsEvent(businessId, 'share_click', { method: 'copy_link' });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    store.logAnalyticsEvent(businessId, 'share_click', { method: 'whatsapp' });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleDownloadQrCode = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode-${businessName.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E3B43]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-[#E8E4DA] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full text-[#537379] hover:bg-[#F8F6F0] hover:text-[#0E3B43] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#4FA6A6]/15 text-[#0E3B43] flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5 text-[#E36845]" />
          </div>
          <div>
            <h3 className="font-black text-lg text-[#0E3B43]">Compartilhar Vitrine</h3>
            <p className="text-xs text-[#537379]">{businessName}</p>
          </div>
        </div>

        {/* QR Code Preview */}
        <div className="flex flex-col items-center justify-center p-5 bg-[#F8F6F0] rounded-2xl border border-[#4FA6A6]/20 mb-5">
          <div ref={qrRef} className="p-3 bg-white rounded-xl shadow-xs border border-[#E8E4DA]">
            <QRCodeCanvas
              value={fullUrl}
              size={160}
              level="H"
              marginSize={2}
              fgColor="#0E3B43"
            />
          </div>
          <span className="text-[11px] text-[#537379] mt-2 font-semibold">
            Aponte a câmera do celular para abrir
          </span>

          <button
            type="button"
            onClick={handleDownloadQrCode}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-[#4FA6A6]/40 text-xs font-bold text-[#0E3B43] transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Baixar QR Code para balcão (PNG)</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-bold shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Enviar pelo WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F8F6F0] hover:bg-white border border-[#E8E4DA] text-[#0E3B43] text-sm font-bold transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#4FA6A6]" />
                <span className="text-[#0E3B43]">Link copiado com sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#537379]" />
                <span>Copiar link da página</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
