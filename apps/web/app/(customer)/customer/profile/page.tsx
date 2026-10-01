"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateProfileSchema, type UpdateProfileInput } from "@repo/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
} from "@/features/api";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerProfilePage() {
  const { data: profile, isLoading } = useCustomerProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateCustomerProfileMutation();
  const [editMode, setEditMode] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  function enterEdit() {
    if (!profile?.customer) return;
    reset({
      name: undefined,
      phone: profile.customer.phone ?? "",
      address: profile.customer.address ?? "",
      city: profile.customer.city ?? "",
      pinCode: profile.customer.pinCode ?? "",
    });
    setEditMode(true);
  }

  async function onSubmit(values: UpdateProfileInput) {
    try {
      await updateProfile(values).unwrap();
      toast.success("Profile updated");
      setEditMode(false);
    } catch {
      toast.error("Could not update profile");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My profile"
        description="Your delivery details"
        action={
          !editMode && (
            <Button variant="outline" onClick={enterEdit}>
              Edit profile
            </Button>
          )
        }
      />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Contact & delivery info</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} placeholder="Flat, street, landmark" />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pinCode">PIN code</Label>
                  <Input id="pinCode" {...register("pinCode")} />
                  {errors.pinCode && (
                    <p className="text-sm text-destructive">{errors.pinCode.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-1 flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />} Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="flex flex-col gap-2 text-sm">
              <Info label="Phone" value={profile?.customer?.phone ?? "—"} />
              <Info label="Address" value={profile?.customer?.address ?? "—"} />
              <Info label="City" value={profile?.customer?.city ?? "—"} />
              <Info label="PIN code" value={profile?.customer?.pinCode ?? "—"} />
            </dl>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}