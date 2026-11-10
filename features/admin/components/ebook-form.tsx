"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Loader2, AlertCircle, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPublicCoverUrl } from "@/lib/supabase/storage";
import type { EbookActionState } from "../actions";
import type { Category } from "@/types";

type EbookFormValues = {
  title: string;
  slug: string;
  description: string;
  category_id: string | null;
  author_name: string | null;
  price: number;
  featured: boolean;
  published: boolean;
  cover: string | null;
  pdf: string;
};

export function EbookForm({
  action,
  categories,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: EbookActionState, formData: FormData) => Promise<EbookActionState>;
  categories: Category[];
  defaultValues?: EbookFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState<EbookActionState, FormData>(
    action,
    null,
  );
  const [categoryId, setCategoryId] = useState(defaultValues?.category_id ?? "");
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const existingCoverUrl = getPublicCoverUrl(defaultValues?.cover ?? null);

  function fieldError(name: string) {
    return state?.fieldErrors?.[name]?.[0];
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={defaultValues?.title} required />
        {fieldError("title") && (
          <p className="text-sm font-medium text-destructive">{fieldError("title")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL amigável (opcional)</Label>
        <Input
          id="slug"
          name="slug"
          placeholder="gerada automaticamente a partir do título se deixada em branco"
          defaultValue={defaultValues?.slug}
        />
        {fieldError("slug") && (
          <p className="text-sm font-medium text-destructive">{fieldError("slug")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={defaultValues?.description}
          required
        />
        {fieldError("description") && (
          <p className="text-sm font-medium text-destructive">{fieldError("description")}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category_id">Categoria</Label>
          <Select
            value={categoryId || "none"}
            onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}
          >
            <SelectTrigger id="category_id" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="category_id" value={categoryId} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="author_name">Autor</Label>
          <Input
            id="author_name"
            name="author_name"
            placeholder="Nome de exibição do autor"
            defaultValue={defaultValues?.author_name ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Preço (R$)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.price}
          required
          className="max-w-[10rem]"
        />
        {fieldError("price") && (
          <p className="text-sm font-medium text-destructive">{fieldError("price")}</p>
        )}
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="featured" defaultChecked={defaultValues?.featured} />
          Destaque
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="published" defaultChecked={defaultValues?.published} />
          Publicado (visível na loja)
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cover">Capa {defaultValues ? "(opcional — substitui a atual)" : ""}</Label>
          {existingCoverUrl && (
            <div className="relative aspect-[2/3] w-24 overflow-hidden rounded border border-border">
              <Image src={existingCoverUrl} alt="Capa atual" fill className="object-cover" />
            </div>
          )}
          <label
            htmlFor="cover"
            className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Upload className="size-4" />
            {coverFileName ?? "JPG, PNG ou WebP — até 5MB"}
          </label>
          <input
            id="cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => setCoverFileName(e.target.files?.[0]?.name ?? null)}
          />
          {fieldError("cover") && (
            <p className="text-sm font-medium text-destructive">{fieldError("cover")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdf">
            Arquivo PDF {defaultValues ? "(opcional — substitui o atual)" : ""}
          </Label>
          {defaultValues?.pdf && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> Já existe um PDF enviado
            </p>
          )}
          <label
            htmlFor="pdf"
            className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Upload className="size-4" />
            {pdfFileName ?? "PDF — até 200MB"}
          </label>
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setPdfFileName(e.target.files?.[0]?.name ?? null)}
          />
          {fieldError("pdf") && (
            <p className="text-sm font-medium text-destructive">{fieldError("pdf")}</p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
