CREATE TABLE `ai_predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`referral_id` text NOT NULL,
	`specialty` text NOT NULL,
	`confidence` real NOT NULL,
	`rationale` text NOT NULL,
	`source_chart_entry_ids` text NOT NULL,
	`warnings` text,
	`model_label` text,
	`is_fallback` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`referral_id`) REFERENCES `referrals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chart_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`entry_type` text NOT NULL,
	`entry_date` text NOT NULL,
	`summary` text NOT NULL,
	`full_text` text NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`dob` text NOT NULL,
	`sex` text NOT NULL,
	`address_summary` text,
	`lat` real,
	`lng` real,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `referral_draft_content` (
	`id` text PRIMARY KEY NOT NULL,
	`referral_id` text NOT NULL,
	`reason` text,
	`history` text,
	`medications` text,
	`allergies` text,
	`investigations` text,
	`notes` text,
	`attachments` text,
	`is_ai_generated` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`referral_id`) REFERENCES `referrals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `referral_patient_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`referral_id` text NOT NULL,
	`max_distance_km` real,
	`preferred_specialist_ids` text,
	`excluded_specialist_ids` text,
	`language` text,
	`timing_notes` text,
	`other_notes` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`referral_id`) REFERENCES `referrals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `referral_rejection_reasons` (
	`id` text PRIMARY KEY NOT NULL,
	`referral_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`referral_id`) REFERENCES `referrals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`specialty` text,
	`urgency` text DEFAULT 'routine' NOT NULL,
	`demo_persona` text DEFAULT 'physician' NOT NULL,
	`assigned_specialist_id` text,
	`chart_window_days` integer DEFAULT 180,
	`additional_instructions` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_specialist_id`) REFERENCES `specialists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `specialist_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`specialist_id` text NOT NULL,
	`next_available_at` text,
	`capacity_notes` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`specialist_id`) REFERENCES `specialists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `specialist_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`specialist_id` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`label` text,
	`address` text,
	FOREIGN KEY (`specialist_id`) REFERENCES `specialists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `specialists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`clinic` text NOT NULL,
	`specialty` text NOT NULL,
	`subspecialty` text,
	`contact_email` text,
	`contact_phone` text,
	`accepting_referrals` integer DEFAULT true NOT NULL,
	`case_types` text,
	`referral_types` text,
	`procedures` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referral_draft_content_referral_id_unique` ON `referral_draft_content` (`referral_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `referral_patient_preferences_referral_id_unique` ON `referral_patient_preferences` (`referral_id`);