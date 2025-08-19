import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, User, Wallet } from 'lucide-react';
import { Link } from 'wouter';
import { OrderActions } from '@/components/OrderActions';
import type { OrderWithRelations } from '@shared/schema';

const fetchOrderDetails = async (orderId: string, token: string | null): Promise<OrderWithRelations> => {
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`/api/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch order details');
  }
  return response.json();
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const token = getAuthToken();

  const { data: order, isLoading, isError } = useQuery<OrderWithRelations>({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderDetails(orderId!, token),
    enabled: !!orderId && !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-white text-center">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-red-400 text-center">Failed to load order details</div>
        </div>
      </div>
    );
  }

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return '📸';
      case 'video': return '🎥';
      case 'live': return '📱';
      default: return '📷';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 text-white">
          <Link href="/twa">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Order Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Information */}
          <div className="space-y-6">
            <Card className="glass-panel border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getMediaTypeIcon(order.mediaType)}
                  {order.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{order.description}</p>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{order.location.address || `${order.location.lat.toFixed(4)}, ${order.location.lng.toFixed(4)}`}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Wallet className="w-4 h-4" />
                  <span>{(Number(order.budgetNanoTon) / 1e9).toFixed(2)} TON</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Created {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span>Requested by {order.requester.username}</span>
                </div>

                {order.provider && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Provider: {order.provider.username}</span>
                  </div>
                )}

                {order.acceptedAt && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Accepted {order.acceptedAt ? new Date(order.acceptedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                )}

                {order.deliveredAt && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Delivered {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                )}

                {order.approvedAt && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Approved {order.approvedAt ? new Date(order.approvedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                )}

                {order.proofUri && (
                  <div className="mt-4">
                    <h4 className="text-white font-semibold mb-2">Delivery Proof:</h4>
                    <a 
                      href={order.proofUri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      View Delivered Content
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Actions */}
            <OrderActions order={order} />
          </div>
        </div>
      </div>
    </div>
  );
}
