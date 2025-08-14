import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Camera, Video, Smartphone, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { getAuthToken, bootstrapTelegramAuth } from "@/lib/auth";
import TelegramWebApp from "./TelegramWebApp";

interface OrderData {
  title: string;
  description: string;
  mediaType: 'photo' | 'video' | 'live';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  budgetNanoTon: string;
  isSampleOrder: boolean;
}

export default function CreateOrder() {
  const [orderData, setOrderData] = useState<OrderData>({
    title: '',
    description: '',
    mediaType: 'photo',
    location: { lat: 55.7558, lng: 37.6176, address: 'Москва, Россия' },
    budgetNanoTon: '1000000000', // 1 TON in nano-TON
    isSampleOrder: false,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    // Ensure we have a token if user navigates directly here
    (async () => {
      if (!getAuthToken()) {
        await bootstrapTelegramAuth();
      }
    })();
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderData) => {
      const token = getAuthToken();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({} as any));
        throw new Error(error.error || 'Не удалось создать заказ');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/user'] });
      // Redirect to orders page or show success
      window.location.href = '/twa';
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderData.title.trim() || !orderData.description.trim()) {
      alert('Заполните название и описание заказа');
      return;
    }

    if (!getAuthToken()) {
      alert('Пожалуйста, авторизуйтесь через Telegram WebApp и попробуйте снова.');
      return;
    }

    createOrderMutation.mutate(orderData);
  };

  const getLocationFromBrowser = () => {
    // Check if we're in Telegram Web App
    const telegramWebApp = (window as any)?.Telegram?.WebApp;

    if (telegramWebApp) {
      // Use Telegram's geolocation API
      console.log('[CREATE_ORDER] Using Telegram WebApp geolocation');

      // Request location permission and get current position
      telegramWebApp.requestLocation()
        .then((location: any) => {
          console.log('[CREATE_ORDER] Telegram location received:', location);
          setOrderData({
            ...orderData,
            location: {
              lat: location.lat,
              lng: location.lng,
              address: 'Ваше текущее местоположение',
            }
          });
        })
        .catch((err: any) => {
          console.error('[CREATE_ORDER] Telegram geolocation error:', err);
          // Provide specific error message for Telegram Web App
          if (err?.message?.includes('denied') || err?.message?.includes('permission')) {
            alert('Разрешите доступ к местоположению в Telegram для получения вашего местоположения');
          } else {
            alert('Не удалось получить местоположение через Telegram');
          }
        });
    } else {
      // Fall back to browser geolocation API
      console.log('[CREATE_ORDER] Using browser geolocation API');

      if (!navigator.geolocation) {
        alert('Геолокация не поддерживается вашим браузером');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOrderData({
            ...orderData,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Ваше текущее местоположение',
            }
          });
        },
        (error) => {
          console.error('[CREATE_ORDER] Browser geolocation error:', error);
          // Provide specific error messages based on error code
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert('Доступ к местоположению запрещен. Разрешите доступ в настройках браузера.');
              break;
            case error.POSITION_UNAVAILABLE:
              alert('Информация о местоположении недоступна');
              break;
            case error.TIMEOUT:
              alert('Превышено время ожидания получения местоположения');
              break;
            default:
              alert('Не удалось получить ваше местоположение');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const fillSampleData = () => {
    setOrderData({
      title: 'Фото Красной площади',
      description: 'Нужны свежие фотографии Красной площади с видом на Кремль. Желательно во время заката.',
      mediaType: 'photo',
      location: { lat: 55.7539, lng: 37.6208, address: 'Красная площадь, Москва' },
      budgetNanoTon: '2500000000', // 2.5 TON
      isSampleOrder: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 text-white">
          <Link href="/twa">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Создать заказ</h1>
        </div>

        <Card className="glass-panel border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Camera size={24} />
              Новый запрос на контент
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sample Data Button */}
              <Button
                type="button"
                variant="outline"
                onClick={fillSampleData}
                className="w-full"
              >
                Заполнить примером
              </Button>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Название заказа</Label>
                <Input
                  id="title"
                  value={orderData.title}
                  onChange={(e) => setOrderData({ ...orderData, title: e.target.value })}
                  placeholder="Например: Фото Эйфелевой башни"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Описание</Label>
                <Textarea
                  id="description"
                  value={orderData.description}
                  onChange={(e) => setOrderData({ ...orderData, description: e.target.value })}
                  placeholder="Опишите детально, что вам нужно..."
                  rows={4}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>

              {/* Media Type */}
              <div className="space-y-2">
                <Label className="text-white">Тип контента</Label>
                <Select
                  value={orderData.mediaType}
                  onValueChange={(value: 'photo' | 'video' | 'live') =>
                    setOrderData({ ...orderData, mediaType: value })
                  }
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">
                      <div className="flex items-center gap-2">
                        <Camera size={16} />
                        Фотография
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video size={16} />
                        Видео
                      </div>
                    </SelectItem>
                    <SelectItem value="live">
                      <div className="flex items-center gap-2">
                        <Smartphone size={16} />
                        Прямая трансляция
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-white">Местоположение</Label>
                <div className="flex gap-2">
                  <Input
                    value={orderData.location.address || 'Укажите адрес'}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      location: { ...orderData.location, address: e.target.value }
                    })}
                    placeholder="Адрес или описание места"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getLocationFromBrowser}
                    className="shrink-0"
                  >
                    <MapPin size={16} />
                  </Button>
                </div>
                <div className="text-sm text-white/60">
                  Координаты: {orderData.location.lat.toFixed(4)}, {orderData.location.lng.toFixed(4)}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-white">Бюджет (TON)</Label>
                <Select
                  value={orderData.budgetNanoTon}
                  onValueChange={(value) => setOrderData({ ...orderData, budgetNanoTon: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000000000">1 TON</SelectItem>
                    <SelectItem value="2500000000">2.5 TON</SelectItem>
                    <SelectItem value="5000000000">5 TON</SelectItem>
                    <SelectItem value="10000000000">10 TON</SelectItem>
                    <SelectItem value="25000000000">25 TON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? 'Создание...' : 'Создать заказ'}
              </Button>

              {createOrderMutation.error && (
                <div className="text-red-400 text-sm">
                  Ошибка: {createOrderMutation.error.message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}