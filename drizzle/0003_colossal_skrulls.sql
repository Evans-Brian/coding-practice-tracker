CREATE TABLE `study_credits` (
	`id` text PRIMARY KEY NOT NULL,
	`point_units` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`earned_day` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `study_credits_day_idx` ON `study_credits` (`earned_day`);