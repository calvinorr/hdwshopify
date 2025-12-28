ALTER TABLE `categories` ADD `status` text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `categories` ADD `meta_title` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `meta_description` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `featured` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `categories` ADD `hide_out_of_stock` integer DEFAULT false;