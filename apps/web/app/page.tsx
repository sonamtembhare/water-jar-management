"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Droplets } from "lucide-react";

import { useAppSelector } from "@/lib/hooks";
import { selectAuth } from "@/features/auth/authSlice";
import { HOME_BY_ROLE } from "@/components/protected-layout";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { user } = useAppSelector(selectAuth);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  function go() {
    router.push(user ? HOME_BY_ROLE[user.role] : "/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Droplets className="size-6 text-accent" />
          AquaGo
        </div>
        {ready && (
          <nav className="flex items-center gap-2">
            {user ? (
              <Button onClick={go}>{user.name.split(" ")[0]}</Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button onClick={go}>Get started</Button>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Never run dry. <span className="text-accent">Track every jar.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          AquaGo connects customers, vendors and admins in one water jar
          management platform — ordering, deposits, deliveries, inventory and
          payments, all in one place.
        </p>

        {ready && user && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="lg" onClick={go}>
              Go to my dashboard
            </Button>
          </div>
        )}

        <div className="grid w-full gap-4 pt-6 sm:grid-cols-3">
          {[
            { title: "Customers", body: "Order jars from approved vendors, pay by cash or online and track every delivery." },
            { title: "Vendors", body: "Manage products, inventory, team, pricing and fulfil orders with live status updates." },
            { title: "Super admin", body: "Approve vendors, manage users and view platform-wide analytics." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border bg-card p-5 text-left">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-accent">
                {c.title}
              </h3>
              <p className="text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>

        {ready && !user && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button size="lg" asChild>
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}