CREATE TABLE "job_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_user_id" integer NOT NULL,
	"keywords" text,
	"location" text,
	"work_type" text,
	"employment_type" text,
	"experience_level" text,
	"salary_min" integer,
	"category_id" integer,
	"skills" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"frequency" text DEFAULT 'daily',
	"last_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_alerts_candidate_user_id_keywords_location_unique" UNIQUE("candidate_user_id","keywords","location")
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"candidate_user_id" integer NOT NULL,
	"cv_id" integer,
	"cover_letter" text,
	"additional_notes" text,
	"portfolio_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"hr_notes" text,
	"hr_rating" integer,
	"ai_score" integer,
	"ai_analysis" jsonb DEFAULT '{}',
	"last_contacted_at" timestamp,
	"response_deadline" timestamp,
	"interview_scheduled_at" timestamp,
	"interview_type" text,
	"interview_notes" text,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp,
	CONSTRAINT "job_applications_job_id_candidate_user_id_unique" UNIQUE("job_id","candidate_user_id")
);
--> statement-breakpoint
CREATE TABLE "job_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "job_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"user_id" integer,
	"ip_address" text,
	"user_agent" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"hr_user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text,
	"company_name" text NOT NULL,
	"company_logo" text,
	"company_website" text,
	"location" text NOT NULL,
	"work_type" text NOT NULL,
	"country" text,
	"city" text,
	"category_id" integer,
	"employment_type" text NOT NULL,
	"experience_level" text NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" text DEFAULT 'USD',
	"salary_period" text DEFAULT 'yearly',
	"salary_negotiable" boolean DEFAULT true,
	"show_salary" boolean DEFAULT true,
	"required_skills" jsonb DEFAULT '[]',
	"preferred_skills" jsonb DEFAULT '[]',
	"required_education" text,
	"required_experience" integer,
	"languages" jsonb DEFAULT '[]',
	"benefits" jsonb DEFAULT '[]',
	"perks" jsonb DEFAULT '[]',
	"application_deadline" timestamp,
	"start_date" timestamp,
	"application_instructions" text,
	"application_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_urgent" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"is_remote" boolean DEFAULT false,
	"slug" text,
	"meta_title" text,
	"meta_description" text,
	"tags" jsonb DEFAULT '[]',
	"view_count" integer DEFAULT 0,
	"application_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"published_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_user_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_jobs_candidate_user_id_job_id_unique" UNIQUE("candidate_user_id","job_id")
);
--> statement-breakpoint
ALTER TABLE "hr_profiles" ALTER COLUMN "company_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "years_of_experience" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_cv_id_cvs_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cvs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_categories" ADD CONSTRAINT "job_categories_parent_id_job_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_hr_user_id_users_id_fk" FOREIGN KEY ("hr_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;