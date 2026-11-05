CREATE TABLE `leetcode_daily_completions` (
	`question_id` text NOT NULL,
	`completed_day` text NOT NULL,
	`name` text NOT NULL,
	`difficulty` text NOT NULL,
	`point_units` integer NOT NULL,
	`imported_at` text NOT NULL,
	PRIMARY KEY(`question_id`, `completed_day`)
);
--> statement-breakpoint
CREATE INDEX `leetcode_completions_day_idx` ON `leetcode_daily_completions` (`completed_day`);--> statement-breakpoint
CREATE TABLE `leetcode_history_import` (
	`id` text PRIMARY KEY NOT NULL,
	`first_day` text NOT NULL,
	`last_day` text NOT NULL,
	`reviewed_problems` integer NOT NULL,
	`expected_problems` integer NOT NULL,
	`complete` integer DEFAULT 0 NOT NULL,
	`imported_at` text NOT NULL,
	`source_url` text NOT NULL
);
