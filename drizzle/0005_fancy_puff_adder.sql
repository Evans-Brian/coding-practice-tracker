CREATE TABLE `common_practice_entries` (
	`queue_id` text NOT NULL,
	`position` integer NOT NULL,
	`question_id` text NOT NULL,
	PRIMARY KEY(`queue_id`, `position`),
	FOREIGN KEY (`queue_id`) REFERENCES `common_practice_queue`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "common_practice_entries_position_check" CHECK("common_practice_entries"."position" BETWEEN 1 AND 50)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `common_practice_entries_queue_question_idx` ON `common_practice_entries` (`queue_id`,`question_id`);--> statement-breakpoint
CREATE TABLE `common_practice_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
