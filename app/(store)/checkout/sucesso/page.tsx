import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getStripe } from "@/services/stripe";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Compra confirmada",
};

type PageProps = {
  searchParams: Promise<{ session_id?: string; free?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id, free } = await searchParams;

  let isPaid = free === "true";

  if (session_id && !isPaid) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      isPaid = session.payment_status === "paid";
    } catch (err) {
      console.error("Erro ao verificar sessão de checkout:", err);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 sm:px-6">
      <Card className="w-full text-center">
        <CardHeader>
          {isPaid ? (
            <>
              <CheckCircle2 className="mx-auto size-10 text-primary" />
              <CardTitle className="mt-3">Compra confirmada!</CardTitle>
              <CardDescription>
                Seu eBook já está disponível na sua biblioteca.
              </CardDescription>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" />
              <CardTitle className="mt-3">Processando pagamento…</CardTitle>
              <CardDescription>
                Isso pode levar alguns instantes. Confira sua conta em breve.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/conta">Ir para minha conta</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
