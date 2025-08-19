import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import type { ChatMessage as ChatMessageType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const { t } = useTranslation();

  const formatTime = (timestamp: string | Date | null | undefined) => {
    if (!timestamp) return '';
    return new Date(timestamp as string | Date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <Card
        className={`max-w-xs ${isOwn
          ? 'bg-brand-primary border-brand-primary'
          : 'bg-panel border-brand-primary/20'
          }`}
      >
        <CardContent className={`p-3 ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
          {message.messageType === 'image' && message.metadata?.mediaUrl && (
            <div className="relative mb-2">
              <img
                src={message.metadata.mediaUrl}
                alt="Shared image"
                className="rounded-lg w-full"
              />
              <a
                href={message.metadata.mediaUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2"
              >
                <Button type="button" size="icon" variant={isOwn ? 'secondary' : 'ghost'} className="h-8 w-8 rounded-full shadow">
                  <Download className={`h-4 w-4 ${isOwn ? '' : ''}`} />
                </Button>
              </a>
            </div>
          )}

          <p className={`text-sm ${isOwn ? 'text-white' : 'text-text-primary'}`}>
            {message.message}
          </p>

          <div className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-text-muted'
            }`}>
            {formatTime(message.createdAt)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
