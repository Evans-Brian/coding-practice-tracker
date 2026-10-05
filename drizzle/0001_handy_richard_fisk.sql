ALTER TABLE `progress` ADD `submitted` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `progress` ADD `retained` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `progress` ADD `last_submission` text;
--> statement-breakpoint
UPDATE `progress` SET `retained` = 1 WHERE `completions` > 0;
