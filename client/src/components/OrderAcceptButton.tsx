import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle, Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface OrderAcceptButtonProps {
    orderId: string;
    orderStatus: string;
    requesterId: string;
    currentUserId: string;
    onSuccess?: () => void;
    className?: string;
}

export function OrderAcceptButton({
    orderId,
    orderStatus,
    requesterId,
    currentUserId,
    onSuccess,
    className = ""
}: OrderAcceptButtonProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const acceptOrderMutation = useMutation({
        mutationFn: async () => {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/orders/${orderId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({} as any));
                throw new Error(error.error || 'Failed to accept order');
            }

            return response.json();
        },
        onSuccess: (data) => {
            console.log('[ORDER_ACCEPT] Order accepted successfully:', data);

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/orders/user'] });
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });

            toast({
                title: t('order.accepted') || 'Order Accepted',
                description: t('order.acceptedDescription') || 'You have successfully accepted this order.',
                variant: 'default',
            });

            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error: any) => {
            console.error('[ORDER_ACCEPT] Error accepting order:', error);

            toast({
                title: t('order.acceptError') || 'Error',
                description: error.message || t('order.acceptErrorDescription') || 'Failed to accept order.',
                variant: 'destructive',
            });
        },
    });

    // Check if user can accept this order
    const canAccept = () => {
        // User cannot accept their own order
        if (requesterId === currentUserId) {
            return false;
        }

        // Order must be in CREATED status
        if (orderStatus !== 'CREATED') {
            return false;
        }

        return true;
    };

    const getButtonText = () => {
        if (requesterId === currentUserId) {
            return t('order.yourOrder') || 'Your Order';
        }

        if (orderStatus !== 'CREATED') {
            return t('order.notAvailable') || 'Not Available';
        }

        return t('order.accept') || 'Accept Order';
    };

    const getButtonVariant = () => {
        if (!canAccept()) {
            return 'secondary';
        }

        return 'default';
    };

    const handleAccept = () => {
        if (!canAccept()) {
            return;
        }

        acceptOrderMutation.mutate();
    };

    return (
        <Button
            onClick={handleAccept}
            disabled={!canAccept() || acceptOrderMutation.isPending}
            variant={getButtonVariant()}
            className={className}
        >
            {acceptOrderMutation.isPending ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('order.accepting') || 'Accepting...'}
                </>
            ) : (
                <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {getButtonText()}
                </>
            )}
        </Button>
    );
}
