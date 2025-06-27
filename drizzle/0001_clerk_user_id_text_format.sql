-- Drop foreign key constraints first
ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_created_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "ai_interactions" DROP CONSTRAINT IF EXISTS "ai_interactions_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "user_children" DROP CONSTRAINT IF EXISTS "user_children_user_id_users_id_fk";--> statement-breakpoint

-- Change column types
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ai_interactions" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_children" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint

-- Recreate foreign key constraints
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_children" ADD CONSTRAINT "user_children_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;