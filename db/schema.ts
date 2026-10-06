import { sqliteTable, text, integer, blob, index } from "drizzle-orm/sqlite-core";
export const models = sqliteTable("models", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  image: blob("image", { mode: "buffer" }).notNull(), mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(), sourceUrl: text("source_url").notNull(),
  sourceImageUrl: text("source_image_url").notNull(), attribution: text("attribution").notNull(),
  license: text("license").notNull(), licenseUrl: text("license_url").notNull(),
  reviewed: integer("reviewed").notNull().default(0), createdAt: integer("created_at").notNull(),
});
export const aliases = sqliteTable("aliases", { alias: text("alias").primaryKey(), name: text("name").notNull(), source: text("source").notNull() });
export const tacMappings = sqliteTable("tac_mappings", { tac: text("tac").primaryKey(), name: text("name").notNull() });
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(), name: text("name").notNull(), hash: text("hash").notNull().unique(),
  prefix: text("prefix").notNull(), createdAt: integer("created_at").notNull(),
});
export const misses = sqliteTable("misses", { query: text("query").primaryKey(), reason: text("reason").notNull(), expiresAt: integer("expires_at").notNull() });
export const limits = sqliteTable("limits", {
  key: text("key").primaryKey(), count: integer("count").notNull(), expiresAt: integer("expires_at").notNull(),
}, table => [index("limits_expiry_idx").on(table.expiresAt)]);
export const locks = sqliteTable("locks", { key: text("key").primaryKey(), token: text("token").notNull(), expiresAt: integer("expires_at").notNull() });
