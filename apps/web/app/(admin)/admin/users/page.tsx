"use client";

import { formatDateTime } from "@repo/types";
import { Users, Ban, CheckCircle2, Megaphone } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminUsersQuery,
  useBroadcastNotificationMutation,
  useUpdateUserStatusMutation,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserStatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function AdminUsersPage() {
  const { data, isLoading } = useAdminUsersQuery({});

  return (
    <>
      <PageHeader
        title="Users"
        description="Every account on the platform."
        action={<BroadcastDialog />}
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>All users</CardTitle>
          <CardDescription>{data?.total ?? 0} accounts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "super_admin" ? "accent" : "outline"}>
                        <span className="capitalize">{u.role.replace("_", " ")}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(u.createdAt)}</TableCell>
                    <TableCell>
                      <UserStatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <UserStatusButton user={u} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Users className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function UserStatusButton({
  user,
}: {
  user: { id: string; status: "active" | "blocked"; role: string };
}) {
  const [update, { isLoading }] = useUpdateUserStatusMutation();

  if (user.role === "super_admin") return null;

  return (
    <Button
      size="sm"
      variant={user.status === "active" ? "ghost" : "default"}
      className={
        user.status === "active" ? "text-muted-foreground" : undefined
      }
      disabled={isLoading}
      onClick={async () => {
        const next = user.status === "active" ? "blocked" : "active";
        if (next === "blocked" && !confirm("Block this user?")) return;
        try {
          await update({ id: user.id, body: { status: next } }).unwrap();
          toast.success(next === "active" ? "User unblocked" : "User blocked");
        } catch {
          toast.error("Action failed");
        }
      }}
    >
      {user.status === "active" ? <Ban /> : <CheckCircle2 />}
      {user.status === "active" ? "Block" : "Unblock"}
    </Button>
  );
}

function BroadcastDialog() {
  const [open, setOpen] = useState(false);
  const [broadcast, { isLoading }] = useBroadcastNotificationMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function submit() {
    if (title.trim().length < 2 || body.trim().length < 2) {
      toast.error("Enter a title and message");
      return;
    }
    try {
      const res = await broadcast({
        title,
        body,
        role: "customer",
      }).unwrap();
      toast.success(`Message sent to ${res.sent} customers`);
      setOpen(false);
      setTitle("");
      setBody("");
    } catch {
      toast.error("Broadcast failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Megaphone /> Broadcast
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Broadcast notification</DialogTitle>
          <DialogDescription>
            Send a message to all customers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bc-title">Title</Label>
            <Input
              id="bc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bc-body">Message</Label>
            <Textarea
              id="bc-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <Button disabled={isLoading} onClick={submit}>
            Send broadcast
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}