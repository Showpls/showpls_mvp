import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Paperclip, Send, ShieldAlert, Upload } from 'lucide-react';
import type { OrderWithRelations } from '@shared/schema';

interface ChatProps {
  orderId: string;
}

interface Message {
  id: string;
  senderId: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mediaUrl?: string;
  };
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
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: order, isLoading: isOrderLoading, isError: isOrderError } = useQuery<OrderWithRelations>({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId, token),
    enabled: !!token && !!orderId,
  });

  const isChatActive = order?.providerId !== null;

  const { data: messages, isLoading: areMessagesLoading, isError: areMessagesError, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['messages', orderId],
    queryFn: () => fetchMessages(orderId, token),
    enabled: !!token && !!orderId && isChatActive,
    refetchOnWindowFocus: false,
  });

  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);

  const mutation = useMutation<Message, Error, string>({
    mutationFn: (content: string) => sendMessage(orderId, content, token),
    onSuccess: () => {
      setNewMessage('');
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      // Fallback to HTTP if WebSocket fails
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
  });

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!token || !orderId || !isChatActive) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}&orderId=${encodeURIComponent(orderId)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'chat_message':
              if (data.message) {
                setRealtimeMessages(prev => {
                  const exists = prev.find(m => m.id === data.message.id);
                  if (exists) return prev;
                  return [...prev, data.message];
                });
              }
              break;
            case 'typing':
              if (data.userId !== currentUser?.id) {
                setOtherUserTyping(data.isTyping);
                if (data.isTyping) {
                  setTimeout(() => setOtherUserTyping(false), 3000);
                }
              }
              break;
            case 'connected':
              console.log('WebSocket connection confirmed');
              break;
            case 'error':
              console.error('WebSocket error:', data.message);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setWsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [token, orderId, isChatActive, currentUser?.id]);

  useEffect(() => {
    if (isChatActive) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, isChatActive]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, realtimeMessages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (!isTyping) {
      setIsTyping(true);
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping: true
      }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          isTyping: false
        }));
      }
    }, 1000);
  }, [isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    
    // Try WebSocket first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        content: messageContent,
        messageType: 'text'
      }));
      setNewMessage('');
      
      // Clear typing indicator
      if (isTyping) {
        setIsTyping(false);
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          isTyping: false
        }));
      }
    } else {
      // Fallback to HTTP
      mutation.mutate(messageContent);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);

      const response = await fetch(`/api/upload/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Send file message via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          content: file.name,
          messageType: file.type.startsWith('image/') ? 'image' : 'file',
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            mediaUrl: result.url
          }
        }));
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  // Combine fetched messages with realtime messages
  const allMessages = [...(messages || []), ...realtimeMessages]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .filter((message, index, array) => 
      array.findIndex(m => m.id === message.id) === index
    );

  return (
    <div className="flex flex-col h-[400px] bg-background rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Chat</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      <ScrollArea className="flex-grow mb-4 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {allMessages?.map((msg) => (
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
                {msg.messageType === 'image' && msg.metadata?.mediaUrl ? (
                  <div className="space-y-2">
                    <img 
                      src={msg.metadata.mediaUrl} 
                      alt={msg.metadata.fileName || 'Image'}
                      className="max-w-full h-auto rounded"
                    />
                    {msg.message && <p className="text-sm">{msg.message}</p>}
                  </div>
                ) : msg.messageType === 'file' && msg.metadata?.mediaUrl ? (
                  <div className="space-y-2">
                    <a 
                      href={msg.metadata.mediaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm underline"
                    >
                      <Paperclip className="w-4 h-4" />
                      {msg.metadata.fileName || msg.message}
                    </a>
                  </div>
                ) : (
                  <p className="text-sm">{msg.message}</p>
                )}
                <p className="text-xs text-right opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {otherUserTyping && (
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-xs text-muted-foreground">Someone is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile}
        >
          {uploadingFile ? (
            <Upload className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          disabled={mutation.isPending || uploadingFile}
        />
        <Button type="submit" size="icon" disabled={mutation.isPending || uploadingFile || !newMessage.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};