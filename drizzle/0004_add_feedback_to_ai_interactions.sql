ALTER TABLE "ai_interactions" ADD COLUMN "user_feedback" varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD COLUMN "feedback_note" text;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD COLUMN "langsmith_trace_id" text;