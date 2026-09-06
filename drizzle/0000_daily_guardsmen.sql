CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`customer` text NOT NULL,
	`phone` text NOT NULL,
	`date` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`block_start` integer NOT NULL,
	`block_end` integer NOT NULL,
	`staff` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`services` text NOT NULL,
	`total` integer NOT NULL,
	`address` text NOT NULL,
	`notes` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_owner_day_staff` ON `bookings` (`owner`,`date`,`staff`);--> statement-breakpoint
CREATE TABLE `services` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`duration` integer NOT NULL,
	`home` integer NOT NULL,
	`active` integer NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`created` text NOT NULL
);
