CREATE TYPE "public"."customer_relation_status" AS ENUM('running', 'closed');--> statement-breakpoint
CREATE TABLE "vendor_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "customer_relation_status" DEFAULT 'running' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor_customers" ADD CONSTRAINT "vendor_customers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_customers" ADD CONSTRAINT "vendor_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_customers_pair_idx" ON "vendor_customers" USING btree ("vendor_id","customer_id");--> statement-breakpoint
CREATE INDEX "vendor_customers_vendor_idx" ON "vendor_customers" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_customers_customer_idx" ON "vendor_customers" USING btree ("customer_id");