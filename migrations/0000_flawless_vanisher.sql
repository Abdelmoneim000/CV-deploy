CREATE TABLE "candidate_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"first_name" text,
	"last_name" text,
	"bio" text,
	"title" text,
	"location" text,
	"website" text,
	"phone" text,
	"date_of_birth" timestamp,
	"avatar" text,
	"avatar_file_name" text,
	"current_salary" integer,
	"expected_salary" integer,
	"salary_negotiable" boolean DEFAULT true,
	"availability_date" timestamp,
	"work_preferences" jsonb DEFAULT '{}',
	"linkedin_url" text,
	"github_url" text,
	"twitter_url" text,
	"portfolio_url" text,
	"skills" jsonb DEFAULT '[]',
	"interests" jsonb DEFAULT '[]',
	"languages" jsonb DEFAULT '[]',
	"preferred_roles" jsonb DEFAULT '[]',
	"preferred_industries" jsonb DEFAULT '[]',
	"preferred_company_size" text,
	"profile_visibility" text DEFAULT 'private',
	"show_email" boolean DEFAULT false,
	"show_phone" boolean DEFAULT false,
	"show_salary" boolean DEFAULT false,
	"allow_hr_contact" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT true,
	"job_alerts" boolean DEFAULT true,
	"profile_views" integer DEFAULT 0,
	"is_premium" boolean DEFAULT false,
	"premium_expires_at" timestamp,
	"profile_views_count" integer DEFAULT 0,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cv_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"cv_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"changes" jsonb DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "cvs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"first_name" text,
	"last_name" text,
	"job_title" text,
	"department" text,
	"phone" text,
	"avatar" text,
	"avatar_file_name" text,
	"company_id" integer,
	"company_name" text NOT NULL,
	"company_website" text,
	"company_size" text,
	"company_industry" text,
	"company_location" text,
	"company_description" text,
	"company_logo" text,
	"years_of_experience" integer,
	"specializations" jsonb DEFAULT '[]',
	"hiring_sectors" jsonb DEFAULT '[]',
	"preferred_contact_method" text DEFAULT 'email',
	"working_hours" jsonb DEFAULT '{}',
	"linkedin_url" text,
	"company_linkedin_url" text,
	"can_post_jobs" boolean DEFAULT true,
	"can_view_candidates" boolean DEFAULT true,
	"can_contact_candidates" boolean DEFAULT true,
	"monthly_job_post_limit" integer DEFAULT 5,
	"is_premium" boolean DEFAULT false,
	"premium_expires_at" timestamp,
	"subscription_plan" text,
	"total_jobs_posted" integer DEFAULT 0,
	"total_candidates_contacted" integer DEFAULT 0,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"profile_type" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}',
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"viewed_profile_id" integer NOT NULL,
	"viewed_profile_type" text NOT NULL,
	"viewer_user_id" integer,
	"viewer_type" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"cv_id" integer NOT NULL,
	"share_token" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"structure" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'candidate' NOT NULL,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"reset_password_token" text,
	"reset_password_expires" timestamp,
	"verification_token" text,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_cv_id_cvs_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cvs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_profiles" ADD CONSTRAINT "hr_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_activities" ADD CONSTRAINT "profile_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewer_user_id_users_id_fk" FOREIGN KEY ("viewer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_cv_id_cvs_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cvs"("id") ON DELETE no action ON UPDATE no action;