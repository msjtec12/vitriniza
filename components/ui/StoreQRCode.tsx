'use client';

import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Sparkles, QrCode, Store, Copy, Check, Share2, MessageSquare, Radio } from 'lucide-react';
import { WhatsAppSolidIcon } from '@/components/ui/Icons';
import { buildWhatsAppUrl } from '@/lib/utils';

interface StoreQRCodeProps {
  businessName: string;
  businessSlug: string;
  businessLogoUrl: string;
  businessUrl: string;
  neighborhoodName?: string;
  categoryName?: string;
  size?: number;
  showDownloadBtn?: boolean;
  variant?: 'compact' | 'display_card' | 'full_hub';
  onToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const StoreQRCode: React.FC<StoreQRCodeProps> = ({
  businessName,
  businessLogoUrl,
  businessUrl,
  neighborhoodName = '',
  categoryName,
  size = 140,
  showDownloadBtn = true,
  variant = 'compact',
  onToast,
}) => {
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${businessUrl}`
    : `https://vitriniza.vercel.app${businessUrl}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      if (onToast) onToast('Link copiado com sucesso!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${businessName} na Vitriniza`,
        text: `Conheça ${businessName}${neighborhoodName ? ' (' + neighborhoodName + ')' : ''}! Veja produtos e contatos:\n${fullUrl}`,
        url: fullUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadOnlyQR = () => {
    if (!qrWrapperRef.current) return;
    const canvas = qrWrapperRef.current.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qrcode-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (onToast) onToast('QR Code baixado com sucesso!', 'success');
  };

  const handleDownloadPNG = () => {
    if (!qrWrapperRef.current) return;
    const canvas = qrWrapperRef.current.querySelector('canvas');
    if (!canvas) return;

    // High-resolution export: 800 x 1050 px (3:4 ratio for printing)
    const printCanvas = document.createElement('canvas');
    const ctx = printCanvas.getContext('2d');
    if (!ctx) return;

    const w = 800;
    const h = 1050;
    printCanvas.width = w;
    printCanvas.height = h;

    // 1. Background in Off-White (#F8F6F0)
    ctx.fillStyle = '#F8F6F0';
    ctx.fillRect(0, 0, w, h);

    // 2. Decorative Top Header in Dark Teal (#0E3B43)
    ctx.fillStyle = '#0E3B43';
    ctx.beginPath();
    ctx.roundRect(40, 40, w - 80, 160, 32);
    ctx.fill();

    // Top Header Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VITRINIZA', w / 2, 105);

    ctx.fillStyle = '#4FA6A6';
    ctx.font = '700 18px sans-serif';
    ctx.fillText('O COMÉRCIO PERTO DE VOCÊ', w / 2, 145);

    // 3. Store Info Title
    ctx.fillStyle = '#0E3B43';
    ctx.font = '900 38px sans-serif';
    ctx.fillText(businessName, w / 2, 260);

    if (categoryName || neighborhoodName) {
      ctx.fillStyle = '#537379';
      ctx.font = '600 20px sans-serif';
      const locBadge = [categoryName, neighborhoodName].filter(Boolean).join(' • ');
      ctx.fillText(locBadge, w / 2, 295);
    }

    // 4. White Card for QR Code
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E8E4DA';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(160, 340, 480, 480, 40);
    ctx.fill();
    ctx.stroke();

    // Draw the generated QR Code Canvas in the center
    ctx.drawImage(canvas, 200, 380, 400, 400);

    // 5. Instruction Bottom Banner
    ctx.fillStyle = '#E36845';
    ctx.beginPath();
    ctx.roundRect(100, 860, w - 200, 100, 28);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('📱 APONTE A CÂMERA DO CELULAR', w / 2, 905);

    ctx.font = '600 17px sans-serif';
    ctx.fillText('Conheça nossa vitrine, produtos e faça seu pedido', w / 2, 938);

    // 6. Trigger Download
    const pngUrl = printCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `display-balcao-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    if (onToast) onToast('Placa de balcão baixada para impressão!', 'success');
  };

  const handleRequestPhysicalStand = () => {
    const text = `Olá! Sou do comércio *${businessName}*${neighborhoodName ? ' em ' + neighborhoodName : ''} e gostaria de solicitar a *Placa Física de Balcão* da Vitriniza para o meu estabelecimento.`;
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // 1. FULL DISCLOSURE HUB (Used exclusively in /painel tab qrcode)
  if (variant === 'full_hub') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive Printable Stand Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[280px] bg-[#F8F6F0] border-2 border-[#E8E4DA] rounded-3xl p-5 text-center shadow-lg space-y-3 relative">
              <div className="bg-[#0E3B43] text-white py-2 px-3 rounded-xl space-y-0.5">
                <span className="font-black text-xs tracking-wider">VITRINIZA</span>
                <p className="text-[9px] text-[#4FA6A6] font-bold">O COMÉRCIO PERTO DE VOCÊ</p>
              </div>

              <div>
                <h4 className="font-black text-sm text-[#0E3B43] truncate">{businessName}</h4>
                <p className="text-[10px] text-[#537379]">{neighborhoodName} - SP</p>
              </div>

              <div ref={qrWrapperRef} className="p-3 bg-white rounded-2xl border border-[#E8E4DA] shadow-xs inline-block">
                <QRCodeCanvas
                  value={fullUrl}
                  size={160}
                  level="H"
                  marginSize={2}
                  fgColor="#0E3B43"
                  bgColor="#FFFFFF"
                  imageSettings={
                    businessLogoUrl
                      ? {
                          src: businessLogoUrl,
                          x: undefined,
                          y: undefined,
                          height: 38,
                          width: 38,
                          opacity: 1,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>

              <div className="bg-[#E36845] text-white py-1.5 px-3 rounded-xl">
                <span className="font-black text-[10px] block">📱 APONTE A CÂMERA DO CELULAR</span>
                <span className="text-[8px] opacity-90">Acesse nossa vitrine e faça seu pedido</span>
              </div>
            </div>
          </div>

          {/* Right: Actions and Disclosure Tools */}
          <div className="md:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-2">
              <label className="block text-xs font-bold text-[#0E3B43]">Link Público da Sua Vitrine</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullUrl}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none font-medium truncate select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="py-3 px-4 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Placa para Impressão</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadOnlyQR}
                className="py-3 px-4 rounded-2xl bg-white hover:bg-[#F8F6F0] border border-[#4FA6A6]/40 text-[#0E3B43] text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#4FA6A6]" />
                <span>Baixar Apenas QR Code</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleShare}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border border-[#E8E4DA] text-[#0E3B43] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#E36845]" />
                <span>Compartilhar Link</span>
              </button>

              <button
                type="button"
                onClick={handleRequestPhysicalStand}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border border-[#E8E4DA] text-[#0E3B43] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Solicitar Placa Física</span>
              </button>
            </div>

            {/* NFC Preparation Banner */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3 text-xs text-[#537379]">
              <div className="w-8 h-8 rounded-xl bg-[#4FA6A6]/15 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 text-[#0E3B43]" />
              </div>
              <div>
                <span className="font-bold text-[#0E3B43] block">Aproximação por NFC (Em breve)</span>
                <span className="text-[11px]">Placas inteligentes de balcão com chip de aproximação direta para celular.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. DISPLAY CARD
  if (variant === 'display_card') {
    return (
      <div className="bg-white rounded-3xl p-6 border border-[#4FA6A6]/20 card-shadow text-center flex flex-col items-center justify-between space-y-4 w-full">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-xs font-bold text-[#0E3B43] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Display Oficial de Balcão</span>
          </div>
          <h3 className="font-black text-base text-[#0E3B43] truncate max-w-xs">{businessName}</h3>
          <p className="text-xs text-[#537379]">QR Code exclusivo da vitrine</p>
        </div>

        <div ref={qrWrapperRef} className="p-3 bg-white rounded-2xl border-2 border-[#E8E4DA] shadow-md inline-block">
          <QRCodeCanvas
            value={fullUrl}
            size={size}
            level="H"
            marginSize={2}
            fgColor="#0E3B43"
            bgColor="#FFFFFF"
            imageSettings={
              businessLogoUrl
                ? {
                    src: businessLogoUrl,
                    x: undefined,
                    y: undefined,
                    height: Math.floor(size * 0.24),
                    width: Math.floor(size * 0.24),
                    opacity: 1,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>

        {showDownloadBtn && (
          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="w-full py-2.5 px-4 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Baixar Display para Impressão
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. COMPACT SIDEBAR CARD (Default - used in Business Showcase Sidebar & ShareModal)
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#4FA6A6]/20 card-shadow text-center flex flex-col items-center space-y-3 w-full">
      <div className="space-y-0.5">
        <div className="inline-flex items-center gap-1 text-[11px] font-black text-[#0E3B43] uppercase tracking-wider">
          <QrCode className="w-3.5 h-3.5 text-[#E36845]" />
          <span>QR Code da Vitrine</span>
        </div>
        <p className="text-[11px] text-[#537379]">Aponte a câmera para abrir no celular</p>
      </div>

      <div ref={qrWrapperRef} className="p-3 bg-white rounded-2xl border-2 border-[#E8E4DA] shadow-xs inline-block">
        <QRCodeCanvas
          value={fullUrl}
          size={140}
          level="H"
          marginSize={2}
          fgColor="#0E3B43"
          bgColor="#FFFFFF"
          imageSettings={
            businessLogoUrl
              ? {
                  src: businessLogoUrl,
                  x: undefined,
                  y: undefined,
                  height: 34,
                  width: 34,
                  opacity: 1,
                  excavate: true,
                }
              : undefined
          }
        />
      </div>

      {showDownloadBtn && (
        <div className="w-full space-y-1.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="w-full py-2.5 px-3 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Placa de Balcão</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-full py-2 px-3 rounded-xl bg-[#F8F6F0] hover:bg-stone-100 border border-[#E8E4DA] text-[#0E3B43] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#4FA6A6]" />
            <span>Compartilhar Vitrine</span>
          </button>
        </div>
      )}
    </div>
  );
};
