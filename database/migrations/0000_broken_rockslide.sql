CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255),
	`provider_type` varchar(50),
	`provider_id` varchar(255),
	`email_verified_at` timestamp,
	`password_hash` varchar(255),
	`is_banned` boolean DEFAULT false,
	`ban_reason` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `idx_users_provider` ON `users` (`provider_type`,`provider_id`,`deleted_at`);