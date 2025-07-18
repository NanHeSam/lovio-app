CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"token" varchar(64) NOT NULL,
	"inviter_user_id" text NOT NULL,
	"child_id" uuid NOT NULL,
	"invitee_email" varchar(255) NOT NULL,
	"invitee_role" varchar(20) NOT NULL,
	"personal_message" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"accepted_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "valid_invitation_status" CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
	CONSTRAINT "valid_invitee_role" CHECK (invitee_role IN ('parent', 'guardian', 'caregiver'))
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_user_id_users_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");