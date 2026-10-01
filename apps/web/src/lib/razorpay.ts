"use client";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  // Single shared promise: concurrent calls wait on the same tag, and a failed
  // load clears itself so the next attempt injects a fresh script instead of
  // hanging on listeners attached to a dead tag.
  scriptPromise ??= new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    let settled = false;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      scriptPromise = null;
      if (!loaded) {
        script.remove();
      }
      resolve(loaded);
    };
    // Never let a hanging request leave Pay now stuck with no feedback.
    const timeout = window.setTimeout(() => finish(false), 15_000);
    script.addEventListener("load", () => finish(!!window.Razorpay));
    script.addEventListener("error", () => finish(false));
    if (!existing) {
      script.src = CHECKOUT_SRC;
      document.body.appendChild(script);
    }
  });
  return scriptPromise;
}

export interface RazorpayCustomer {
  name: string;
  email: string;
  contact: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  orderId: string;
  name: string;
  description: string;
  prefill: RazorpayCustomer;
  onSuccess: (paymentId: string, signature: string) => void;
  onFailure?: (error: unknown) => void;
  onPaymentFailed?: (error: unknown) => void;
}

interface RazorpayFailureEvent {
  error: {
    code?: string;
    description?: string;
    reason?: string;
  };
}

export function openRazorpayCheckout(options: RazorpayOptions) {
  if (!window.Razorpay) {
    throw new Error("Razorpay is not loaded");
  }
  const handler = new window.Razorpay({
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    order_id: options.orderId,
    name: options.name,
    description: options.description,
    prefill: options.prefill,
    handler: (response: {
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      options.onSuccess(response.razorpay_payment_id, response.razorpay_signature);
    },
    modal: {
      ondismiss: () => options.onFailure?.("dismissed"),
    },
  });
  handler.on?.("payment.failed", (event: RazorpayFailureEvent) => {
    options.onPaymentFailed?.(event);
  });
  handler.open();
}