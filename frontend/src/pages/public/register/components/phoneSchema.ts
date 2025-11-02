import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) return false;
      const normalized = value.startsWith("+") ? value.slice(1) : value;
      return /^\d{9,15}$/.test(normalized);
    },
    {
      message: "Phone number must contain 9-15 digits and may start with +",
    }
  );
