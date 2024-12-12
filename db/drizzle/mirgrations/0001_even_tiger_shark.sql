CREATE TABLE `leaderboard` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_name` text NOT NULL,
	`wallet_address` text NOT NULL,
	`profile_image` text NOT NULL,
	`gold` integer NOT NULL,
	`kills` integer NOT NULL,
	`wave_number` integer NOT NULL,
	`time_alive` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `game_stats`;