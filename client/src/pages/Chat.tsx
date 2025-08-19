import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "@/components/ChatMessage";
import { RatingForm } from "@/components/RatingForm";
import { DisputeModal } from "@/components/DisputeModal";
import { TipModal } from "@/components/TipModal";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/websocket";
import { getAuthToken } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Phone,
  Info,
  Paperclip,
  Send,
  Upload,
  Star,
  AlertTriangle,
  Heart,
  Clock,
  ArrowLeft
} from "lucide-react";
import type { ChatMessage as ChatMessageType, Order } from "@shared/schema";

export default function Chat() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  // Removed quick replies feature
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: order, isLoading: isOrderLoading, isError: isOrderError, error: orderError } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const token = getAuthToken();
      const tgInitData = getTelegramInitData();
      if (!token && !tgInitData) throw new Error('Not authenticated');
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : { Authorization: `Telegram ${tgInitData}` },
      });
      if (!res.ok) throw new Error('Failed to fetch order');
      const json = await res.json();
      return json.order as Order;
    },
  });

  // Helper to get Telegram WebApp initData (query string) for auth
  const getTelegramInitData = () => {
    try {
      // Telegram WebApp provides initData as a signed query string
      const initData = (window as any)?.Telegram?.WebApp?.initData as string | undefined;
      if (initData && typeof initData === 'string' && initData.length > 0) return initData;
      // Optional: fallback from localStorage if app stored it previously
      const stored = localStorage.getItem('telegram_init_data');
      return stored || '';
    } catch {
      return '';
    }
  };

  const { data: messages, isLoading: areMessagesLoading, isError: areMessagesError, error: messagesError, refetch: refetchMessages } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/orders', orderId, 'messages'],
    enabled: !!orderId,
    queryFn: async () => {
      const token = getAuthToken();
      const tgInitData = getTelegramInitData();
      if (!token && !tgInitData) throw new Error('Not authenticated');
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : { Authorization: `Telegram ${tgInitData}` },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  const { sendMessage, isConnected } = useWebSocket(orderId!, {
    onMessage: (data) => {
      if (data.type === 'chat_message' && data.message) {
        // Minimal logging for diagnostics
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[WS] chat_message received', data.message);
        }
        queryClient.setQueryData(['/api/orders', orderId, 'messages'], (old: ChatMessageType[] | undefined) => [
          ...(old || []),
          data.message
        ]);
      } else if (data.type === 'chat_message' && !data.message) {
        console.warn('[WS] chat_message without message payload', data);
      }
    }
  });

  // Current user details (must be before any usage)
  const { currentUser } = useCurrentUser();

  // Provider: submit delivery ("Finish")
  const deliverOrder = useMutation({
    mutationFn: async (proofUri: string) => {
      const token = getAuthToken();
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ proofUri })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit delivery');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
    }
  });

  // Requester: refund after dispute
  const refundEscrow = useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      const res = await fetch('/api/escrow/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId, opId: `refund_${orderId}_${Date.now()}` })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to refund');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
    }
  });

  // Helpers for conditional actions
  const isProvider = !!(order && order.providerId && order.providerId === currentUser?.id);
  const isRequester = !!(order && order.requesterId === currentUser?.id);
  const providerImageCount = useMemo(() => {
    if (!messages || !order?.providerId) return 0;
    return messages.filter(m => m.messageType === 'image' && m.senderId === order.providerId).length;
  }, [messages, order?.providerId]);

  const sendChatMessage = useMutation({
    mutationFn: (content: string) => {
      return sendMessage({
        type: 'chat_message',
        content,
        messageType: 'text'
      });
    },
    onSuccess: () => {
      setMessage('');
    }
  });

  // Quick replies removed

  const approveOrder = useMutation({
    mutationFn: () => {
      const token = getAuthToken();
      return fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      setShowRating(true);
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      sendChatMessage.mutate(message.trim());
    }
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      const tgInitData = getTelegramInitData();
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : tgInitData
              ? { Authorization: `Telegram ${tgInitData}` }
              : {}),
        },
        body: formData,
      });
      if (!res.ok) {
        // Try to parse server error message
        let message = 'Upload failed';
        try {
          const text = await res.text();
          const json = JSON.parse(text);
          message = json?.error || message;
        } catch {}
        throw new Error(message);
      }
      const json = await res.json();
      const mediaUrl: string = json.url;
      await sendMessage({
        type: 'chat_message',
        content: '',
        messageType: 'image',
        metadata: { mediaUrl },
      });
    } catch (err) {
      console.error('Upload error', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  
  // Safe TON display
  const tonDisplay = useMemo(() => {
    try {
      const n = Number(order?.budgetNanoTon);
      const val = n / 1e9;
      return Number.isFinite(val) ? val.toFixed(4) : '—';
    } catch {
      return '—';
    }
  }, [order?.budgetNanoTon]);
  // Determine the other participant's display info using messages (preferred) or fallback by role
  const otherUser = useMemo(() => {
    // Prefer deriving from messages that include sender info
    const otherMsg = messages?.find(m => m.senderId !== currentUser?.id);
    if (otherMsg && (otherMsg as any).sender) {
      const sender = (otherMsg as any).sender as { username?: string; firstName?: string };
      return {
        username: sender.username || 'User',
        firstName: sender.firstName || sender.username || 'User',
      };
    }

    // Fallback to role-based placeholder if we don't yet have messages
    if (currentUser?.id && order) {
      const isRequester = order.requesterId === currentUser.id;
      return isRequester
        ? { username: 'Provider', firstName: 'Provider' }
        : { username: 'Requester', firstName: 'Requester' };
    }
    return { username: 'User', firstName: 'User' };
  }, [messages, currentUser?.id, order]);

  if (isOrderLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-muted">{t('chat.loading')}</p>
        </div>
      </div>
    );
  }

  if (isOrderError || !order) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full mx-auto mb-4 bg-red-500/20"></div>
          <p className="text-text-muted">
            {t('chat.failedToLoadOrder') || 'Failed to load order.'}
          </p>
          <div className="text-xs text-text-muted mt-2">
            {(orderError as any)?.message || ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Chat Header */}
      <div className="glass-panel p-4 mb-6 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation('/twa')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">
                {otherUser?.firstName?.[0] || otherUser?.username?.[0] || 'U'}
              </span>
            </div>
            <div>
              <div className="font-semibold">
                {otherUser?.firstName || otherUser?.username || t('chat.unknown')}
              </div>
              <div className="text-xs text-text-muted flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                {t('chat.online')}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setShowDispute(true)} title={t('chat.openDispute')}>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </Button>
            <Button variant="ghost" size="sm">
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="max-w-sm mx-auto px-4 pb-32">
        <div className="space-y-4">
          {/* Order Info */}
          <Card className="glass-panel border-brand-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-text-muted mb-2">
                {t('chat.orderHash')} #{order.id.slice(-6)}
              </div>
              <div className="font-semibold">{order.title}</div>
              <Badge
                variant="secondary"
                className={`mt-1 ${order.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                  order.status === 'DELIVERED' ? 'bg-yellow-500/20 text-yellow-400' :
                    order.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                  }`}
              >
                {tonDisplay} TON • {t(`order.status.${order.status.toLowerCase()}`)}
              </Badge>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="space-y-3">
            {areMessagesLoading && (
              <div className="text-center text-text-muted text-sm py-4">
                {t('chat.loadingMessages') || 'Loading messages...'}
              </div>
            )}
            {areMessagesError && (
              <div className="text-center text-red-400 text-sm py-4">
                {t('chat.failedToLoadMessages') || 'Failed to load messages.'}
                <div className="text-xs opacity-70 mt-1">{(messagesError as any)?.message || ''}</div>
              </div>
            )}
            {uploadError && (
              <div className="text-center text-red-400 text-sm py-2">
                {uploadError}
              </div>
            )}
            {messages?.map((msg: ChatMessageType) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUser?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Status Update */}
          {order.status === 'DELIVERED' && !showRating && (
            <Card className="glass-panel border-brand-accent/20">
              <CardContent className="p-4 text-center">
                <div className="inline-block bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-full text-xs mb-3">
                  <Upload className="w-3 h-3 inline mr-1" />
                  {t('chat.mediaDelivered')}
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => approveOrder.mutate()}
                    className="w-full gradient-bg text-white font-medium"
                    disabled={approveOrder.isPending}
                  >
                    {approveOrder.isPending ? t('chat.approving') : t('chat.approvePayment')}
                  </Button>
                  <Button
                    onClick={() => setShowDispute(true)}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {t('chat.openDispute')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Removed bottom Open Dispute button */}

          {/* Rating Form */}
          {showRating && (
            <RatingForm
              orderId={order.id}
              toUserId={order.providerId || order.requesterId}
              onSuccess={() => setShowRating(false)}
            />
          )}

          {/* Tip Button for approved orders */}
          {order.status === 'APPROVED' && order.providerId && (
            <div className="text-center">
              <TipModal
                orderId={order.id}
                providerId={order.providerId}
                providerName={otherUser.firstName || otherUser.username}
                onTipSent={() => queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] })}
              >
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-pink-500/10 to-red-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {t('tip.sendTip')}
                </Button>
              </TipModal>
            </div>
          )}
        </div>
      </div>

      {/* Quick replies removed */}

      {/* Chat Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-indigo-900 p-4">
        <form onSubmit={handleSendMessage} className="max-w-sm mx-auto space-y-2">
          {/* Message Input Row with Attach + Actions */}
          <div className="flex items-center gap-2">
            {/* Attach */}
            <Button type="button" variant="ghost" className="w-10 h-10" onClick={handlePickFile} disabled={isUploading}>
              <Paperclip className="w-5 h-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {/* Message input */}
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('chat.typeMessage')}
              className="flex-1 bg-panel border-transparent rounded-md h-10 text-sm"
            />
            {/* Actions: Refund / Finish / Send */}
            {isRequester && (
              <Button
                type="button"
                variant="outline"
                className="h-10 px-3 border-red-500/40 text-red-300 hover:bg-red-500/10"
                disabled={refundEscrow.isPending}
                onClick={() => {
                  if (order.status !== 'DISPUTED') {
                    setShowDispute(true);
                    return;
                  }
                  refundEscrow.mutate();
                }}
                title={order.status !== 'DISPUTED' ? t('chat.openDispute') : undefined}
              >
                {refundEscrow.isPending ? t('chat.processing') || 'Processing…' : 'Refund'}
              </Button>
            )}
            {isProvider && (
              <Button
                type="button"
                className="h-10 px-3 bg-emerald-600 hover:bg-emerald-500"
                disabled={deliverOrder.isPending || providerImageCount < 5 || !(order.status === 'FUNDED' || order.status === 'IN_PROGRESS')}
                onClick={() => {
                  if (providerImageCount < 5) return;
                  const proofUri = prompt('Enter proof URL (image/video link):') || '';
                  if (!proofUri) return;
                  deliverOrder.mutate(proofUri);
                }}
                title={providerImageCount < 5 ? 'Upload at least 5 images to finish' : ''}
              >
                {deliverOrder.isPending ? 'Finishing…' : 'Finish'}
              </Button>
            )}
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/80 px-3 h-10 rounded-md"
              disabled={(!message.trim() || !isConnected) && !isUploading}
              title={!isConnected ? (t('chat.connecting') as string) : undefined}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Helper text: provider images count requirement */}
          {isProvider && providerImageCount < 5 && (
            <div className="text-[11px] text-yellow-300/80 mt-1">Send at least 5 images before finishing. Uploaded: {providerImageCount}/5</div>
          )}
          {refundEscrow.error && (
            <div className="text-[11px] text-red-300 mt-1">{(refundEscrow.error as any)?.message || 'Refund failed'}</div>
          )}
          {deliverOrder.error && (
            <div className="text-[11px] text-red-300 mt-1">{(deliverOrder.error as any)?.message || 'Delivery failed'}</div>
          )}
        </form>
      </div>

      {/* Dispute Modal */}
      <DisputeModal
        orderId={orderId!}
        isOpen={showDispute}
        onClose={() => setShowDispute(false)}
      />
    </div>
  );
}
