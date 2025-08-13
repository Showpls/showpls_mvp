import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  X,
  Camera,
  Video,
  Radio,
  MapPin
} from "lucide-react";
import { insertOrderSchema } from "@shared/schema";
import { getAuthToken } from "@/lib/auth";

// Use a local schema shaped for the UI, convert to API before submit
const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  mediaType: z.enum(['photo', 'video', 'live']),
  budgetTon: z.string().regex(/^\d+(\.\d+)?$/),
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateRequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRequestForm({ onClose, onSuccess }: CreateRequestFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMediaType, setSelectedMediaType] = useState<'photo' | 'video' | 'live'>('photo');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      mediaType: 'photo',
      budgetTon: '2.5',
      lat: 40.7589, // Default to Times Square
      lng: -73.9851,
      address: 'Times Square, New York, NY, USA',
    },
  });

  const createOrder = useMutation({
    mutationFn: async (data: FormData) => {
      const token = getAuthToken();
      const budgetNanoTon = Math.floor(parseFloat(data.budgetTon) * 1e9).toString();

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          mediaType: data.mediaType,
          budgetNanoTon,
          location: {
            lat: data.lat,
            lng: data.lng,
            address: data.address,
          },
          isSampleOrder: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      onSuccess();
    },
  });

  const onSubmit = (data: FormData) => {
    createOrder.mutate({
      ...data,
      mediaType: selectedMediaType,
    });
  };

  const fillSampleData = () => {
    form.setValue('title', 'Dubai Mall Live Stream');
    form.setValue('description', 'Need a 10-minute live stream of the Dubai Mall fountain show for a virtual event presentation.');
    form.setValue('budgetTon', '5.0');
    setSelectedMediaType('live');
  };

  return (
    <Card className="glass-panel border-brand-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center">
            <Plus className="w-5 h-5 text-brand-primary mr-2" />
            {t('createRequest.title')}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('createRequest.title')}
            </label>
            <Input
              {...form.register('title')}
              placeholder={t('createRequest.titlePlaceholder')}
              className="bg-panel border-brand-primary/30"
            />
            {form.formState.errors.title && (
              <p className="text-red-400 text-sm mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('createRequest.description')}
            </label>
            <Textarea
              {...form.register('description')}
              placeholder={t('createRequest.descriptionPlaceholder')}
              className="bg-panel border-brand-primary/30 h-20"
            />
            {form.formState.errors.description && (
              <p className="text-red-400 text-sm mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('createRequest.mediaType')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={selectedMediaType === 'photo' ? 'default' : 'outline'}
                className={`${selectedMediaType === 'photo'
                  ? 'bg-brand-primary text-white'
                  : 'bg-panel text-text-muted border-brand-primary/30'
                  }`}
                onClick={() => setSelectedMediaType('photo')}
              >
                <Camera className="w-4 h-4 mr-1" />
                {t('mediaType.photo')}
              </Button>
              <Button
                type="button"
                variant={selectedMediaType === 'video' ? 'default' : 'outline'}
                className={`${selectedMediaType === 'video'
                  ? 'bg-brand-primary text-white'
                  : 'bg-panel text-text-muted border-brand-primary/30'
                  }`}
                onClick={() => setSelectedMediaType('video')}
              >
                <Video className="w-4 h-4 mr-1" />
                {t('mediaType.video')}
              </Button>
              <Button
                type="button"
                variant={selectedMediaType === 'live' ? 'default' : 'outline'}
                className={`${selectedMediaType === 'live'
                  ? 'bg-brand-primary text-white'
                  : 'bg-panel text-text-muted border-brand-primary/30'
                  }`}
                onClick={() => setSelectedMediaType('live')}
              >
                <Radio className="w-4 h-4 mr-1" />
                {t('mediaType.live')}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('createRequest.budget')} (TON)
            </label>
            <Input
              {...form.register('budgetTon')}
              type="number"
              step="0.1"
              min="0"
              placeholder="2.5"
              className="bg-panel border-brand-primary/30"
            />
            {form.formState.errors.budgetTon && (
              <p className="text-red-400 text-sm mt-1">
                {form.formState.errors.budgetTon.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('createRequest.location')}
            </label>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-brand-accent" />
              <span className="text-sm text-text-muted">
                {form.watch('address') || t('createRequest.selectLocation')}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={createOrder.isPending}
              className="flex-1 gradient-bg text-white font-medium"
            >
              {createOrder.isPending
                ? t('createRequest.creating')
                : t('createRequest.createAndFund')
              }
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={fillSampleData}
              className="text-text-muted hover:text-text-primary"
            >
              {t('createRequest.sample')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
