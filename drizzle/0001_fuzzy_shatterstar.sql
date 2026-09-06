CREATE TABLE `customers` (
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`verified_at` text NOT NULL,
	PRIMARY KEY(`owner`, `user_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_owner_phone_unique` ON `customers` (`owner`,`phone`);--> statement-breakpoint
CREATE TABLE `verification_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`phone` text NOT NULL,
	`name` text NOT NULL,
	`provider_sid` text NOT NULL,
	`expires` integer NOT NULL,
	`attempts` integer NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_owner_user` ON `verification_challenges` (`owner`,`user_id`);--> statement-breakpoint
CREATE INDEX `verification_expiry` ON `verification_challenges` (`owner`,`expires`);--> statement-breakpoint
CREATE TABLE `verification_dispatches` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`user_hash` text NOT NULL,
	`phone_hash` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `dispatch_owner_created` ON `verification_dispatches` (`owner`,`created`);--> statement-breakpoint
CREATE INDEX `dispatch_user_created` ON `verification_dispatches` (`owner`,`user_hash`,`created`);--> statement-breakpoint
CREATE INDEX `dispatch_phone_created` ON `verification_dispatches` (`owner`,`phone_hash`,`created`);