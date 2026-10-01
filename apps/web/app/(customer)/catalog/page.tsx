"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import {
  createOrderSchema,
  formatINR,
  type CreateOrderInput,
  type Product,
} from "@repo/types";
import {
  ArrowLeft,
  Droplets,
  Loader2,
  MapPin,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import {
  useCreateOrderMutation,
  useCustomerPriceOverridesQuery,
  useCustomerProfileQuery,
  usePublicVendorsQuery,
  useVendorCatalogQuery,
} from "@/features/api";
import { apiErrorMessage } from "@/lib/api-error";
import { useAppSelector } from "@/lib/hooks";
import { selectAuth } from "@/features/auth/authSlice";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CatalogPage() {
  const router = useRouter();
  const { user } = useAppSelector(selectAuth);
  const { data: vendors, isLoading: vLoading } = usePublicVendorsQuery();
  const { data: customerProfile } = useCustomerProfileQuery(undefined, {
    skip: user?.role !== "customer",
  });
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  if (!selectedVendor) {
    return (
      <>
        <PageHeader
          title="Order water"
          description="Choose an approved water supplier and order jars."
        />
        {vLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : vendors && vendors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <Card key={v.id} className="justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <Droplets className="size-6 text-accent" />
                    <Badge variant="success">Approved</Badge>
                  </div>
                  <CardTitle>{v.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {v.description ?? "Water supply vendor"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {v.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5" /> {v.address}
                      </span>
                    )}
                    {v.phone && <span>{v.phone}</span>}
                  </div>
                  <Button
                    variant="accent"
                    onClick={() => setSelectedVendor(v.id)}
                  >
                    View products
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No vendors available yet. Please check back later.
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  return (
    <VendorOrderFlow
      vendorId={selectedVendor}
      onBack={() => setSelectedVendor(null)}
      defaultAddress={customerProfile?.customer?.address ?? ""}
      defaultCity={customerProfile?.customer?.city ?? ""}
      defaultPinCode={customerProfile?.customer?.pinCode ?? ""}
      defaultPhone={user?.phone ?? customerProfile?.customer?.phone ?? ""}
    />
  );
}

interface CartLine {
  product: Product;
  qty: number;
}

function VendorOrderFlow({
  vendorId,
  onBack,
  defaultAddress,
  defaultCity,
  defaultPinCode,
  defaultPhone,
}: {
  vendorId: string;
  onBack: () => void;
  defaultAddress: string;
  defaultCity: string;
  defaultPinCode: string;
  defaultPhone: string;
}) {
  const { data, isLoading } = useVendorCatalogQuery(vendorId);
  const { data: priceOverrides } = useCustomerPriceOverridesQuery({ vendorId });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [step, setStep] = useState<"products" | "checkout">("products");
  const [createOrder, { isLoading: placing }] = useCreateOrderMutation();
  const router = useRouter();

  const customPrices = useMemo(
    () =>
      new Map(
        (priceOverrides?.prices ?? []).map((p) => [p.productId, p.pricePerJar]),
      ),
    [priceOverrides],
  );

  const products = useMemo(
    () =>
      (data?.products ?? []).map((p) =>
        customPrices.has(p.id)
          ? { ...p, pricePerJar: customPrices.get(p.id)! }
          : p,
      ),
    [data, customPrices],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(
      createOrderSchema.omit({ items: true }),
    ) as unknown as Resolver<CreateOrderInput>,
    defaultValues: {
      vendorId,
      address: defaultAddress,
      city: defaultCity,
      pinCode: defaultPinCode,
      phone: defaultPhone,
      paymentMethod: "cash",
    },
  });

  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (step === "checkout" && cart.length === 0) {
      setStep("products");
      toast.info("Your cart is empty.");
    }
  }, [step, cart.length]);

  function addLine(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? {
                ...l,
                qty:
                  l.qty + 1 > Math.max(l.product.availableStock, 1)
                    ? l.qty
                    : l.qty + 1,
              }
            : l,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === productId
            ? { ...l, qty: Math.max(0, l.qty + delta) }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  const totals = cart.reduce(
    (acc, l) => {
      acc.products += l.product.pricePerJar * l.qty;
      acc.deposits += l.product.depositPerJar * l.qty;
      return acc;
    },
    { products: 0, deposits: 0 },
  );
  const grand = totals.products + totals.deposits;

  async function onSubmit(values: CreateOrderInput) {
    if (cart.length === 0) {
      toast.error("Add at least one jar to the cart.");
      return;
    }
    try {
      const order = await createOrder({
        ...values,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.qty })),
      }).unwrap();
      toast.success(`Order ${order.orderNumber} placed!`);
      const pay = values.paymentMethod === "online" ? "?pay=1" : "";
      router.push(`/customer/orders/${order.id}${pay}`);
    } catch (error) {
      toast.error(
        apiErrorMessage(error, { fallback: "Could not place the order." }),
      );
    }
  }

  function continueToCheckout() {
    if (cart.length === 0) {
      toast.error("Add at least one jar to the cart.");
      return;
    }
    setStep("checkout");
  }

  function onInvalid(errs: FieldErrors<CreateOrderInput>) {
    const first = Object.values(errs).find(
      (e) => e && typeof e === "object" && "message" in e && e.message,
    );
    toast.error(
      (first?.message as string) ?? "Please fix the highlighted fields.",
    );
  }

  const vendor = data?.vendor;

  if (step === "products") {
    return (
      <>
        <PageHeader
          title={vendor?.name ?? "Order water"}
          description="Pick jars, then continue to delivery and payment."
          action={
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft /> All vendors
            </Button>
          }
        />

        <StepIndicator current="products" />

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Jars you keep are charged a refundable deposit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 py-4">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : products.length > 0 ? (
              products.map((p) => {
                const line = cart.find((l) => l.product.id === p.id);
                const out = line ? line.qty >= p.availableStock : false;
                const isCustom = customPrices.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.sizeLiters} L · {formatINR(p.pricePerJar)}/jar ·
                        deposit {formatINR(p.depositPerJar)}
                      </p>
                      {isCustom && (
                        <p className="text-xs font-medium text-accent">
                          Your special price
                        </p>
                      )}
                      {p.availableStock === 0 ? (
                        <p className="text-xs font-medium text-destructive">
                          Out of stock
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {p.availableStock} in stock
                        </p>
                      )}
                    </div>
                    {line ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => changeQty(p.id, -1)}
                        >
                          <Minus />
                        </Button>
                        <span className="w-6 text-center font-medium">
                          {line.qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={out}
                          onClick={() => changeQty(p.id, 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={p.availableStock === 0}
                        onClick={() => addLine(p)}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No products available from this vendor yet.
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3">
              <div className="text-sm">
                <p className="font-medium">
                  {cart.reduce((n, l) => n + l.qty, 0)} jar
                  {cart.reduce((n, l) => n + l.qty, 0) === 1 ? "" : "s"} in cart
                </p>
                <p className="text-muted-foreground">
                  Total {formatINR(grand)}
                  {totals.deposits > 0 &&
                    ` (incl. ${formatINR(totals.deposits)} deposit)`}
                </p>
              </div>
              <Button
                variant="accent"
                size="lg"
                disabled={cart.length === 0}
                onClick={continueToCheckout}
              >
                Continue to delivery &amp; payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Delivery & payment"
        description={`Complete your order from ${vendor?.name ?? "your vendor"}.`}
        action={
          <Button variant="ghost" size="sm" onClick={() => setStep("products")}>
            <ArrowLeft /> Back to products
          </Button>
        }
      />

      <StepIndicator current="checkout" />

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Delivery details</CardTitle>
            <CardDescription>
              Where should we deliver your jars?
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <form
              onSubmit={handleSubmit(onSubmit, onInvalid)}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Delivery address</Label>
                <Textarea id="address" {...register("address")} />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pinCode">PIN</Label>
                  <Input id="pinCode" {...register("pinCode")} />
                  {errors.pinCode && (
                    <p className="text-sm text-destructive">
                      {errors.pinCode.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="paymentMethod">Payment method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) =>
                    setValue(
                      "paymentMethod",
                      v as CreateOrderInput["paymentMethod"],
                    )
                  }
                >
                  <SelectTrigger id="paymentMethod" className="w-full">
                    <SelectValue placeholder="Payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash on delivery</SelectItem>
                    <SelectItem value="online">Online (Razorpay)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setStep("products")}
                >
                  <ArrowLeft /> Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  variant="accent"
                  className="flex-1"
                  disabled={placing || cart.length === 0}
                >
                  {placing && <Loader2 className="animate-spin" />}
                  Place order
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>Order summary</CardTitle>
            <CardDescription>
              {cart.reduce((n, l) => n + l.qty, 0)} jar
              {cart.reduce((n, l) => n + l.qty, 0) === 1 ? "" : "s"} from{" "}
              {vendor?.name ?? "vendor"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 py-4">
            {cart.map((l) => (
              <div
                key={l.product.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {l.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatINR(l.product.pricePerJar)}/jar × {l.qty}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => changeQty(l.product.id, -1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-5 text-center text-sm font-medium">
                    {l.qty}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    disabled={l.qty >= l.product.availableStock}
                    onClick={() => changeQty(l.product.id, 1)}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-1 rounded-lg bg-muted px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products</span>
                <span>{formatINR(totals.products)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposits</span>
                <span>{formatINR(totals.deposits)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatINR(grand)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StepIndicator({ current }: { current: "products" | "checkout" }) {
  const steps = [
    { key: "products", label: "Order water" },
    { key: "checkout", label: "Delivery & payment" },
  ] as const;
  const activeIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="mb-6 flex items-center gap-3">
      {steps.map((s, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        return (
          <div key={s.key} className="flex items-center gap-3">
            {i > 0 && <div className="h-px w-8 bg-border sm:w-16" />}
            <span
              className={
                active
                  ? "flex items-center gap-2 text-sm font-semibold text-accent"
                  : done
                    ? "flex items-center gap-2 text-sm font-medium text-muted-foreground"
                    : "flex items-center gap-2 text-sm text-muted-foreground/70"
              }
            >
              <span
                className={
                  active
                    ? "flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
                    : done
                      ? "flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground"
                      : "flex size-6 items-center justify-center rounded-full border text-xs font-bold"
                }
              >
                {i + 1}
              </span>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
