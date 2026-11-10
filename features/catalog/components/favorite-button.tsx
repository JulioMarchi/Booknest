"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFavoriteAction } from "../actions";

export function FavoriteButton({
  ebookId,
  ebookSlug,
  initialFavorited,
}: {
  ebookId: string;
  ebookSlug: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavoriteAction(ebookId, ebookSlug);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setFavorited(result.favorited);
      toast.success(
        result.favorited ? "Adicionado aos favoritos." : "Removido dos favoritos.",
      );
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={isPending}
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart className={cn(favorited && "fill-primary text-primary")} />
    </Button>
  );
}
