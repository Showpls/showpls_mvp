import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Wallet,
  Send,
  RefreshCw
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Order } from '@shared/schema';
import { ConfirmationModal } from './ConfirmationModal';

interface OrderActionsProps {
  order: Order & {
    requester: { username: string; id: string };
    provider?: { username: string; id: string };
  };
}

export const OrderActions: React.FC<OrderActionsProps> = ({ order }) => {
  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const token = getAuthToken();
  const [showConfirmModal, setShowConfirmModal] = useState<{
    action: string;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const isRequester = currentUser?.id === order.requesterId;
  const isProvider = currentUser?.id === order.providerId;

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${order.id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });

  // Create escrow mutation
  const createEscrowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create escrow');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });

  // Fund escrow mutation
  const fundEscrowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/escrow/fund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fund escrow');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });

  // Deliver order mutation
  const deliverOrderMutation = useMutation({
    mutationFn: async (proofUri: string) => {
      const response = await fetch(`/api/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proofUri }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deliver order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });

  // Approve order mutation
  const approveOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId: order.id,
          opId: `approve_${order.id}_${Date.now()}` // Idempotency key
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });

  // Refund order mutation
  const refundOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/escrow/refund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId: order.id,
          opId: `refund_${order.id}_${Date.now()}` // Idempotency key
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refund order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CREATED: { color: 'bg-blue-500', icon: Clock, text: 'Created' },
      PENDING_FUNDING: { color: 'bg-yellow-500', icon: Wallet, text: 'Pending Funding' },
      FUNDED: { color: 'bg-green-500', icon: CheckCircle, text: 'Funded' },
      IN_PROGRESS: { color: 'bg-purple-500', icon: RefreshCw, text: 'In Progress' },
      DELIVERED: { color: 'bg-orange-500', icon: Send, text: 'Delivered' },
      APPROVED: { color: 'bg-green-600', icon: CheckCircle, text: 'Approved' },
      DISPUTED: { color: 'bg-red-500', icon: AlertTriangle, text: 'Disputed' },
      REFUNDED: { color: 'bg-gray-500', icon: XCircle, text: 'Refunded' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CREATED;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const handleConfirmedAction = (action: string, onConfirm: () => void) => {
    const confirmations = {
      accept: {
        title: 'Accept Order',
        message: 'Are you sure you want to accept this order? You will be responsible for completing it.',
      },
      createEscrow: {
        title: 'Create Escrow',
        message: 'This will create a smart contract to hold the payment securely.',
      },
      fundEscrow: {
        title: 'Fund Escrow',
        message: `This will transfer ${(Number(order.budgetNanoTon) / 1e9).toFixed(2)} TON to the escrow contract.`,
      },
      deliver: {
        title: 'Mark as Delivered',
        message: 'Are you sure you have completed the work and want to mark this order as delivered?',
      },
      approve: {
        title: 'Approve & Release Payment',
        message: 'This will release the payment to the provider. This action cannot be undone.',
      },
      refund: {
        title: 'Request Refund',
        message: 'This will initiate a refund process. The payment will be returned to you.',
      },
    };

    const config = confirmations[action as keyof typeof confirmations];
    if (config) {
      setShowConfirmModal({
        action,
        title: config.title,
        message: config.message,
        onConfirm,
      });
    } else {
      onConfirm();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Actions</span>
          {getStatusBadge(order.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider can accept order */}
        {!isRequester && !isProvider && order.status === 'CREATED' && (
          <Button
            onClick={() => handleConfirmedAction('accept', () => acceptOrderMutation.mutate())}
            disabled={acceptOrderMutation.isPending}
            className="w-full"
          >
            {acceptOrderMutation.isPending ? 'Accepting...' : 'Accept Order'}
          </Button>
        )}

        {/* Requester actions */}
        {isRequester && (
          <>
            {order.status === 'IN_PROGRESS' && !order.escrowAddress && (
              <Button
                onClick={() => handleConfirmedAction('createEscrow', () => createEscrowMutation.mutate())}
                disabled={createEscrowMutation.isPending}
                className="w-full"
                variant="outline"
              >
                {createEscrowMutation.isPending ? 'Creating Escrow...' : 'Create Escrow Contract'}
              </Button>
            )}

            {order.status === 'IN_PROGRESS' && order.escrowAddress && (
              <Button
                onClick={() => handleConfirmedAction('fundEscrow', () => fundEscrowMutation.mutate())}
                disabled={fundEscrowMutation.isPending}
                className="w-full"
              >
                {fundEscrowMutation.isPending ? 'Funding...' : 'Fund Escrow'}
              </Button>
            )}

            {order.status === 'DELIVERED' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleConfirmedAction('approve', () => approveOrderMutation.mutate())}
                  disabled={approveOrderMutation.isPending}
                  className="flex-1"
                >
                  {approveOrderMutation.isPending ? 'Approving...' : 'Approve & Pay'}
                </Button>
                <Button
                  onClick={() => handleConfirmedAction('refund', () => refundOrderMutation.mutate())}
                  disabled={refundOrderMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  {refundOrderMutation.isPending ? 'Processing...' : 'Request Refund'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Provider actions */}
        {isProvider && (
          <>
            {order.status === 'FUNDED' && (
              <Button
                onClick={() => {
                  const proofUri = prompt('Enter proof URL (image/video link):');
                  if (proofUri) {
                    handleConfirmedAction('deliver', () => deliverOrderMutation.mutate(proofUri));
                  }
                }}
                disabled={deliverOrderMutation.isPending}
                className="w-full"
              >
                {deliverOrderMutation.isPending ? 'Submitting...' : 'Submit Delivery'}
              </Button>
            )}
          </>
        )}

        {/* Error messages */}
        {(acceptOrderMutation.error || createEscrowMutation.error || fundEscrowMutation.error || 
          deliverOrderMutation.error || approveOrderMutation.error || refundOrderMutation.error) && (
          <div className="text-red-500 text-sm">
            {acceptOrderMutation.error?.message || 
             createEscrowMutation.error?.message || 
             fundEscrowMutation.error?.message ||
             deliverOrderMutation.error?.message ||
             approveOrderMutation.error?.message ||
             refundOrderMutation.error?.message}
          </div>
        )}

        {/* Order info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Budget: {(Number(order.budgetNanoTon) / 1e9).toFixed(2)} TON</div>
          {order.escrowAddress && (
            <div className="break-all">Escrow: {order.escrowAddress}</div>
          )}
          {order.proofUri && (
            <div>
              Proof: <a href={order.proofUri} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                View Delivery
              </a>
            </div>
          )}
        </div>
      </CardContent>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          isOpen={true}
          title={showConfirmModal.title}
          message={showConfirmModal.message}
          onConfirm={() => {
            showConfirmModal.onConfirm();
            setShowConfirmModal(null);
          }}
          onCancel={() => setShowConfirmModal(null)}
          confirmText="Confirm"
          cancelText="Cancel"
        />
      )}
    </Card>
  );
};
