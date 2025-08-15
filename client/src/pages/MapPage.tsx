import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Filter, X, Crosshair, Eye, MapPin } from "lucide-react";
import { Link } from "wouter";
import { InteractiveMap } from "@/components/InteractiveMap";
import { OrderAcceptButton } from "@/components/OrderAcceptButton";
import { bootstrapTelegramAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";

export default function MapPage() {
    const { t } = useTranslation();
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Fetch current user
    const { data: currentUser } = useQuery({
        queryKey: ['/api/me'],
        enabled: true,
        queryFn: async () => {
            const token = getAuthToken();
            const response = await fetch('/api/me', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!response.ok) throw new Error('Failed to fetch user');
            return response.json();
        },
    });

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

                    {/* Filter Panel */}
                    {showFilterPanel && (
                        <Card className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur-sm border-white/20 z-10">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{t('map.filters') || 'Фильтры'}</CardTitle>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowFilterPanel(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">
                                    Фильтры доступны в карте. Нажмите на кнопку "Фильтры" на карте для настройки.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Details Modal */}
                    {selectedOrder && (
                        <Card className="absolute top-4 left-4 w-96 bg-white/95 backdrop-blur-sm border-white/20 z-10">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{selectedOrder.title}</CardTitle>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={closeOrderDetails}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-gray-600">{selectedOrder.description}</p>

                                <div className="flex items-center justify-between">
                                    <Badge
                                        variant="secondary"
                                        className={`${selectedOrder.mediaType === 'photo' ? 'bg-blue-500 text-white' :
                                            selectedOrder.mediaType === 'video' ? 'bg-red-500 text-white' :
                                                'bg-green-500 text-white'
                                            }`}
                                    >
                                        {selectedOrder.mediaType === 'photo' && '📷 Фото'}
                                        {selectedOrder.mediaType === 'video' && '🎥 Видео'}
                                        {selectedOrder.mediaType === 'live' && '📡 Прямая трансляция'}
                                    </Badge>
                                    <span className="font-semibold text-green-600">
                                        {(parseInt(selectedOrder.budgetNanoTon) / 1e9).toFixed(1)} TON
                                    </span>
                                </div>

                                {selectedOrder.location?.address && (
                                    <div className="text-sm text-gray-600">
                                        📍 {selectedOrder.location.address}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button size="sm" className="flex-1">
                                        <Eye className="w-4 h-4 mr-1" />
                                        Подробнее
                                    </Button>
                                    {currentUser && (
                                        <OrderAcceptButton
                                            orderId={selectedOrder.id}
                                            orderStatus={selectedOrder.status}
                                            requesterId={selectedOrder.requesterId}
                                            currentUserId={currentUser.id}
                                            onSuccess={() => {
                                                setSelectedOrder(null);
                                                // Refresh the map
                                                window.location.reload();
                                            }}
                                            className="flex-1"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
