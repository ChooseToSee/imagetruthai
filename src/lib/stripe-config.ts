import type { PlanTier } from "@/contexts/PlanContext";

export const STRIPE_TIERS = {
  plus: {
    price_id: "price_1T5ykFAgty77Em73OcjU76cO",
    product_id: "prod_U46ynL0lG0C32s",
  },
  pro: {
    price_id: "price_1T5ylsAgty77Em73zxSGfKYe",
    product_id: "prod_U46zg6w4ycRsro",
  },
} as const;

export function productIdToTier(productId: string | null): PlanTier {
  if (productId === STRIPE_TIERS.pro.product_id) return "pro";
  if (productId === STRIPE_TIERS.plus.product_id) return "plus";
  return "free";
}
