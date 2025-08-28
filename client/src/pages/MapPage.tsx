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
    const [selectedProvider, setSelectedProvider] = useState<any>(null);
    const [showProviderSheet, setShowProviderSheet] = useState(false);

    const { currentUser } = useCurrentUser();

    useEffect(() => {
        // Ensure we have a token if user navigates directly here
        (async () => {
            await bootstrapTelegramAuth();
        })();
    }, []);

    const handleOrderClick = (order: any) => {
        setSelectedOrder(order);
        setSelectedProvider(null);
    };

    const handleProviderClick = (provider: any) => {
        setSelectedProvider(provider);
        setSelectedOrder(null);
        setShowProviderSheet(true);
    };

    const closeOrderDetails = () => {
        setSelectedOrder(null);
    };

    const closeProviderDetails = () => {
        setSelectedProvider(null);
        setShowProviderSheet(false);
    };

    return (
        <div className="h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <div className="dark:glass-panel p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/twa">
                            <Button variant="ghost" size="icon" className="text-foreground">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-foreground">{t('map.title') || 'Карта заказов'}</h1>
                        </div>
                    </div>

                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow">
                <div className="relative h-full">
                    {/* Interactive Map */}
                    <InteractiveMap
                        onOrderClick={handleOrderClick}
                        onProviderClick={handleProviderClick}
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

                    {/* Provider Details Sheet */}
                    {selectedProvider && (
                        <div className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${showProviderSheet ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <div className={`fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl p-6 transition-transform duration-300 ${showProviderSheet ? 'translate-y-0' : 'translate-y-full'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">{selectedProvider.name || 'Provider'}</h2>
                                    <button
                                        onClick={closeProviderDetails}
                                        className="p-2 rounded-full hover:bg-muted"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {selectedProvider.rating && (
                                    <div className="flex items-center mb-4">
                                        <span className="text-yellow-500 mr-1">★</span>
                                        <span className="text-sm text-muted-foreground">
                                            {selectedProvider.rating.toFixed(1)}
                                            {selectedProvider.reviewCount && ` (${selectedProvider.reviewCount} reviews)`}
                                        </span>
                                    </div>
                                )}

                                {selectedProvider.specialties?.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium mb-2">Specialties</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProvider.specialties.map((specialty: string, index: number) => (
                                                <span key={index} className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedProvider.location?.address && (
                                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        <span>{selectedProvider.location.address}</span>
                                    </div>
                                )}

                                <Button className="w-full mt-4" onClick={closeProviderDetails}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
