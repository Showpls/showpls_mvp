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
        <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
            {/* Header */}
            <div className="glass-panel p-4">
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
                            <h1 className="text-xl font-bold text-white">{t('map.title') || 'Карта заказов'}</h1>
                        </div>
                    </div>

                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow max-w-6xl w-full mx-auto px-4 pb-4">
                <div className="relative h-full">
                    {/* Interactive Map */}
                    <InteractiveMap
                        onOrderClick={handleOrderClick}
                        showFilters={true}
                        className="h-full w-full"
                    />

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

                </div>
            </div>
        </div>
    );
}
