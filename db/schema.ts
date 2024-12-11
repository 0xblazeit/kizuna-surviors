import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const gameStats = sqliteTable('leaderboard', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userName: text('user_name').notNull(),
  walletAddress: text('wallet_address').notNull(),
  gold: integer('gold').notNull(),
  kills: integer('kills').notNull(),
  waveNumber: integer('wave_number').notNull(),
  timestamp: text('timestamp').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
