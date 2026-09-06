CREATE TABLE `desk_members` (
	`owner` text NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`staff_id` text,
	`active` integer NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`owner`, `email`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `desk_members_owner_user` ON `desk_members` (`owner`,`user_id`);