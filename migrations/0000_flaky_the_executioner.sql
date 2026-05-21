CREATE TYPE "public"."habit_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"completion_date" timestamp DEFAULT now() NOT NULL,
	"note" text,
	"count" integer DEFAULT 1 NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entries_habit_id_date_unique" UNIQUE("habit_id","date")
);
--> statement-breakpoint
CREATE TABLE "habit_daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"completion_count" integer DEFAULT 0 NOT NULL,
	"target_count" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"create_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "habit_daily_stats_habit_id_date_unique" UNIQUE("habit_id","date")
);
--> statement-breakpoint
CREATE TABLE "habit_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"time_minutes" integer NOT NULL,
	"time_zone" varchar(50) NOT NULL,
	"days_of_week" integer[] DEFAULT '{}' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"frequency" "habit_frequency" NOT NULL,
	"frequency_interval" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "habit_tags_habit_id_tag_id_unique" UNIQUE("habit_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"frequency" "habit_frequency" NOT NULL,
	"frequency_interval" integer DEFAULT 1 NOT NULL,
	"target_count" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#6B7280' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_daily_stats" ADD CONSTRAINT "habit_daily_stats_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_reminders" ADD CONSTRAINT "habit_reminders_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_tags" ADD CONSTRAINT "habit_tags_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_tags" ADD CONSTRAINT "habit_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_habit_date_idx" ON "entries" USING btree ("habit_id","date");--> statement-breakpoint
CREATE INDEX "habit_daily_stats_habit_date_idx" ON "habit_daily_stats" USING btree ("habit_id","date");--> statement-breakpoint
CREATE INDEX "habit_reminder_idx" ON "habit_reminders" USING btree ("habit_id","enabled","time_minutes");