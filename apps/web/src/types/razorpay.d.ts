export {};

declare global {
  interface Window {
    Razorpay?: {
      new (options: {
        key: string;
        amount: number;
        currency: string;
        order_id: string;
        name: string;
        description: string;
        prefill: { name: string; email: string; contact: string };
        handler: (response: {
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => void;
        modal?: { ondismiss?: () => void };
      }): {
        open(): void;
        on?(
          event: "payment.failed",
          callback: (event: {
            error: { code?: string; description?: string; reason?: string };
          }) => void,
        ): void;
      };
    };
  }
}