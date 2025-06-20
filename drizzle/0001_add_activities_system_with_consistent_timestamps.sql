CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"child_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"session_id" uuid,
	"details" jsonb DEFAULT '{}'::jsonb,
	"ai_confidence" numeric(3, 2),
	"original_input" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "valid_times" CHECK (end_time IS NULL OR end_time >= start_time),
	CONSTRAINT "valid_confidence" CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
	CONSTRAINT "valid_type" CHECK (type IN ('sleep', 'feed', 'diaper', 'medicine', 'weight', 'mood')),
	CONSTRAINT "session_logic" CHECK (
    (end_time IS NULL AND session_id IS NOT NULL) OR
    (end_time IS NOT NULL) OR
    (session_id IS NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "activity_type_schemas" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"is_session_based" boolean NOT NULL,
	"details_schema" jsonb NOT NULL,
	"common_fields" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_type_schemas_activity_type_unique" UNIQUE("activity_type"),
	CONSTRAINT "valid_activity_type" CHECK (activity_type IN ('sleep', 'feed', 'diaper', 'medicine', 'weight', 'mood'))
);
--> statement-breakpoint
CREATE TABLE "ai_interactions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"child_id" uuid,
	"mcp_tool_name" varchar(100),
	"user_input" text NOT NULL,
	"ai_interpretation" jsonb NOT NULL,
	"model_used" varchar(100) NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"activity_ids" jsonb DEFAULT '[]'::jsonb,
	"error_message" text,
	"processing_time_ms" integer,
	"token_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_tools" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"tool_name" varchar(100) NOT NULL,
	"tool_description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"input_schema" jsonb NOT NULL,
	"output_schema" jsonb NOT NULL,
	"usage_frequency" varchar(20) DEFAULT 'common',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_tools_tool_name_unique" UNIQUE("tool_name")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;