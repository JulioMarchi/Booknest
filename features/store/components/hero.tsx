"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicCoverUrl } from "@/lib/supabase/storage";
import { siteConfig } from "@/lib/constants";
import type { EbookWithRelations } from "@/types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: EASE_OUT_EXPO },
  }),
};

export function Hero({ featured }: { featured: EbookWithRelations[] }) {
  const covers = featured.slice(0, 3);

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <motion.div
            custom={0}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground"
          >
            <BookOpen className="size-3.5 text-primary" />
            Sua próxima leitura começa aqui
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl"
          >
            {siteConfig.tagline}
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground"
          >
            {siteConfig.description}
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button size="lg" asChild>
              <Link href="/catalogo">
                Explorar catálogo <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/cadastro">Criar conta grátis</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden aspect-square items-center justify-center md:flex"
        >
          {covers.length > 0 ? (
            <div className="relative flex items-center justify-center">
              {covers.map((ebook, i) => {
                const coverUrl = getPublicCoverUrl(ebook.cover);
                const rotations = [-8, 4, -2];
                const offsets = [-56, 0, 56];
                return (
                  <div
                    key={ebook.id}
                    style={{
                      transform: `translateX(${offsets[i]}px) rotate(${rotations[i]}deg)`,
                      zIndex: i === 1 ? 10 : 5 - i,
                    }}
                    className="absolute h-64 w-44 overflow-hidden rounded-md border border-border bg-muted shadow-xl"
                  >
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={`Capa de ${ebook.title}`}
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-muted p-3 text-center font-display text-xs">
                        {ebook.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative size-72 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
              <BookOpen
                className="absolute inset-0 m-auto size-16 text-primary/40"
                strokeWidth={1}
              />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
