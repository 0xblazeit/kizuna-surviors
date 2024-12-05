import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const gameStats = sqliteTable('game_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gold: integer('gold').notNull(),
  kills: integer('kills').notNull(),
  timestamp: text('timestamp').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
