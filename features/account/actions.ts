"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120),
});

export type ProfileActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: string;
} | null;

export async function updateProfileAction(values: {
  name: string;
}): Promise<ProfileActionState> {
  const parsed = updateProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const { error } = await supabase
    .from("users")
    .update({ name: parsed.data.name })
    .eq("id", user.id);

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/conta", "layout");
  return { success: "Perfil atualizado." };
}
