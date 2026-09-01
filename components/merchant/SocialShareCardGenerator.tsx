'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, Copy, Check, Sparkles, Image as ImageIcon, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { WhatsAppSolidIcon } from '@/components/ui/Icons';
import { Business } from '@/types';
import { buildWhatsAppUrl } from '@/lib/utils';

interface SocialShareCardGeneratorProps {
  business: Business;
  onToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const SocialShareCardGenerator: React.FC<SocialShareCardGeneratorProps> = ({
  business,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${business.state_id.toLowerCase()}/${business.city?.slug || 'sao-paulo'}/${business.neighborhood?.slug || 'guaianases'}/${business.slug}`
    : `https://vitriniza.vercel.app/sp/sao-paulo/guaianases/${business.slug}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      if (onToast) onToast('Link da vitrine copiado para a área de transferência!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Conheça a vitrine digital da *${business.name}* na Vitriniza Guaianases! Veja nossos produtos, serviços e horários:\n${fullUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDownloadSocialImage = () => {
    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350; // Instagram 4:5 Portrait format
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsGenerating(false);
        return;
      }

      // Background Gradient (Dark Petrol to Deep Green)
      const grad = ctx.createLinearGradient(0, 0, 0, 1350);
      grad.addColorStop(0, '#0E3B43');
      grad.addColorStop(1, '#08262C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Top Decorative Accent
      ctx.fillStyle = '#E36845';
      ctx.fillRect(0, 0, 1080, 20);

      // Platform Badge
      ctx.fillStyle = '#4FA6A6';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VITRINIZA • DESCOBERTA LOCAL', 540, 120);

      ctx.fillStyle = '#F8F6F0';
      ctx.font = '900 64px sans-serif';
      ctx.fillText('Estamos no Bairro!', 540, 210);

      ctx.fillStyle = '#A3C6C4';
      ctx.font = '500 34px sans-serif';
      ctx.fillText('Conheça nossa vitrine digital completa', 540, 270);

      // Central Card Background
      ctx.fillStyle = '#F8F6F0';
      ctx.beginPath();
      ctx.roundRect(140, 330, 800, 780, 48);
      ctx.fill();

      // Store Name inside Card
      ctx.fillStyle = '#0E3B43';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(business.name.toUpperCase(), 540, 420);

      ctx.fillStyle = '#537379';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`${business.neighborhood?.name || 'Guaianases'} • São Paulo/SP`, 540, 470);

      // Draw QR Code from hidden element
      const qrCanvas = qrRef.current?.querySelector('canvas');
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, 340, 520, 400, 400);
      }

      // Action Text below QR
      ctx.fillStyle = '#0E3B43';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('Aponte a câmera do seu celular', 540, 980);

      ctx.fillStyle = '#E36845';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('e fale direto pelo WhatsApp', 540, 1030);

      // Footer Platform Link
      ctx.fillStyle = '#F8F6F0';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('vitriniza.vercel.app', 540, 1220);

      ctx.fillStyle = '#A3C6C4';
      ctx.font = 'normal 24px sans-serif';
      ctx.fillText('A vitrine digital do seu bairro', 540, 1265);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `vitriniza-${business.slug}-divulgacao.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (onToast) onToast('Arte para redes sociais baixada com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Erro ao gerar imagem para download.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#4FA6A6]/20 card-shadow space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4FA6A6]/15 text-[#0E3B43] text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E36845]" />
            <span>Material de Divulgação</span>
          </div>
          <h3 className="font-black text-xl text-[#0E3B43]">Compartilhar Minha Vitrine</h3>
          <p className="text-xs text-[#537379]">
            Gere artes prontas para postar no Instagram, Facebook e WhatsApp anunciando sua vitrine para a vizinhança.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSocialImage}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-xs font-black shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Gerando arte...' : 'Baixar Imagem (Instagram/Status)'}</span>
          </button>
        </div>
      </div>

      {/* Visual Live Preview Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Card Preview */}
        <div className="md:col-span-6 flex justify-center">
          <div className="w-full max-w-[320px] aspect-[4/5] rounded-3xl bg-gradient-to-b from-[#0E3B43] to-[#08262C] p-5 text-center text-white flex flex-col justify-between shadow-2xl border-4 border-[#4FA6A6]/30 relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#4FA6A6]">
                Vitriniza • Descoberta Local
              </span>
              <h4 className="font-black text-lg text-white">Agora no seu Bairro!</h4>
              <p className="text-[11px] text-[#A3C6C4]">Conheça nossa vitrine digital</p>
            </div>

            {/* Inner White Container */}
            <div className="bg-[#F8F6F0] rounded-2xl p-4 text-[#0E3B43] space-y-2 shadow-lg">
              <h5 className="font-black text-sm uppercase truncate">{business.name}</h5>
              <p className="text-[10px] font-bold text-[#537379]">
                {business.neighborhood?.name || 'Guaianases'} - SP
              </p>

              <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl shadow-xs flex items-center justify-center">
                <QRCodeCanvas
                  value={fullUrl}
                  size={96}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="text-[10px] font-black text-[#E36845]">Aponte a câmera e fale conosco</p>
            </div>

            <div className="text-[10px] text-[#A3C6C4] font-medium">
              vitriniza.vercel.app • Guaianases
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons & Links */}
        <div className="md:col-span-6 space-y-4">
          <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#E8E4DA] space-y-2">
            <label className="block text-xs font-bold text-[#0E3B43]">Link Direto da Sua Vitrine</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E8E4DA] text-xs text-[#0E3B43] outline-none font-medium truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <WhatsAppSolidIcon className="w-4 h-4 fill-white" />
              <span>Enviar no WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSocialImage}
              disabled={isGenerating}
              className="py-3 px-4 rounded-2xl bg-[#0E3B43] hover:bg-[#154E58] text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#4FA6A6]" />
              <span>Baixar Arte em Imagem</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>💡 Dica de Divulgação:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Poste a imagem nos stories do seu Instagram ou no status do seu WhatsApp. Os clientes poderão escanear o QR Code ou clicar no seu link para ver seus produtos e fazer pedidos!
            </p>
          </div>
        </div>
      </div>

      {/* Hidden QR container for canvas export */}
      <div ref={qrRef} className="hidden">
        <QRCodeCanvas value={fullUrl} size={400} level="H" includeMargin={false} />
      </div>
    </div>
  );
};
