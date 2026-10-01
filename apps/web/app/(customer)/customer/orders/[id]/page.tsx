"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";

import {
  useCancelOrderMutation,
  useCreateRazorpayOrderMutation,
  useCustomerOrderDetailQuery,
  useLazyRazorpayKeyQuery,
  useVerifyPaymentMutation,
} from "@/features/api";
import { useAppSelector } from "@/lib/hooks";
import { selectAuth } from "@/features/auth/authSlice";
import { apiErrorMessage } from "@/lib/api-error";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpay";
import { OrderDetailView } from "@/components/order-detail";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";

export default function CustomerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAppSelector(selectAuth);
  const { data: order, isLoading } = useCustomerOrderDetailQuery(id);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [createRazorpayOrder, { isLoading: creating }] =
    useCreateRazorpayOrderMutation();
  const [verifyPayment, { isLoading: verifying }] = useVerifyPaymentMutation();
  const [fetchRazorpayKey, { isFetching: fetchingKey }] =
    useLazyRazorpayKeyQuery();

  async function handlePayNow() {
    if (!order || !user) return;
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error("Could not load payment gateway. Try again.");
      return;
    }
    try {
      // Key data first: fails fast (409 not configured / 403 not owner)
      // before a Razorpay order is created.
      const key = await fetchRazorpayKey(order.id).unwrap();
      const rzp = await createRazorpayOrder({
        orderId: order.id,
      }).unwrap();

      const mismatch =
        key.orderId !== order.id ||
        key.keyId !== rzp.keyId ||
        Math.abs(key.amount - rzp.amount) > 0.01;
      if (mismatch) {
        toast.error("Payment configuration mismatch — reload and try again.");
        return;
      }

      openRazorpayCheckout({
        key: key.keyId,
        amount: key.amount,
        currency: key.currency,
        orderId: rzp.razorpayOrderId,
        name: "AquaGo",
        description: `Order ${order.orderNumber}`,
        prefill: {
          name: user.name,
          email: user.email,
          contact: order.phone || user.phone || "",
        },
        onSuccess: async (paymentId, signature) => {
          try {
            await verifyPayment({
              orderId: order.id,
              razorpayOrderId: rzp.razorpayOrderId,
              razorpayPaymentId: paymentId,
              razorpaySignature: signature,
            }).unwrap();
            toast.success("Payment successful!");
          } catch (error) {
            toast.error(
              apiErrorMessage(error, {
                fallback: "Payment could not be verified. Contact support.",
              }),
            );
          }
        },
        onFailure: () => toast.info("Payment window closed"),
        onPaymentFailed: (error) => {
          const detail =
            (error as { error?: { description?: string } })?.error
              ?.description ??
            "The payment could not be completed. Please try again.";
          toast.error(detail);
        },
      });
    } catch (error) {
      toast.error(
        apiErrorMessage(error, {
          fallback: "Could not initialise payment. Try again.",
        }),
      );
    }
  }

  async function handleCancel() {
    if (!order) return;
    try {
      await cancelOrder(order.id).unwrap();
      toast.success("Order cancelled. Deposits will be refunded.");
    } catch (error) {
      toast.error(
        apiErrorMessage(error, { fallback: "This order cannot be cancelled." }),
      );
    }
  }

  const canCancel = order && order.status === "pending";
  const canPay =
    order &&
    order.paymentMethod === "online" &&
    order.paymentStatus === "created";
  const paying = creating || verifying || fetchingKey;

  // Arriving from the catalog with ?pay=1 (online order just placed): open the
  // Razorpay modal straight away. The query param is stripped immediately so a
  // refresh does not reopen it, and the ref keeps React StrictMode's double
  // effect pass in dev from firing checkout twice.
  const autoPayAttempted = useRef(false);
  useEffect(() => {
    if (!order || !canPay || autoPayAttempted.current) return;
    const search = new URLSearchParams(window.location.search);
    if (search.get("pay") !== "1") return;
    autoPayAttempted.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    void handlePayNow();
  }, [order, canPay, handlePayNow]);

  return (
    <>
      <PageHeader
        title="Order details"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/customer/orders">
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
            <div className="flex gap-2">
              {canPay && (
                <Button
                  onClick={handlePayNow}
                  disabled={paying}
                  variant="accent"
                >
                  {paying && <Loader2 className="animate-spin" />}
                  {order.paymentStatus === "created" ? "Pay now" : "Pay now"}
                </Button>
              )}
              {canCancel && (
                <Button
                  onClick={handleCancel}
                  disabled={cancelling}
                  variant="destructive"
                >
                  {cancelling && <Loader2 className="animate-spin" />}
                  <Ban /> Cancel order
                </Button>
              )}
            </div>
          )
        }
      />
    </>
  );
}
