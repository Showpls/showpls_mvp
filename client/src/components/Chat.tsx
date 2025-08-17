import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Paperclip, Send, ShieldAlert } from 'lucide-react';
import type { OrderWithRelations } from '@shared/schema';

interface ChatProps {
  orderId: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    photoUrl?: string;
  };
}

const fetchOrder = async (orderId: string, token: string | null): Promise<OrderWithRelations> => {
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

const fetchMessages = async (orderId: string, token: string | null): Promise<Message[]> => {
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`/api/orders/${orderId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
};

const sendMessage = async (orderId: string, content: string, token: string | null): Promise<Message> => {
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`/api/orders/${orderId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message: content, messageType: 'text' }),
  });
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
};

export const Chat: React.FC<ChatProps> = ({ orderId }) => {
  const token = getAuthToken();
  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: order, isLoading: isOrderLoading, isError: isOrderError } = useQuery<OrderWithRelations>({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId, token),
    enabled: !!token && !!orderId,
  });

  const isChatActive = order?.providerId !== null;

  const { data: messages, isLoading: areMessagesLoading, isError: areMessagesError } = useQuery<Message[]>({
    queryKey: ['messages', orderId],
    queryFn: () => fetchMessages(orderId, token),
    enabled: !!token && !!orderId && isChatActive,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const mutation = useMutation<Message, Error, string>({
    mutationFn: (content: string) => sendMessage(orderId, content, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
      setNewMessage('');
    },
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      mutation.mutate(newMessage.trim());
    }
  };

  if (isOrderLoading) return <div>Loading chat...</div>;
  if (isOrderError) return <div>Error loading chat details.</div>;

  if (!isChatActive) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-background rounded-lg border p-4 text-center">
        <ShieldAlert className="w-12 h-12 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold">Chat Not Available</h3>
        <p className="text-text-muted text-sm">This chat will be available once a provider accepts the order.</p>
      </div>
    );
  }

  if (areMessagesLoading) return <div>Loading messages...</div>;
  if (areMessagesError) return <div>Error loading messages.</div>;

  return (
    <div className="flex flex-col h-[400px] bg-background rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-2">Chat</h3>
      <ScrollArea className="flex-grow mb-4 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
              {msg.senderId !== currentUser?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.sender.photoUrl} alt={msg.sender.username} />
                  <AvatarFallback>{msg.sender.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${msg.senderId === currentUser?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-right opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={mutation.isPending}
        />
        <Button type="submit" size="icon" disabled={mutation.isPending || !newMessage.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};