"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/constants";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type SignUpValues,
  type SignInValues,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "./schemas";

export type ActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: string;
} | null;

/**
 * Traduz as mensagens de erro do Supabase Auth (em inglês) para
 * português, com um fallback genérico para casos não mapeados.
 */
function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "User already registered": "Este e-mail já está cadastrado.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "Email rate limit exceeded":
      "Muitas tentativas com esse e-mail. Aguarde um instante.",
    "Password should be at least 6 characters":
      "A senha precisa ter pelo menos 8 caracteres.",
    "Signup requires a valid password": "Informe uma senha válida.",
    "Unable to validate email address: invalid format": "E-mail inválido.",
    "A user with this email address has already been registered":
      "Este e-mail já está cadastrado.",
  };

  return (
    map[message] ??
    Object.entries(map).find(([key]) => message.includes(key))?.[1] ??
    "Não foi possível completar a ação. Tente novamente em instantes."
  );
}

export async function signUpAction(values: SignUpValues): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${siteConfig.url}/auth/callback`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // "Confirmar e-mail" pode estar ativado no projeto — nesse caso não
  // existe sessão ainda até o link ser clicado.
  if (!data.session) {
    return {
      success:
        "Quase lá! Enviamos um link de confirmação para o seu e-mail — clique nele para ativar sua conta.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/conta");
}

export async function signInAction(
  values: SignInValues,
  redirectTo?: string,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/conta";
  redirect(target as Route);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordResetAction(
  values: ForgotPasswordValues,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteConfig.url}/auth/callback?next=/redefinir-senha`,
  });

  // Mensagem de sucesso é sempre a mesma, exista ou não o e-mail —
  // evita que alguém use este formulário para descobrir quais
  // e-mails estão cadastrados na plataforma.
  if (error) {
    console.error("resetPasswordForEmail:", error.message);
  }

  return {
    success:
      "Se esse e-mail estiver cadastrado, você vai receber um link para redefinir sua senha em instantes.",
  };
}

export async function updatePasswordAction(
  values: ResetPasswordValues,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Seu link de redefinição expirou. Solicite um novo.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  return { success: "Senha alterada com sucesso." };
}

export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteConfig.url}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    redirect("/entrar?erro=google" as Route);
  }

  // URL externa (accounts.google.com) — não é uma rota interna, então
  // o tipo RouteImpl do typedRoutes não se aplica aqui.
  redirect(data.url as Route);
}
