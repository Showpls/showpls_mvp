import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  pgEnum,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for better type safety
export const orderStatusEnum = pgEnum("order_status", [
  "CREATED",
  "FUNDED",
  "IN_PROGRESS",
  "AT_LOCATION",
  "DRAFT_CONTENT",
  "DELIVERED",
  "APPROVED",
  "DISPUTED",
  "REFUNDED",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "OPEN",
  "EVIDENCE_SUBMITTED",
  "UNDER_REVIEW",
  "RESOLVED",
  "ESCALATED",
]);

export const mediaTypeEnum = pgEnum("media_type", ["photo", "video", "live"]);
export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "file",
  "quick_reply",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "ORDER_ACCEPTED",
  "ORDER_DELIVERED",
  "ORDER_APPROVED",
  "ORDER_DISPUTED",
  "ORDER_REFUNDED",
  "TIP_RECEIVED",
]);
export const providerRankEnum = pgEnum("provider_rank", [
  "BASIC",
  "TRUSTED",
  "PRO",
  "LIVE_PRO",
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id").notNull().unique(),
  username: text("username").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  languageCode: varchar("language_code", { length: 10 }).default("en"),
  walletAddress: text("wallet_address"),
  isProvider: boolean("is_provider").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalRatings: integer("total_ratings").default(0),
  totalOrders: integer("total_orders").default(0),
  isPremium: boolean("is_premium").default(false),
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").default(true),
  portfolioLinks: jsonb("portfolio_links").$type<string[]>().default([]),
  providerRank: providerRankEnum("provider_rank").default("BASIC"),
  totalTipsReceived: numeric("total_tips_received", {
    precision: 30,
    scale: 0,
  }).default("0"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    requesterId: varchar("requester_id")
      .notNull()
      .references(() => users.id),
    providerId: varchar("provider_id").references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    location: jsonb("location")
      .$type<{ lat: number; lng: number; address?: string }>()
      .notNull(),
    budgetNanoTon: numeric("budget_nano_ton", {
      precision: 30,
      scale: 0,
    }).notNull(), // Store in nano-TON
    platformFeeBps: integer("platform_fee_bps").notNull().default(250), // 2.5% in basis points
    status: orderStatusEnum("status").notNull().default("CREATED"),
    escrowAddress: text("escrow_address"),
    proofUri: text("proof_uri"),
    milestones: jsonb("milestones").$type<{
      atLocation?: { paid: boolean; amount: string; paidAt?: string };
      draftContent?: { paid: boolean; amount: string; paidAt?: string };
      final?: { paid: boolean; amount: string; paidAt?: string };
    }>(),
    tipAmount: numeric("tip_amount", { precision: 30, scale: 0 }).default("0"),
    estimatedCompletionAt: timestamp("estimated_completion_at"),
    acceptedAt: timestamp("accepted_at"),
    deliveredAt: timestamp("delivered_at"),
    approvedAt: timestamp("approved_at"),
    isSampleOrder: boolean("is_sample_order").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    statusIdx: index("orders_status_idx").on(table.status),
    requesterIdx: index("orders_requester_idx").on(table.requesterId),
    providerIdx: index("orders_provider_idx").on(table.providerId),
    locationIdx: index("orders_location_idx").on(
      sql`((location->>'lat')::numeric), ((location->>'lng')::numeric)`
    ),
    sampleOrderIdx: index("orders_sample_idx").on(table.isSampleOrder),
  })
);

export const ratings = pgTable("ratings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderId: varchar("order_id")
    .notNull()
    .references(() => orders.id),
  fromUserId: varchar("from_user_id")
    .notNull()
    .references(() => users.id),
  toUserId: varchar("to_user_id")
    .notNull()
    .references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderId: varchar("order_id")
    .notNull()
    .references(() => orders.id),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, image, file
  metadata: jsonb("metadata").$type<{
    fileName?: string;
    fileSize?: number;
    mediaUrl?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id),
  type: varchar("type", { length: 30 }).notNull(), // ORDER_ACCEPTED, ORDER_DELIVERED, ORDER_APPROVED, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Idempotency table for critical operations
export const idempotentRequests = pgTable(
  "idempotent_requests",
  {
    id: varchar("id").primaryKey(),
    operation: varchar("operation", { length: 50 }).notNull(),
    response: jsonb("response").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    operationIdx: index("idempotent_operation_idx").on(table.operation),
  })
);

// SLA timers and audit trail
export const disputeEvents = pgTable("dispute_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  disputeId: varchar("dispute_id").notNull(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disputes = pgTable(
  "disputes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: varchar("order_id")
      .notNull()
      .references(() => orders.id),
    disputeId: varchar("dispute_id").notNull().unique(),
    openedBy: varchar("opened_by")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull(),
    evidence: jsonb("evidence").$type<string[]>().default([]),
    status: disputeStatusEnum("status").notNull().default("OPEN"),
    arbiterDecision: varchar("arbiter_decision", { length: 20 }), // approve, refund, partial
    resolution: text("resolution"),
    slaDeadline: timestamp("sla_deadline"), // Auto-resolve deadline (48 hours)
    createdAt: timestamp("created_at").defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => ({
    orderIdx: index("disputes_order_idx").on(table.orderId),
    statusIdx: index("disputes_status_idx").on(table.status),
    slaIdx: index("disputes_sla_idx").on(table.slaDeadline),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requestedOrders: many(orders, { relationName: "requester" }),
  providedOrders: many(orders, { relationName: "provider" }),
  sentRatings: many(ratings, { relationName: "fromUser" }),
  receivedRatings: many(ratings, { relationName: "toUser" }),
  chatMessages: many(chatMessages),
  notifications: many(notifications),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  requester: one(users, {
    fields: [orders.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  provider: one(users, {
    fields: [orders.providerId],
    references: [users.id],
    relationName: "provider",
  }),
  ratings: many(ratings),
  chatMessages: many(chatMessages),
  notifications: many(notifications),
  disputes: many(disputes),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  order: one(orders, {
    fields: [ratings.orderId],
    references: [orders.id],
  }),
  fromUser: one(users, {
    fields: [ratings.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [ratings.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  order: one(orders, {
    fields: [chatMessages.orderId],
    references: [orders.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id],
  }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  order: one(orders, {
    fields: [disputes.orderId],
    references: [orders.id],
  }),
  openedByUser: one(users, {
    fields: [disputes.openedBy],
    references: [users.id],
  }),
}));

// New tables for MVP improvements
export const orderTemplates = pgTable("order_templates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // товар, недвижимость, мероприятие, ностальгия
  title: text("title").notNull(),
  description: text("description").notNull(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  budgetRange: jsonb("budget_range")
    .$type<{ min: string; max: string }>()
    .notNull(),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quickReplies = pgTable("quick_replies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // status_update, eta, clarification
  isDefault: boolean("is_default").default(false),
  usageCount: integer("usage_count").default(0),
  languageCode: varchar("language_code", { length: 10 })
    .notNull()
    .default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tips = pgTable("tips", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderId: varchar("order_id")
    .notNull()
    .references(() => orders.id),
  fromUserId: varchar("from_user_id")
    .notNull()
    .references(() => users.id),
  toUserId: varchar("to_user_id")
    .notNull()
    .references(() => users.id),
  amountNanoTon: numeric("amount_nano_ton", {
    precision: 30,
    scale: 0,
  }).notNull(),
  message: text("message"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onboardingSteps = pgTable(
  "onboarding_steps",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    stepName: varchar("step_name", { length: 50 }).notNull(), // wallet_connected, first_order, first_chat
    completedAt: timestamp("completed_at"),
    skippedAt: timestamp("skipped_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userStepIdx: index("onboarding_user_step_idx").on(
      table.userId,
      table.stepName
    ),
  })
);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Updated insertOrderSchema with explicit types
export const insertOrderSchema = createInsertSchema(orders, {
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  milestones: z
    .object({
      atLocation: z.object({
        paid: z.boolean(),
        amount: z.string(),
        paidAt: z.string().optional(),
      }),
      draftContent: z.object({
        paid: z.boolean(),
        amount: z.string(),
        paidAt: z.string().optional(),
      }),
      final: z.object({
        paid: z.boolean(),
        amount: z.string(),
        paidAt: z.string().optional(),
      }),
    })
    .optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  providerId: true,
  escrowAddress: true,
  proofUri: true,
  deliveredAt: true,
  approvedAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertOrderTemplateSchema = createInsertSchema(
  orderTemplates
).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertQuickReplySchema = createInsertSchema(quickReplies).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
});

export const insertOnboardingStepSchema = createInsertSchema(
  onboardingSteps
).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type OrderTemplate = typeof orderTemplates.$inferSelect;
export type InsertOrderTemplate = z.infer<typeof insertOrderTemplateSchema>;
export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertQuickReply = z.infer<typeof insertQuickReplySchema>;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type OnboardingStep = typeof onboardingSteps.$inferSelect;
export type InsertOnboardingStep = z.infer<typeof insertOnboardingStepSchema>;

// Extended types with relations
export type OrderWithRelations = Order & {
  requester: User;
  provider?: User;
  ratings: Rating[];
  chatMessages: ChatMessage[];
};

export type UserWithStats = User & {
  requestedOrdersCount: number;
  providedOrdersCount: number;
  averageRating: number;
};
