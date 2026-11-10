"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title, url }: { title: string; url: string }) {
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Usuário cancelou o compartilhamento — não é um erro real.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleShare}
      aria-label="Compartilhar"
    >
      <Share2 />
    </Button>
  );
}
