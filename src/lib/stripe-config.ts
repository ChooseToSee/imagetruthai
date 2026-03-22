import type { PlanTier } from "@/contexts/PlanContext";

export const STRIPE_TIERS = {
  plus: {
    monthly_price_id: "price_1T8V0AANKKxH2qnACu534N2d",
    annual_price_id: "price_1TB4NgANKKxH2qnAVJZo3Wti",
    product_id: "prod_U6iRCnETvveMML",
  },
  pro: {
    monthly_price_id: "price_1T8V0AANKKxH2qnAA1EizK0M",
    annual_price_id: "price_1TB4TJANKKxH2qnAo1Ciwlem",
    product_id: "prod_U46zg6w4ycRsro",
  },
} as const;

// All valid price IDs for server-side validation
export const ALL_VALID_PRICE_IDS: Record<string, string> = {
  [STRIPE_TIERS.plus.monthly_price_id]: "plus",
  [STRIPE_TIERS.plus.annual_price_id]: "plus",
  [STRIPE_TIERS.pro.monthly_price_id]: "pro",
  [STRIPE_TIERS.pro.annual_price_id]: "pro",
};

export function productIdToTier(productId: string | null): PlanTier {
  if (productId === STRIPE_TIERS.pro.product_id) return "pro";
  if (productId === STRIPE_TIERS.plus.product_id) return "plus";
  return "free";
}
