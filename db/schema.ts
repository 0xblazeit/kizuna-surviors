import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const gameStats = sqliteTable("gameStats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull(),
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
