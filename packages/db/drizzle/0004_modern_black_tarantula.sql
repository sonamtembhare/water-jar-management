CREATE TYPE "public"."order_source" AS ENUM('customer_order', 'vendor_delivery');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source" "order_source" DEFAULT 'customer_order' NOT NULL;--> statement-breakpoint
CREATE INDEX "orders_source_idx" ON "orders" USING btree ("source");