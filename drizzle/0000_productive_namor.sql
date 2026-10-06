CREATE TABLE `aliases` (
	`alias` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hash` text NOT NULL,
	`prefix` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_hash_unique` ON `api_keys` (`hash`);--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `limits_expiry_idx` ON `limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `locks` (
	`key` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `misses` (
	`query` text PRIMARY KEY NOT NULL,
	`reason` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image` blob NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`source_url` text NOT NULL,
	`source_image_url` text NOT NULL,
	`attribution` text NOT NULL,
	`license` text NOT NULL,
	`license_url` text NOT NULL,
	`reviewed` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tac_mappings` (
	`tac` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
