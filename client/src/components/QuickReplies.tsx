import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Clock, MapPin, Camera, MessageSquare, Star } from "lucide-react";

interface QuickRepliesProps {
  onReplySelect: (message: string) => void;
  orderStatus?: string;
  className?: string;
}

const QUICK_REPLIES = {
  status_update: [
    { key: 'heading_to_location', icon: MapPin, color: 'bg-blue-500' },
    { key: 'at_location', icon: MapPin, color: 'bg-green-500' },
    { key: 'taking_photos', icon: Camera, color: 'bg-purple-500' },
    { key: 'almost_done', icon: Clock, color: 'bg-yellow-500' },
    { key: 'completed', icon: Star, color: 'bg-emerald-500' },
  ],
  eta: [
    { key: 'eta_5_min', icon: Clock, color: 'bg-orange-500' },
    { key: 'eta_10_min', icon: Clock, color: 'bg-orange-500' },
    { key: 'eta_20_min', icon: Clock, color: 'bg-red-500' },
    { key: 'running_late', icon: Clock, color: 'bg-red-600' },
  ],
  clarification: [
    { key: 'show_price_tag', icon: Camera, color: 'bg-indigo-500' },
    { key: 'specific_angle', icon: Camera, color: 'bg-indigo-500' },
    { key: 'better_lighting', icon: Camera, color: 'bg-indigo-500' },
    { key: 'confirm_location', icon: MapPin, color: 'bg-teal-500' },
  ]
};

export function QuickReplies({ onReplySelect, orderStatus, className = "" }: QuickRepliesProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('status_update');

  const handleReplyClick = (replyKey: string) => {
    const message = t(`quickReplies.${replyKey}`);
    onReplySelect(message);
  };

  const getCategoryReplies = () => {
    const category = activeCategory as keyof typeof QUICK_REPLIES;
    return QUICK_REPLIES[category] || [];
  };

  return (
    <Card className={`glass-panel ${className}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">
            {t('chat.quickReplies')}
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg">
          {Object.keys(QUICK_REPLIES).map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`flex-1 text-xs ${
                activeCategory === category
                  ? 'bg-brand-primary text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t(`chat.categories.${category}`)}
            </Button>
          ))}
        </div>

        {/* Quick Reply Buttons */}
        <div className="grid grid-cols-1 gap-2">
          {getCategoryReplies().map((reply) => {
            const IconComponent = reply.icon;
            return (
              <Button
                key={reply.key}
                variant="outline"
                size="sm"
                onClick={() => handleReplyClick(reply.key)}
                className="justify-start h-auto py-2 px-3 text-left hover:bg-bg-secondary/50 border-border/50"
              >
                <div className={`w-2 h-2 rounded-full ${reply.color} mr-3 flex-shrink-0`} />
                <IconComponent className="w-4 h-4 mr-2 text-text-muted" />
                <span className="text-sm text-text-primary">
                  {t(`quickReplies.${reply.key}`)}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Custom Quick Reply Input */}
        <div className="pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-text-muted hover:text-text-primary"
            onClick={() => onReplySelect('')}
          >
            + {t('chat.customMessage')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}