CREATE TABLE `completion_events` (
	`submission_id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`difficulty` text NOT NULL,
	`point_units` integer NOT NULL,
	`completed_at` text NOT NULL,
	`completed_day` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `completion_events_day_question_idx` ON `completion_events` (`completed_day`,`question_id`);