"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { inviteStaffSchema, type InviteStaffInput } from "@repo/types";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import {
  useInviteStaffMutation,
  useRemoveStaffMutation,
  useVendorStaffQuery,
} from "@/features/api";
import { PageHeader } from "@/components/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserStatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorStaffPage() {
  const { data, isLoading } = useVendorStaffQuery();

  return (
    <>
      <PageHeader
        title="Your team"
        description="Staff accounts linked to this business."
        action={<InviteDialog />}
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Team members</CardTitle>
          <CardDescription>{data?.total ?? 0} members</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.staff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone ?? "—"}</TableCell>
                    <TableCell>
                      <UserStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RemoveStaffButton id={s.id} name={s.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Users className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No team members yet</p>
              <p className="text-sm text-muted-foreground">
                Invite staff to help manage orders and deliveries.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function RemoveStaffButton({ id, name }: { id: string; name: string }) {
  const [remove, { isLoading }] = useRemoveStaffMutation();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive"
      title={`Remove ${name}`}
      disabled={isLoading}
      onClick={async () => {
        if (!confirm(`Remove ${name} from this business?`)) return;
        try {
          await remove(id).unwrap();
          toast.success("Team member removed");
        } catch {
          toast.error("Could not remove member");
        }
      }}
    >
      <Trash2 />
    </Button>
  );
}

function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [invite, { isLoading }] = useInviteStaffMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteStaffInput>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  async function onSubmit(values: InviteStaffInput) {
    try {
      await invite(values).unwrap();
      toast.success(`${values.name} invited`);
      reset();
      setOpen(false);
    } catch {
      toast.error("Could not invite (email may already exist)");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Invite staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            The staff member gets login access to this business account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />} Send invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}