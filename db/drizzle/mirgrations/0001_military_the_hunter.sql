CREATE TABLE `account` (
	`username` text PRIMARY KEY NOT NULL,
	`wallet_address` text,
	`profile_image` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%S', datetime('now', 'localtime'), '-5 hours')) NOT NULL,
	`updated_at` text
);
