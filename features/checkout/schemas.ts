import { z } from "zod";

export const couponCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Informe um cupom.")
    .max(50, "Cupom muito longo.")
    .transform((value) => value.toUpperCase()),
});

export type CouponCodeValues = z.infer<typeof couponCodeSchema>;
