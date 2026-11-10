"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateProfileAction } from "@/features/account/actions";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({ initialName }: { initialName: string }) {
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initialName },
  });

  function onSubmit(values: ProfileValues) {
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result?.fieldErrors?.name?.[0]) {
        form.setError("name", { message: result.fieldErrors.name[0] });
      }
      if (result?.success) {
        setSuccessMessage(result.success);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {successMessage && (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Salvar
        </Button>
      </form>
    </Form>
  );
}
