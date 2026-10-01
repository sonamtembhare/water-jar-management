"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@repo/types";

import {
  useCashPaidMutation,
  useTransitionOrderMutation,
  useVendorOrderDetailQuery,
} from "@/features/api";
import { OrderDetailView } from "@/components/order-detail";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";

export default function VendorOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: order, isLoading } = useVendorOrderDetailQuery(id);
  const [transition, { isLoading: transitioning }] = useTransitionOrderMutation();
  const [cashPaid, { isLoading: cashing }] = useCashPaidMutation();

  async function handleTransition(status: OrderStatus) {
    if (!order) return;
    try {
      await transition({ id: order.id, status }).unwrap();
      toast.success(`Order marked as ${status.replaceAll("_", " ")}`);
    } catch (e) {
      const msg =
        (e as { data?: { error?: string } })?.data?.error ?? "Transition failed";
      toast.error(msg);
    }
  }

  async function handleCashPaid() {
    if (!order) return;
    try {
      await cashPaid(order.id).unwrap();
      toast.success("Cash payment marked as received");
    } catch {
      toast.error("Could not mark payment received");
    }
  }

  const status = order?.status;
  const isCash = order?.paymentMethod === "cash";
  const isPaid = order?.paymentStatus === "paid";

  return (
    <>
      <PageHeader
        title="Order details"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/vendor/orders">
              <ArrowLeft /> Back
            </Link>
          </Button>
        }
      />
      <OrderDetailView
        order={order}
        loading={isLoading}
        header={
          order && (
            <div className="flex flex-wrap items-center gap-2">
              {status && shouldShowTransition(status) && (
                <Button
                  onClick={() =>
                    handleTransition(nextStatus(status) ?? status)
                  }
                  disabled={transitioning}
                >
                  {transitioning && <Loader2 className="animate-spin" />}
                  Mark {nextStatus(status)?.replaceAll("_", " ")}
                </Button>
              )}
              {isCash && !isPaid && status === "delivered" && (
                <Button
                  variant="accent"
                  onClick={handleCashPaid}
                  disabled={cashing}
                >
                  {cashing && <Loader2 className="animate-spin" />} Mark cash paid
                </Button>
              )}
            </div>
          )
        }
      />
    </>
  );
}

function shouldShowTransition(status: OrderStatus): boolean {
  return ["pending", "accepted", "out_for_delivery"].includes(status);
}

function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === "pending") return "accepted";
  if (status === "accepted") return "out_for_delivery";
  if (status === "out_for_delivery") return "delivered";
  return null;
}