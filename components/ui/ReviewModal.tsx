'use client';

import React, { useState } from 'react';
import { X, Star, CheckCircle, Send } from 'lucide-react';
import { store } from '@/lib/data/store';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      alert('Por favor, preencha seu nome e comentário.');
      return;
    }

    store.submitReview({
      business_id: businessId,
      author_name: authorName.trim(),
      rating,
      comment: comment.trim(),
    });

    setSubmitted(true);
    onReviewSubmitted?.();
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setAuthorName('');
      setComment('');
      setRating(5);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E3B43]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E4DA] shadow-2xl">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full text-[#537379] hover:bg-[#F8F6F0] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <CheckCircle className="w-14 h-14 text-[#4FA6A6] mb-3" />
            <h3 className="text-xl font-black text-[#0E3B43] mb-1">Avaliação enviada!</h3>
            <p className="text-xs text-[#537379]">Obrigado por apoiar e avaliar o comércio do seu bairro.</p>
          </div>
        ) : (
          <div>
            <h3 className="font-black text-lg text-[#0E3B43] mb-1">Avaliar Estabelecimento</h3>
            <p className="text-xs text-[#537379] mb-4">
              Conte sua experiência em <strong className="text-[#0E3B43]">{businessName}</strong>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Selector */}
              <div className="flex flex-col items-center p-4 bg-[#F8F6F0] rounded-2xl border border-[#4FA6A6]/20">
                <span className="text-xs font-bold text-[#537379] mb-2">Sua nota geral</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform active:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-stone-200 text-stone-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Seu Nome *</label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E3B43] mb-1">Seu Comentário *</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="O que você mais gostou no atendimento, comida ou serviço?"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E4DA] focus:border-[#E36845] text-sm text-[#0E3B43] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#E36845] hover:bg-[#F49C6B] text-white text-sm font-bold shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Publicar Avaliação</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
