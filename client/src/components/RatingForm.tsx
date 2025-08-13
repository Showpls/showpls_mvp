import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";

interface RatingFormProps {
  orderId: string;
  toUserId: string;
  onSuccess: () => void;
}

export function RatingForm({ orderId, toUserId, onSuccess }: RatingFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const submitRating = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-auth': JSON.stringify({
            id: 'demo_user_123',
            username: 'demo_user',
            first_name: 'Demo',
            language_code: 'en'
          })
        },
        body: JSON.stringify({
          orderId,
          toUserId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      onSuccess();
    }
  });

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0) {
      submitRating.mutate();
    }
  };

  return (
    <Card className="glass-panel border-brand-primary/20">
      <CardContent className="p-4">
        <h4 className="font-semibold mb-3 text-center">
          {t('rating.title')}
        </h4>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-400'
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('rating.commentPlaceholder')}
            className="bg-bg-primary border-brand-primary/30"
            rows={3}
          />

          <Button
            type="submit"
            disabled={rating === 0 || submitRating.isPending}
            className="w-full gradient-bg text-white font-medium"
          >
            {submitRating.isPending 
              ? t('rating.submitting')
              : t('rating.submitAndApprove')
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
