CREATE TABLE `gameStats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`wallet_address` text NOT NULL,
	`profile_image` text NOT NULL,
	`gold` integer NOT NULL,
	`kills` integer NOT NULL,
	`wave_number` integer NOT NULL,
	`time_alive` text NOT NULL,
	`time_alive_ms` integer NOT NULL,
	`created_at` text NOT NULL
);
