"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { ebookFormSchema } from "./schemas";
import { businessRules } from "@/lib/constants";
import type { TablesUpdate } from "@/types";

export type EbookActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
} | null;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Reconfirma o papel de admin no servidor — o middleware já protege a
 * rota, mas uma Server Action pode em teoria ser invocada por fora da
 * UI, então a checagem é repetida aqui (defesa em profundidade). */
async function getAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return { supabase, userId: user.id };
}

function parseEbookFormData(formData: FormData) {
  return ebookFormSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    author_name: formData.get("author_name"),
    price: formData.get("price"),
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
  });
}

/**
 * Envia um arquivo pro Storage se um novo foi selecionado. Um input de
 * arquivo vazio chega ao FormData como File de tamanho 0 — tratado como
 * "nenhum arquivo novo" (relevante na edição, onde o admin pode querer
 * só mudar o preço, por exemplo, sem reenviar a capa).
 */
async function uploadIfProvided(
  supabase: SupabaseServerClient,
  bucket: "covers" | "ebooks",
  ebookId: string,
  entry: FormDataEntryValue | null,
): Promise<{ path?: string; error?: string }> {
  if (!(entry instanceof File) || entry.size === 0) return {};

  const maxMb =
    bucket === "covers" ? businessRules.coverMaxSizeMb : businessRules.pdfMaxSizeMb;
  if (entry.size > maxMb * 1024 * 1024) {
    return { error: `Arquivo maior que ${maxMb}MB.` };
  }

  const ext = entry.name.split(".").pop()?.toLowerCase() || (bucket === "covers" ? "jpg" : "pdf");
  const path = `${ebookId}/${bucket === "covers" ? "capa" : "livro"}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, entry, {
    upsert: true,
    contentType: entry.type || undefined,
  });

  if (error) return { error: `Falha no upload: ${error.message}` };
  return { path };
}

export async function createEbookAction(
  _prevState: EbookActionState,
  formData: FormData,
): Promise<EbookActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Acesso negado." };

  const parsed = parseEbookFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const pdfEntry = formData.get("pdf");
  if (!(pdfEntry instanceof File) || pdfEntry.size === 0) {
    return { fieldErrors: { pdf: ["Envie o arquivo PDF do eBook."] } };
  }

  const ebookId = randomUUID();

  const coverUpload = await uploadIfProvided(
    session.supabase,
    "covers",
    ebookId,
    formData.get("cover"),
  );
  if (coverUpload.error) return { fieldErrors: { cover: [coverUpload.error] } };

  const pdfUpload = await uploadIfProvided(session.supabase, "ebooks", ebookId, pdfEntry);
  if (pdfUpload.error || !pdfUpload.path) {
    return { fieldErrors: { pdf: [pdfUpload.error ?? "Falha ao processar o PDF."] } };
  }

  const { error } = await session.supabase.from("ebooks").insert({
    id: ebookId,
    title: parsed.data.title,
    slug: parsed.data.slug || "",
    description: parsed.data.description,
    category_id: parsed.data.category_id || null,
    author_id: session.userId,
    author_name: parsed.data.author_name || null,
    price: parsed.data.price,
    featured: parsed.data.featured,
    published: parsed.data.published,
    cover: coverUpload.path ?? null,
    pdf: pdfUpload.path,
  });

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { slug: ["Já existe um eBook com essa URL."] } };
    }
    return { error: "Não foi possível criar o eBook." };
  }

  revalidatePath("/admin/ebooks");
  revalidatePath("/");
  redirect("/admin/ebooks");
}

export async function updateEbookAction(
  ebookId: string,
  _prevState: EbookActionState,
  formData: FormData,
): Promise<EbookActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Acesso negado." };

  const parsed = parseEbookFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const coverUpload = await uploadIfProvided(
    session.supabase,
    "covers",
    ebookId,
    formData.get("cover"),
  );
  if (coverUpload.error) return { fieldErrors: { cover: [coverUpload.error] } };

  const pdfUpload = await uploadIfProvided(
    session.supabase,
    "ebooks",
    ebookId,
    formData.get("pdf"),
  );
  if (pdfUpload.error) return { fieldErrors: { pdf: [pdfUpload.error] } };

  const updatePayload: TablesUpdate<"ebooks"> = {
    title: parsed.data.title,
    description: parsed.data.description,
    category_id: parsed.data.category_id || null,
    author_name: parsed.data.author_name || null,
    price: parsed.data.price,
    featured: parsed.data.featured,
    published: parsed.data.published,
  };
  if (parsed.data.slug) updatePayload.slug = parsed.data.slug;
  if (coverUpload.path) updatePayload.cover = coverUpload.path;
  if (pdfUpload.path) updatePayload.pdf = pdfUpload.path;

  const { error } = await session.supabase
    .from("ebooks")
    .update(updatePayload)
    .eq("id", ebookId);

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { slug: ["Já existe um eBook com essa URL."] } };
    }
    return { error: "Não foi possível salvar as alterações." };
  }

  revalidatePath("/admin/ebooks");
  revalidatePath("/");
  revalidatePath("/livro/[slug]", "page");
  redirect("/admin/ebooks");
}

export async function deleteEbookAction(
  ebookId: string,
): Promise<{ error: string } | void> {
  const session = await getAdminSession();
  if (!session) return { error: "Acesso negado." };

  const { error } = await session.supabase.from("ebooks").delete().eq("id", ebookId);

  if (error) {
    // 23503 = foreign_key_violation — existem compras referenciando
    // este eBook (purchases.ebook_id é ON DELETE RESTRICT de propósito,
    // pra nunca apagar o acesso de quem já pagou por ele).
    if (error.code === "23503") {
      return {
        error:
          "Não é possível excluir — já existem compras deste eBook. Você pode despublicá-lo em vez disso.",
      };
    }
    return { error: "Não foi possível excluir o eBook." };
  }

  revalidatePath("/admin/ebooks");
  revalidatePath("/");
}
