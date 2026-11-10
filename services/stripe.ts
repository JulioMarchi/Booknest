import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Cliente Stripe, inicializado sob demanda (na primeira chamada, não no
 * carregamento do módulo) — assim o build não depende de
 * STRIPE_SECRET_KEY estar presente em tempo de build, só em runtime.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY não configurada.");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}
