CREATE TABLE `game_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gold` integer NOT NULL,
	`kills` integer NOT NULL,
	`timestamp` text NOT NULL,
	`created_at` text NOT NULL
);
