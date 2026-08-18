'use client';

import React from 'react';
import { Star, User, CheckCircle } from 'lucide-react';
import { Review } from '@/types';
import { formatDate } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#4FA6A6]/20 card-shadow flex flex-col justify-between">
      <div>
        {/* Author Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F8F6F0] border border-[#E8E4DA] text-[#E36845] flex items-center justify-center font-bold text-sm">
              {review.author_name ? review.author_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-[#0E3B43]">{review.author_name}</span>
                <CheckCircle className="w-3.5 h-3.5 text-[#4FA6A6] fill-[#4FA6A6]/20" />
              </div>
              <span className="text-[11px] text-[#537379]">{formatDate(review.created_at)}</span>
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= review.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-stone-200 text-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Comment */}
        <p className="text-xs sm:text-sm text-[#0E3B43]/85 leading-relaxed">
          &ldquo;{review.comment}&rdquo;
        </p>
      </div>
    </div>
  );
};
