CREATE TABLE `redirects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_path` text NOT NULL,
	`to_path` text NOT NULL,
	`status_code` integer DEFAULT 301,
	`hits` integer DEFAULT 0,
	`active` integer DEFAULT true,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `redirects_from_path_unique` ON `redirects` (`from_path`);--> statement-breakpoint
CREATE INDEX `redirects_from_path_idx` ON `redirects` (`from_path`);--> statement-breakpoint
CREATE INDEX `redirects_active_idx` ON `redirects` (`active`);--> statement-breakpoint
DROP INDEX `stock_reservations_stripe_session_id_unique`;