CREATE TABLE `progress` (
	`id` text PRIMARY KEY NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`completions` integer DEFAULT 0 NOT NULL,
	`tries` integer,
	`repeat` integer DEFAULT 0 NOT NULL
);
