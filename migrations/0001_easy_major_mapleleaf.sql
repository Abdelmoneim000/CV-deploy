ALTER TABLE "shares" DROP CONSTRAINT "shares_cv_id_cvs_id_fk";
--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_cv_id_cv_versions_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cv_versions"("id") ON DELETE no action ON UPDATE no action;