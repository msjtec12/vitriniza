'use client';

import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Sparkles, QrCode, Store } from 'lucide-react';

interface StoreQRCodeProps {
  businessName: string;
  businessSlug: string;
  businessLogoUrl: string;
  businessUrl: string;
  neighborhoodName?: string;
  categoryName?: string;
  size?: number;
  showDownloadBtn?: boolean;
  variant?: 'compact' | 'display_card';
}

export const StoreQRCode: React.FC<StoreQRCodeProps> = ({
  businessName,
  businessLogoUrl,
  businessUrl,
  neighborhoodName = 'Guaianases',
  categoryName,
  size = 180,
  showDownloadBtn = true,
  variant = 'compact',
}) => {
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${businessUrl}`
    : `https://vitriniza.com.br${businessUrl}`;

  const handleDownloadPNG = () => {
    if (!qrWrapperRef.current) return;
    const canvas = qrWrapperRef.current.querySelector('canvas');
    if (!canvas) return;

    // Create a high-res printable canvas display for table/counter stand
    const printCanvas = document.createElement('canvas');
    const ctx = printCanvas.getContext('2d');
    if (!ctx) return;

    // High-resolution export: 800 x 1100 px (3:4 ratio for printing)
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
    ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VITRINIZA', w / 2, 105);

    ctx.fillStyle = '#4FA6A6';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('O COMÉRCIO PERTO DE VOCÊ', w / 2, 145);

    // 3. Store Info Title
    ctx.fillStyle = '#0E3B43';
    ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(businessName, w / 2, 260);

    if (categoryName || neighborhoodName) {
      ctx.fillStyle = '#537379';
      ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${categoryName || 'Comércio Local'} • ${neighborhoodName} (SP)`, w / 2, 295);
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
    ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('📱 APONTE A CÂMERA DO CELULAR', w / 2, 905);

    ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Acesse nosso catálogo, ofertas e peça pelo WhatsApp', w / 2, 938);

    // 6. Trigger Download
    const pngUrl = printCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `display-balcao-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (variant === 'display_card') {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#4FA6A6]/30 card-shadow text-center flex flex-col items-center justify-between space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-xs font-bold text-[#0E3B43] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Display Oficial de Balcão & Mesa</span>
          </div>
          <h3 className="font-black text-lg sm:text-xl text-[#0E3B43]">{businessName}</h3>
          <p className="text-xs text-[#537379]">QR Code exclusivo com a logomarca da sua loja</p>
        </div>

        {/* QR Code Container with Logo in center */}
        <div ref={qrWrapperRef} className="p-4 bg-white rounded-2xl border-2 border-[#E8E4DA] shadow-md relative">
          <QRCodeCanvas
            value={fullUrl}
            size={size}
            level="H" // High error correction to allow logo
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
                    excavate: true, // Cutout background behind the logo
                  }
                : undefined
            }
          />
        </div>

        <p className="text-xs text-[#537379] max-w-xs leading-relaxed">
          Imprima e coloque no balcão, nas mesas ou na vitrine para os clientes abrirem seu cardápio e promoções no celular.
        </p>

        {showDownloadBtn && (
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Display de Balcão para Impressão (PNG)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <div ref={qrWrapperRef} className="p-3 bg-white rounded-2xl border border-[#E8E4DA] shadow-xs inline-block">
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

      <span className="text-[11px] text-[#537379] font-semibold">
        Aponte a câmera para abrir a vitrine
      </span>

      {showDownloadBtn && (
        <button
          type="button"
          onClick={handleDownloadPNG}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#F8F6F0] border border-[#4FA6A6]/40 text-xs font-bold text-[#0E3B43] transition-all shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-[#E36845]" />
          <span>Baixar Display com Logo (PNG)</span>
        </button>
      )}
    </div>
  );
};
