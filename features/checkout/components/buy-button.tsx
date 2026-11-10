"use client";

import { useState, useTransition } from "react";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { validateCouponAction, createCheckoutSessionAction } from "../actions";

type AppliedCoupon = { discountType: "percentage" | "fixed"; discountValue: number };

export function BuyButton({ ebookId, price }: { ebookId: string; price: number }) {
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidating, startValidating] = useTransition();
  const [isBuying, startBuying] = useTransition();

  const finalPrice = appliedCoupon
    ? Math.max(
        0,
        appliedCoupon.discountType === "percentage"
          ? price * (1 - appliedCoupon.discountValue / 100)
          : price - appliedCoupon.discountValue,
      )
    : price;

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    startValidating(async () => {
      const result = await validateCouponAction(couponCode);
      if (result.status === "valid") {
        setAppliedCoupon({
          discountType: result.discountType,
          discountValue: result.discountValue,
        });
        toast.success("Cupom aplicado!");
      } else {
        setAppliedCoupon(null);
        toast.error(result.message);
      }
    });
  }

  function handleBuy() {
    startBuying(async () => {
      const result = await createCheckoutSessionAction(
        ebookId,
        appliedCoupon ? couponCode : undefined,
      );
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-baseline gap-2">
          {appliedCoupon && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(price)}
            </span>
          )}
          <span className="font-display text-3xl font-semibold text-primary">
            {formatCurrency(finalPrice)}
          </span>
        </div>

        <Button size="lg" onClick={handleBuy} disabled={isBuying}>
          {isBuying && <Loader2 className="animate-spin" />}
          Comprar
        </Button>
      </div>

      {showCoupon ? (
        <div className="flex max-w-xs items-center gap-2">
          <Input
            placeholder="Código do cupom"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyCoupon}
            disabled={isValidating}
          >
            {isValidating ? <Loader2 className="animate-spin" /> : "Aplicar"}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCoupon(true)}
          className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <Tag className="size-3" /> Tem um cupom de desconto?
        </button>
      )}
    </div>
  );
}
