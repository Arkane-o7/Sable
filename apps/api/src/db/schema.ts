import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

// ============================================
// Users Table
// ============================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  workosId: text('workos_id').unique().notNull(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workosIdIdx: index('users_workos_id_idx').on(table.workosId),
  emailIdx: index('users_email_idx').on(table.email),
}))

// ============================================
// Conversations Table
// ============================================
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').default('New Chat'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('conversations_user_id_idx').on(table.userId),
}))

// ============================================
// Messages Table
// ============================================
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index('messages_conversation_id_idx').on(table.conversationId),
}))

// ============================================
// Preferences Table
// ============================================
export const preferences = pgTable('preferences', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  theme: text('theme').default('dark'),
  defaultModel: text('default_model').default('llama-3.3-70b-versatile'),
  shortcuts: jsonb('shortcuts').default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// Integrations Table (OAuth tokens)
// ============================================
export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(), // 'slack' | 'google' | 'spotify' | 'github'
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userProviderIdx: index('integrations_user_provider_idx').on(table.userId, table.provider),
}))

// ============================================
// Type Exports
// ============================================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type Preferences = typeof preferences.$inferSelect
export type NewPreferences = typeof preferences.$inferInsert

export type Integration = typeof integrations.$inferSelect
export type NewIntegration = typeof integrations.$inferInsert
