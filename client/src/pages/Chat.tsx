import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "@/components/ChatMessage";
import { RatingForm } from "@/components/RatingForm";
import { DisputeModal } from "@/components/DisputeModal";
import { QuickReplies } from "@/components/QuickReplies";
import { TipModal } from "@/components/TipModal";
import { DemoButton } from "@/components/DemoButton";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/websocket";
import {
  Phone,
  Info,
  Paperclip,
  Send,
  Upload,
  Star,
  AlertTriangle,
  Heart,
  Clock
} from "lucide-react";
import type { ChatMessage as ChatMessageType, Order } from "@shared/schema";

export default function Chat() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: order } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  });

  const { data: messages, refetch: refetchMessages } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/orders', orderId, 'messages'],
    enabled: !!orderId,
  });

  const { sendMessage, isConnected } = useWebSocket(orderId!, {
    onMessage: (data) => {
      if (data.type === 'chat_message' && data.message) {
        queryClient.setQueryData(['/api/orders', orderId, 'messages'], (old: ChatMessageType[] | undefined) => [
          ...(old || []),
          data.message
        ]);
      }
    }
  });

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
      setShowQuickReplies(false);
    }
  });

  const handleQuickReply = (replyMessage: string) => {
    if (replyMessage) {
      setMessage(replyMessage);
    } else {
      setShowQuickReplies(false);
    }
  };

  const approveOrder = useMutation({
    mutationFn: () => {
      return fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!order) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-muted">{t('chat.loading')}</p>
        </div>
      </div>
    );
  }

  // Get other user info (provider or requester based on current user role)
  const otherUser = order?.providerId ? { username: 'Provider', firstName: 'Provider' } : { username: 'Requester', firstName: 'Requester' };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Chat Header */}
      <div className="glass-panel p-4 mb-6">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center">
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
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="max-w-sm mx-auto px-4 mb-20">
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
                {((Number(order.budgetNanoTon) / 1e9).toFixed(4))} TON • {t(`order.status.${order.status.toLowerCase()}`)}
              </Badge>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="space-y-3">
            {messages?.map((msg: ChatMessageType) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={false}
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

          {/* Show dispute button for other statuses too */}
          {['IN_PROGRESS', 'FUNDED'].includes(order.status) && (
            <div className="text-center">
              <Button
                onClick={() => setShowDispute(true)}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                size="sm"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {t('chat.openDispute')}
              </Button>
            </div>
          )}

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

      {/* Quick Replies Panel */}
      {showQuickReplies && (
        <div className="fixed bottom-20 left-4 right-4 z-10">
          <div className="max-w-sm mx-auto">
            <QuickReplies
              onReplySelect={handleQuickReply}
              orderStatus={order.status}
              className="mb-4"
            />
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="fixed bottom-0 left-0 right-0 glass-panel p-4">
        <form onSubmit={handleSendMessage} className="max-w-sm mx-auto space-y-2">
          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className={showQuickReplies ? 'text-brand-primary' : 'text-text-muted'}
              >
                <Clock className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-text-muted">
              {isConnected ? t('chat.connected') : t('chat.connecting')}
            </div>
          </div>

          {/* Message Input */}
          <div className="flex items-center space-x-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('chat.typeMessage')}
              className="flex-1 bg-panel border-brand-primary/30 rounded-full"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary/80 p-3 rounded-full"
              disabled={!message.trim() || !isConnected}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Dispute Modal */}
      <DisputeModal
        orderId={orderId!}
        isOpen={showDispute}
        onClose={() => setShowDispute(false)}
      />

      {/* Demo Button */}
      <DemoButton />
    </div>
  );
}
