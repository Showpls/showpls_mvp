import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { 
  ShoppingBag, 
  Building, 
  Calendar, 
  Heart, 
  Search,
  Camera,
  Video,
  Radio,
  ArrowRight,
  Star
} from "lucide-react";
import type { OrderTemplate } from "@shared/schema";

interface OrderTemplatesProps {
  onTemplateSelect: (template: OrderTemplate) => void;
  className?: string;
}

const TEMPLATE_CATEGORIES = {
  'товар': { icon: ShoppingBag, color: 'bg-blue-500', name: 'product' },
  'недвижимость': { icon: Building, color: 'bg-green-500', name: 'property' },
  'мероприятие': { icon: Calendar, color: 'bg-purple-500', name: 'event' },
  'ностальгия': { icon: Heart, color: 'bg-pink-500', name: 'nostalgia' },
};

const MEDIA_TYPE_ICONS = {
  'photo': Camera,
  'video': Video,
  'live': Radio,
};

export function OrderTemplates({ onTemplateSelect, className = "" }: OrderTemplatesProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: templates, isLoading } = useQuery<OrderTemplate[]>({
    queryKey: ['/api/order-templates'],
    select: (data) => {
      let filtered = data || [];
      
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(template => template.category === selectedCategory);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(template => 
          template.title.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query)
        );
      }
      
      return filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    }
  });

  const formatTON = (nanoTon: string): string => {
    const ton = Number(nanoTon) / 1e9;
    return ton.toFixed(2);
  };

  if (isLoading) {
    return (
      <Card className={`glass-panel ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-bg-secondary rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-panel ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-brand-primary" />
          {t('orderTemplates.title')}
        </CardTitle>
        <p className="text-sm text-text-muted">
          {t('orderTemplates.subtitle')}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder={t('orderTemplates.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="whitespace-nowrap"
          >
            {t('common.all')}
          </Button>
          {Object.entries(TEMPLATE_CATEGORIES).map(([category, config]) => {
            const IconComponent = config.icon;
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                <IconComponent className="w-4 h-4 mr-1" />
                {t(`categories.${config.name}`)}
              </Button>
            );
          })}
        </div>

        {/* Templates Grid */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {templates?.map((template) => {
            const categoryConfig = TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES];
            const CategoryIcon = categoryConfig?.icon || ShoppingBag;
            const MediaIcon = MEDIA_TYPE_ICONS[template.mediaType];
            
            return (
              <Card
                key={template.id}
                className="cursor-pointer hover:bg-bg-secondary/50 transition-colors border-border/50"
                onClick={() => onTemplateSelect(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${categoryConfig?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-text-primary text-sm leading-tight">
                          {template.title}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-text-muted flex-shrink-0 ml-2" />
                      </div>

                      <p className="text-xs text-text-muted line-clamp-2">
                        {template.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <MediaIcon className="w-3 h-3 mr-1" />
                            {t(`mediaTypes.${template.mediaType}`)}
                          </Badge>
                          
                          {template.usageCount && template.usageCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {template.usageCount} {t('orderTemplates.uses')}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-text-muted">
                          {formatTON(template.budgetRange.min)}-{formatTON(template.budgetRange.max)} TON
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {templates?.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-text-muted text-sm">
              {searchQuery 
                ? t('orderTemplates.noResults')
                : t('orderTemplates.noTemplates')
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}