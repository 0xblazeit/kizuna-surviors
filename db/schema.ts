import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Updated SQL function to handle EST/EDT correctly
const getCurrentESTTimestamp = sql`(strftime('%Y-%m-%d %H:%M:%S', datetime('now', 'localtime'), '-5 hours'))`;

export const gameStats = sqliteTable("gameStats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username"),
  walletAddress: text("wallet_address").notNull(),
  profileImage: text("profile_image").notNull(),
  gold: integer("gold").notNull(),
  kills: integer("kills").notNull(),
  waveNumber: integer("wave_number").notNull(),
  timeAlive: text("time_alive").notNull(),
  timeAliveMS: integer("time_alive_ms").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const accountTable = sqliteTable("account", {
  userName: text("username").primaryKey().notNull(),
  walletAddress: text("wallet_address").notNull(),
  profileImage: text("profile_image").notNull(),
  createdAt: text("created_at").default(getCurrentESTTimestamp).notNull(),
  updatedAt: text("updated_at").$onUpdate(() => getCurrentESTTimestamp),
});
