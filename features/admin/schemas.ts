import { z } from "zod";

export const ebookFormSchema = z.object({
  title: z.string().trim().min(2, "Informe um título.").max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9-]*$/, "Use apenas letras minúsculas, números e hífen.")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().min(10, "Descreva o eBook (mínimo 10 caracteres).").max(5000),
  category_id: z.string().uuid().optional().or(z.literal("")),
  author_name: z.string().trim().max(150).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "O preço não pode ser negativo.").max(99999),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(false),
});

export type EbookFormValues = z.infer<typeof ebookFormSchema>;
