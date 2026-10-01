"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  registerCustomerSchema,
  registerVendorSchema,
  type RegisterCustomerInput,
  type RegisterVendorInput,
} from "@repo/types";
import { Loader2 } from "lucide-react";
import type {
  FieldErrors,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from "react-hook-form";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { apiErrorMessage } from "@/lib/api-error";
import { setCredentials } from "@/features/auth/authSlice";
import {
  useRegisterCustomerMutation,
  useRegisterVendorMutation,
} from "@/features/api";
import { HOME_BY_ROLE } from "@/components/protected-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const CUSTOMER_DEFAULTS: RegisterCustomerInput = {
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  city: "",
  pinCode: "",
};
const VENDOR_DEFAULTS: RegisterVendorInput = {
  name: "",
  email: "",
  password: "",
  phone: "",
  businessName: "",
  address: "",
  gstin: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [ready, setReady] = useState(false);
  const [registerCustomer, { isLoading: cLoading }] =
    useRegisterCustomerMutation();
  const [registerVendor, { isLoading: vLoading }] = useRegisterVendorMutation();

  const customerForm = useForm<RegisterCustomerInput>({
    resolver: zodResolver(registerCustomerSchema),
    defaultValues: CUSTOMER_DEFAULTS,
  });
  const vendorForm = useForm<RegisterVendorInput>({
    resolver: zodResolver(registerVendorSchema),
    defaultValues: VENDOR_DEFAULTS,
  });

  useEffect(() => {
    setReady(true);
    if (user) router.replace(HOME_BY_ROLE[user.role]);
  }, [user, router]);

  async function onCustomerSubmit(values: RegisterCustomerInput) {
    try {
      const result = await registerCustomer(values).unwrap();
      dispatch(setCredentials(result));
      toast.success("Account created. Welcome!");
      router.replace("/customer");
    } catch (error) {
      toast.error(
        apiErrorMessage(error, {
          unauthorized: "An account with that email already exists.",
          fallback: "Could not create account. Check the details and try again.",
        }),
      );
    }
  }

  async function onVendorSubmit(values: RegisterVendorInput) {
    try {
      const result = await registerVendor(values).unwrap();
      dispatch(setCredentials(result));
      toast.success("Business registered! Awaiting admin approval.");
      router.replace("/vendor");
    } catch (error) {
      toast.error(
        apiErrorMessage(error, {
          unauthorized: "An account with that email already exists.",
          fallback: "Could not create business account. Try again.",
        }),
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-center text-2xl font-bold">
          Create your account
        </h1>
        <Tabs defaultValue="customer">
          <TabsList className="w-full">
            <TabsTrigger value="customer" className="flex-1">
              Customer
            </TabsTrigger>
            <TabsTrigger value="vendor" className="flex-1">
              Business
            </TabsTrigger>
          </TabsList>
          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order water online</CardTitle>
                <CardDescription>
                  Browse approved vendors, order jars and track deliveries.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={customerForm.handleSubmit(onCustomerSubmit)}
                  className="flex flex-col gap-3"
                >
                  <Field
                    register={customerForm.register}
                    errors={customerForm.formState.errors}
                    name="name"
                    label="Full name"
                    type="text"
                    placeholder="Asha Sharma"
                  />
                  <Field
                    register={customerForm.register}
                    errors={customerForm.formState.errors}
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                  />
                  <Field
                    register={customerForm.register}
                    errors={customerForm.formState.errors}
                    name="password"
                    label="Password"
                    type="password"
                  />
                  <Field
                    register={customerForm.register}
                    errors={customerForm.formState.errors}
                    name="phone"
                    label="Phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                  />
                  <Field
                    register={customerForm.register}
                    errors={customerForm.formState.errors}
                    name="address"
                    label="Delivery address"
                    type="text"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      register={customerForm.register}
                      errors={customerForm.formState.errors}
                      name="city"
                      label="City"
                      type="text"
                    />
                    <Field
                      register={customerForm.register}
                      errors={customerForm.formState.errors}
                      name="pinCode"
                      label="PIN code"
                      type="text"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-2 w-full"
                    disabled={cLoading}
                  >
                    {cLoading && <Loader2 className="animate-spin" />} Create
                    customer account
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="vendor">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Register your business</CardTitle>
                <CardDescription>
                  Apply as a water supply vendor. Approval is required from a
                  super admin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={vendorForm.handleSubmit(onVendorSubmit)}
                  className="flex flex-col gap-3"
                >
                  <Field
                    register={vendorForm.register}
                    errors={vendorForm.formState.errors}
                    name="businessName"
                    label="Business name"
                    type="text"
                  />
                  <Field
                    register={vendorForm.register}
                    errors={vendorForm.formState.errors}
                    name="name"
                    label="Owner name"
                    type="text"
                  />
                  <Field
                    register={vendorForm.register}
                    errors={vendorForm.formState.errors}
                    name="email"
                    label="Email"
                    type="email"
                  />
                  <Field
                    register={vendorForm.register}
                    errors={vendorForm.formState.errors}
                    name="password"
                    label="Password"
                    type="password"
                  />
                  <Field
                    register={vendorForm.register}
                    errors={vendorForm.formState.errors}
                    name="phone"
                    label="Phone"
                    type="tel"
                  />
                  <Field
                    register={vendorForm.register}
                    errors={vendorForm.formState.errors}
                    name="address"
                    label="Business address"
                    type="text"
                  />
                  <Field
                    register={vendorForm.register}
                    errors={vendorForm.formState.errors}
                    name="gstin"
                    label="GSTIN (optional)"
                    type="text"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-2 w-full"
                    disabled={vLoading}
                  >
                    {vLoading && <Loader2 className="animate-spin" />} Submit
                    application
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field<T extends FieldValues>({
  register,
  errors,
  name,
  label,
  type,
  placeholder,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: FieldPath<T>;
  label: string;
  type: string;
  placeholder?: string;
}) {
  const error = (errors[name] as { message?: string } | undefined)?.message;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} placeholder={placeholder} {...register(name)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}