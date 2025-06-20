ALTER TABLE "activities" DROP CONSTRAINT "valid_type";--> statement-breakpoint
ALTER TABLE "activity_type_schemas" DROP CONSTRAINT "valid_activity_type";--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "valid_type" CHECK (type IN ('sleep', 'feed', 'diaper'));--> statement-breakpoint
ALTER TABLE "activity_type_schemas" ADD CONSTRAINT "valid_activity_type" CHECK (activity_type IN ('sleep', 'feed', 'diaper'));