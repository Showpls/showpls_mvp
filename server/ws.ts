import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
// Note: import moved to avoid circular dependency
const wsRateLimits = new Map<string, number[]>();

const JWT_SECRET = process.env.JWT_SECRET || "showpls-secret-key-2024";
// Simple WebSocket rate limiting (5 messages per second)
function wsRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - 1000; // 1 second window

  const timestamps = wsRateLimits.get(userId) || [];
  const recentTimestamps = timestamps.filter((t) => t > windowStart);

  if (recentTimestamps.length >= 5) {
    return false; // Rate limit exceeded
  }

  recentTimestamps.push(now);
  wsRateLimits.set(userId, recentTimestamps);
  return true;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  orderId?: string;
}

export function createWSServer(server: any) {
  console.log("[WS] Creating WebSocket server on path /ws");
  const wss = new WebSocketServer({ server, path: "/ws" });
  console.log("[WS] WebSocket server created successfully");

  wss.on("connection", async (socket: AuthenticatedWebSocket, req) => {
    console.log(`[WS] New connection attempt from ${req.socket.remoteAddress}`);
    try {
      const url = req.url || "";
      console.log(`[WS] Connection URL: ${url}`);

      const params = new URLSearchParams(url.split("?")[1] || "");
      const token = params.get("token");
      const orderId = params.get("orderId");

      console.log(
        `[WS] Token present: ${!!token}, OrderId present: ${!!orderId}`
      );

      if (!token || !orderId) {
        console.log(
          `[WS] Missing credentials - Token: ${!!token}, OrderId: ${!!orderId}`
        );
        socket.close(4401, "Unauthorized: Missing token or orderId");
        return;
      }

      // Verify JWT token
      console.log(`[WS] Verifying JWT token...`);
      console.log(`[WS] Using JWT secret: ${JWT_SECRET}`);
      const payload = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        username: string;
      };
      const userId = payload.sub;
      console.log(
        `[WS] Token verified for user: ${payload.username} (${userId})`
      );

      // Check if user has access to this order (allow demo orders)
      if (!orderId.startsWith("demo-")) {
        const order = await storage.getOrder(orderId);
        if (
          !order ||
          (order.requesterId !== userId && order.providerId !== userId)
        ) {
          socket.close(4403, "Forbidden: No access to this order");
          return;
        }
      }

      // Authenticate the socket
      socket.userId = userId;
      socket.orderId = orderId;

      console.log(
        `[WS] User ${payload.username} connected to order ${orderId}`
      );

      socket.on("message", (raw) => {
        try {
          // Rate limiting
          if (!wsRateLimit(userId)) {
            socket.send(
              JSON.stringify({
                type: "error",
                message: "Rate limit exceeded. Please slow down.",
              })
            );
            return;
          }

          const data = JSON.parse(raw.toString());

          if (!data.type) {
            socket.send(
              JSON.stringify({
                type: "error",
                message: "Invalid message format",
              })
            );
            return;
          }

          // Handle different message types
          switch (data.type) {
            case "chat_message":
            case "message":
              handleChatMessage(socket, data, wss);
              break;
            case "typing":
              handleTyping(socket, data, wss);
              break;
            case "order_update":
              handleOrderUpdate(socket, data, wss);
              break;
            default:
              // For demo, echo back any message
              if (socket.orderId?.startsWith("demo-")) {
                socket.send(
                  JSON.stringify({
                    type: "message_received",
                    echo: data,
                    timestamp: new Date().toISOString(),
                  })
                );
              } else {
                socket.send(
                  JSON.stringify({
                    type: "error",
                    message: "Unknown message type",
                  })
                );
              }
          }
        } catch (error) {
          console.error("[WS] Error processing message:", error);
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            })
          );
        }
      });

      socket.on("close", () => {
        console.log(
          `[WS] User ${payload.username} disconnected from order ${orderId}`
        );
      });

      socket.on("error", (error) => {
        console.error(`[WS] Socket error for user ${payload.username}:`, error);
      });

      // Send welcome message
      socket.send(
        JSON.stringify({
          type: "connected",
          message: "WebSocket connected successfully",
          orderId,
        })
      );
    } catch (error) {
      console.error("[WS] Authentication error:", error);
      try {
        socket.close(4401, "Unauthorized: Invalid token");
      } catch {}
    }
  });

  return wss;
}

async function handleChatMessage(
  socket: AuthenticatedWebSocket,
  data: any,
  wss: WebSocketServer
) {
  if (!socket.userId || !socket.orderId) return;

  try {
    // Store the message in database (skip for demo orders)
    let message;
    if (!socket.orderId?.startsWith("demo-")) {
      message = await storage.createChatMessage({
        orderId: socket.orderId,
        senderId: socket.userId,
        message: data.content || data.text,
        messageType: data.messageType || "text",
        metadata: data.metadata,
      });
    } else {
      // For demo orders, create a fake message object
      message = {
        id: `demo-${Date.now()}`,
        orderId: socket.orderId,
        senderId: socket.userId,
        message: data.content || data.text,
        messageType: data.messageType || "text",
        metadata: data.metadata,
        createdAt: new Date(),
      };
    }

    // Broadcast to all clients in the same order
    const broadcastMessage = {
      type: "chat_message",
      message,
    };

    wss.clients.forEach((client: AuthenticatedWebSocket) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.orderId === socket.orderId
      ) {
        client.send(JSON.stringify(broadcastMessage));
      }
    });
  } catch (error) {
    console.error("[WS] Error handling chat message:", error);
    socket.send(
      JSON.stringify({
        type: "error",
        message: "Failed to send message",
      })
    );
  }
}

function handleTyping(
  socket: AuthenticatedWebSocket,
  data: any,
  wss: WebSocketServer
) {
  if (!socket.userId || !socket.orderId) return;

  // Broadcast typing indicator to other users in the same order
  const typingMessage = {
    type: "typing",
    userId: socket.userId,
    isTyping: data.isTyping,
  };

  wss.clients.forEach((client: AuthenticatedWebSocket) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.orderId === socket.orderId &&
      client.userId !== socket.userId
    ) {
      client.send(JSON.stringify(typingMessage));
    }
  });
}

async function handleOrderUpdate(
  socket: AuthenticatedWebSocket,
  data: any,
  wss: WebSocketServer
) {
  if (!socket.userId || !socket.orderId) return;

  try {
    // Get updated order data (skip for demo orders)
    if (socket.orderId?.startsWith("demo-")) return;

    const order = await storage.getOrder(socket.orderId);
    if (!order) return;

    // Broadcast order update to all clients in the same order
    const updateMessage = {
      type: "order_update",
      order,
      updatedBy: socket.userId,
    };

    wss.clients.forEach((client: AuthenticatedWebSocket) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.orderId === socket.orderId
      ) {
        client.send(JSON.stringify(updateMessage));
      }
    });
  } catch (error) {
    console.error("[WS] Error handling order update:", error);
  }
}

// Utility function to broadcast to specific order
export function broadcastToOrder(
  wss: WebSocketServer,
  orderId: string,
  message: any,
  excludeUserId?: string
) {
  wss.clients.forEach((client: AuthenticatedWebSocket) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.orderId === orderId &&
      client.userId !== excludeUserId
    ) {
      client.send(JSON.stringify(message));
    }
  });
}
