"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => signOutAction())}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
      Sair
    </Button>
  );
}
