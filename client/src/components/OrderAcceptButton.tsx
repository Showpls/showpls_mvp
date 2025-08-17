import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle, Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface OrderAcceptButtonProps {
    orderId: string;
    orderStatus: string;
    requesterId: string;
    onSuccess?: () => void;
    className?: string;
}

interface AcceptButtonState {
    error: string | null;
    isLoading: boolean;
}

export const OrderAcceptButton: React.FC<OrderAcceptButtonProps> = ({
    orderId,
    orderStatus,
    requesterId,
    onSuccess,
    className = ""
}: OrderAcceptButtonProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useCurrentUser();
    const [buttonState, setButtonState] = useState<AcceptButtonState>({
        error: null,
        isLoading: false
    });

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
        onMutate: () => {
            setButtonState({ error: null, isLoading: true });
        },
        onSuccess: (data) => {
            console.log('[ORDER_ACCEPT] Order accepted successfully:', data);
            setButtonState({ error: null, isLoading: false });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/orders/user'] });
            queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });

            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error: any) => {
            console.error('[ORDER_ACCEPT] Error accepting order:', error);
            setButtonState({ 
                error: error.message || 'Failed to accept order', 
                isLoading: false 
            });
        },
    });

    // Check if user can accept this order
    const canAccept = () => {
        // User cannot accept their own order
        if (requesterId === currentUser?.id) {
            return false;
        }

        // User must be a provider to accept
        if (!currentUser?.isProvider) {
            return false;
        }

        // Order must be in CREATED status
        if (orderStatus !== 'CREATED') {
            return false;
        }

        return true;
    };

    const getButtonText = () => {
        if (requesterId === currentUser?.id) {
            return t('order.yourOrder') || 'Your Order';
        }

        if (!currentUser?.isProvider) {
            return t('order.mustBeProvider') || 'Only providers can accept';
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

        setButtonState({ error: null, isLoading: true });
        acceptOrderMutation.mutate();
    };

    return (
        <div className="space-y-2">
            <Button
                onClick={handleAccept}
                disabled={!canAccept() || buttonState.isLoading}
                variant={getButtonVariant()}
                className={className}
            >
                {buttonState.isLoading ? (
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
            {buttonState.error && (
                <p className="text-sm text-red-500">{buttonState.error}</p>
            )}
        </div>
    );
}
