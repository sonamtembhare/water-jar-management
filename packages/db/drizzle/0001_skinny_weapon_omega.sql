ALTER TABLE "vendors" ADD COLUMN "blocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "blocked_at" timestamp;--> statement-breakpoint
CREATE INDEX "vendors_blocked_idx" ON "vendors" USING btree ("blocked");