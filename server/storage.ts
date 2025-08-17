import {
  users,
  orders,
  notifications,
  disputes,
  type User,
  type InsertUser,
  type Order,
  type InsertOrder,
  type InsertNotification,
  type Dispute,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { parseLocation, parseMilestones } from "./utils/orderHelpers";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Order management
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;
  getUserOrders(userId: string): Promise<Order[]>;
  getUserRelatedOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getNearbyOrders(lat: number, lng: number, radiusKm: number): Promise<Order[]>;
  // Optional chat persistence for MVP
  getChatMessages?(orderId: string): Promise<any[]>;
  createChatMessage?(message: { orderId: string; senderId: string; message: string; messageType?: string; metadata?: any }): Promise<any>;
  
  // Notification management
  createNotification(notification: InsertNotification): Promise<any>;

  // Dispute management
  getOrderDisputes(orderId: string): Promise<Dispute[]>;
  createDispute(params: { orderId: string; openedBy: string; reason: string; evidence?: string[] }): Promise<Dispute>;
  addDisputeEvidence(disputeId: string, evidence: string[]): Promise<Dispute>;
}

// In-memory storage for development (replace with DatabaseStorage for production)
class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(users.telegramId, telegramId),
    });

    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser]: User[] = await db
      .insert(users)
      .values({
        ...user,
        isProvider: user.isProvider || false,
        rating: "0",
        totalRatings: 0,
        totalOrders: 0,
        isPremium: false,
        isActive: true,
        portfolioLinks: [],
        providerRank: "BASIC",
        totalTipsReceived: "0",
        onboardingCompleted: false,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values({
        ...order,
        location: parseLocation(order.location),
        milestones: parseMilestones(order.milestones),
        isSampleOrder: order.isSampleOrder ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    return order;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return updatedOrder;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.requesterId, userId),
    });

    return userOrders;
  }

  async getUserRelatedOrders(userId: string): Promise<Order[]> {
    const userOrders = await db.query.orders.findMany({
      where: or(eq(orders.requesterId, userId), eq(orders.providerId, userId)),
      orderBy: [desc(orders.createdAt)],
    });

    return userOrders;
  }

  async getAllOrders(): Promise<Order[]> {
    const allOrders = await db.query.orders.findMany({
      where: eq(orders.status, 'CREATED'), // Only show available orders
    });

    return allOrders;
  }

  async getNearbyOrders(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Order[]> {
    const orders = await db.query.orders.findMany({});
    return orders.filter((order) => {
      if (!order.location || order.status !== "CREATED") return false;

      const distance = this.calculateDistance(
        lat,
        lng,
        order.location.lat,
        order.location.lng
      );
      return distance <= radiusKm;
    });
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Basic in-DB chat persistence could be wired to chatMessages table; placeholder to satisfy API
  async getChatMessages(orderId: string): Promise<any[]> {
    try {
      const messages = await (db as any).query.chatMessages.findMany({
        where: eq((require("@shared/schema").chatMessages as any).orderId, orderId),
      });
      return messages || [];
    } catch {
      return [];
    }
  }

  async createChatMessage(message: { orderId: string; senderId: string; message: string; messageType?: string; metadata?: any }): Promise<any> {
    const [row] = await (db as any)
      .insert((require("@shared/schema").chatMessages as any))
      .values({
        orderId: message.orderId,
        senderId: message.senderId,
        message: message.message,
        messageType: message.messageType || 'text',
        metadata: message.metadata,
      })
      .returning();
    return row;
  }

  async createNotification(notification: InsertNotification): Promise<any> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        isRead: false,
        createdAt: new Date(),
      })
      .returning();

    return newNotification;
  }

  async getOrderDisputes(orderId: string): Promise<Dispute[]> {
    const rows = await (db as any).query.disputes.findMany({
      where: eq((disputes as any).orderId, orderId),
    });
    return rows as Dispute[];
  }

  async createDispute(params: { orderId: string; openedBy: string; reason: string; evidence?: string[] }): Promise<Dispute> {
    const disputeId = randomUUID();
    const [row] = await (db as any)
      .insert(disputes as any)
      .values({
        orderId: params.orderId,
        openedBy: params.openedBy,
        reason: params.reason,
        evidence: params.evidence ?? [],
        disputeId,
        status: 'OPEN',
      })
      .returning();
    return row as Dispute;
  }

  async addDisputeEvidence(disputeId: string, evidence: string[]): Promise<Dispute> {
    // Fetch current evidence and append
    const existing = await (db as any).query.disputes.findFirst({
      where: eq((disputes as any).disputeId, disputeId),
    });
    if (!existing) throw new Error('Dispute not found');
    const nextEvidence = [
      ...((existing.evidence as string[] | null) ?? []),
      ...evidence,
    ];

    const [updated] = await (db as any)
      .update(disputes as any)
      .set({ evidence: nextEvidence })
      .where(eq((disputes as any).disputeId, disputeId))
      .returning();

    return updated as Dispute;
  }
}

export const storage = new DatabaseStorage();
