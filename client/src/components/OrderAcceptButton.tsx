import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle, Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

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

    const [confirmOpen, setConfirmOpen] = useState(false);
    const handleAcceptClick = () => {
        if (!canAccept()) return;
        setConfirmOpen(true);
    };

    return (
        <div className="space-y-2">
            <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialog.Trigger asChild>
                    <Button
                        onClick={handleAcceptClick}
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
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-[1000]" />
                    <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-lg bg-card border border-brand-primary/30 p-4 shadow-xl z-[1001]">
                        <AlertDialog.Title className="font-semibold mb-2">
                            {t('order.acceptConfirm.title') || 'Accept this order?'}
                        </AlertDialog.Title>
                        <AlertDialog.Description className="text-sm text-text-muted mb-4">
                            {t('order.acceptConfirm.body') || 'You will become the provider for this order. Proceed?'}
                        </AlertDialog.Description>
                        <div className="flex justify-end gap-2">
                            <AlertDialog.Cancel asChild>
                                <Button variant="outline" disabled={buttonState.isLoading}>
                                    {t('common.cancel') || 'Cancel'}
                                </Button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                                <Button
                                    className="bg-brand-primary text-white"
                                    disabled={buttonState.isLoading}
                                    onClick={() => {
                                        setButtonState({ error: null, isLoading: true });
                                        acceptOrderMutation.mutate();
                                    }}
                                >
                                    {buttonState.isLoading ? (t('order.accepting') || 'Accepting...') : (t('order.acceptConfirm.confirm') || 'Accept')}
                                </Button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
            {buttonState.error && (
                <p className="text-sm text-red-500">{buttonState.error}</p>
            )}
        </div>
    );
}
