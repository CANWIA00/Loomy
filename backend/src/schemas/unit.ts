import { z } from "zod";

export const createUnitSchema = z.object({
  name: z
    .string({ invalid_type_error: "Birim adı zorunludur." })
    .trim()
    .min(1, "Birim adı zorunludur.")
    .max(20, "Birim adı en fazla 20 karakter olabilir."),
});
