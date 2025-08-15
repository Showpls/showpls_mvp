import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Filter, X, Crosshair, Eye, MapPin } from "lucide-react";
import { Link } from "wouter";
import { InteractiveMap } from "@/components/InteractiveMap";
import { OrderDetailsSheet } from '@/components/OrderDetailsSheet';
import { bootstrapTelegramAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function MapPage() {
    const { t } = useTranslation();
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const { currentUser } = useCurrentUser();

    useEffect(() => {
        // Ensure we have a token if user navigates directly here
        (async () => {
            await bootstrapTelegramAuth();
        })();
    }, []);

    const handleOrderClick = (order: any) => {
        setSelectedOrder(order);
    };

    const closeOrderDetails = () => {
        setSelectedOrder(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="glass-panel p-4 mb-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/twa">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white">Карта заказов</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className="text-white border-white/20 hover:bg-white/10"
                        >
                            <Filter className="w-4 h-4 mr-1" />
                            {t('map.filters') || 'Фильтры'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4">
                <div className="relative">
                    {/* Interactive Map */}
                    <InteractiveMap
                        onOrderClick={handleOrderClick}
                        showFilters={false}
                        className="h-[calc(100vh-200px)] min-h-[600px]"
                    />

                    {/* Mobile Filter Panel */}
                    {showFilterPanel && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
                            <div className="w-full bg-white rounded-t-2xl max-h-[60vh] overflow-y-auto">
                                <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">{t('map.filters') || 'Фильтры'}</h3>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowFilterPanel(false)}
                                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-900 font-medium">
                                            💡 Фильтры доступны прямо на карте
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Нажмите на кнопку "Фильтры" в левом верхнем углу карты для настройки поиска по типу контента, радиусу и бюджету.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setShowFilterPanel(false)}
                                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Понятно
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Details Sheet */}
                    <OrderDetailsSheet
                        order={selectedOrder}
                        isOpen={!!selectedOrder}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) {
                                setSelectedOrder(null);
                            }
                        }}
                    />

                    {/* Map Legend */}
                    <Card className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border-white/20 z-10">
                        <CardContent className="p-3">
                            <div className="text-sm font-medium mb-2">Типы заказов:</div>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span>Фото</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span>Видео</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span>Прямая трансляция</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
