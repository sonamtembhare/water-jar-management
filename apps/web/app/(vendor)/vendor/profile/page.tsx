"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { vendorUpdateSchema, type VendorUpdateInput } from "@repo/types";
import { BadgeCheck, Loader2, Store, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  useUpdateVendorProfileMutation,
  useVendorProfileQuery,
} from "@/features/api";
import {
  useAppSelector,
} from "@/lib/hooks";
import { selectAuth } from "@/features/auth/authSlice";
import { PageHeader } from "@/components/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorProfilePage() {
  const { data: profile, isLoading } = useVendorProfileQuery();
  const { user } = useAppSelector(selectAuth);
  const [update, { isLoading: saving }] = useUpdateVendorProfileMutation();
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorUpdateInput>({
    resolver: zodResolver(vendorUpdateSchema),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  function enterEdit() {
    if (!profile) return;
    reset({
      name: profile.name,
      description: profile.description ?? "",
      address: profile.address ?? "",
      phone: profile.phone ?? "",
      gstin: profile.gstin ?? "",
    });
    setEditing(true);
  }

  async function onSubmit(values: VendorUpdateInput) {
    try {
      await update(values).unwrap();
      toast.success("Business profile updated");
      setEditing(false);
    } catch {
      toast.error("Could not update profile");
    }
  }

  return (
    <>
      <PageHeader
        title="Business profile"
        description="Details shown to customers and admins."
        action={
          profile?.status === "pending" && (
            <Badge variant="warning">Awaiting approval</Badge>
          )
        }
      />
      <Card className="max-w-lg">
        <CardContent className="py-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Store />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile?.name}</h2>
              {user && <p className="text-sm text-muted-foreground">{user.email}</p>}
            </div>
          </div>

          {profile?.status === "approved" ? (
            <Badge variant="success" className="mb-4">
              <BadgeCheck /> Approved supplier
            </Badge>
          ) : profile?.status === "rejected" ? (
            <Badge variant="destructive" className="mb-4">
              <XCircle /> Application rejected
            </Badge>
          ) : (
            <Badge variant="warning" className="mb-4">
              Pending review
            </Badge>
          )}

          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Business name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...register("address")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" {...register("gstin")} />
              </div>
              <div className="mt-1 flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />} Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="flex flex-col gap-1 text-sm">
              <InfoRow label="About" value={profile?.description ?? "—"} />
              <InfoRow label="Address" value={profile?.address ?? "—"} />
              <InfoRow label="Phone" value={profile?.phone ?? "—"} />
              <InfoRow label="GSTIN" value={profile?.gstin ?? "—"} />
              <Button variant="outline" className="mt-4 w-fit" onClick={enterEdit}>
                Edit business details
              </Button>
            </dl>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-72 text-right font-medium">{value}</dd>
    </div>
  );
}