CREATE TABLE `lovely_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`owner_hash` text NOT NULL,
	`password_hash` text,
	`salt` text,
	`email` text NOT NULL,
	`reset_hash` text,
	`reset_expires` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lovely_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
