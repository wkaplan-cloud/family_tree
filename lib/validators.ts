import { z } from "zod";

export const personSchema = z.object({
  name: z.string().min(1).max(120),
  alive: z.boolean(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal(""))
});

export const relationshipSchema = z.object({
  leftId: z.string().min(1),
  rightId: z.string().min(1),
  label: z.string().min(1).max(120)
});

export const inviteSchema = z.object({
  personId: z.string().min(1),
  inviterName: z.string().min(1).max(120),
  recipientName: z.string().min(1).max(120),
  recipientEmail: z.string().email(),
  remindersEnabled: z.boolean()
});

export const contributeSchema = z.object({
  correctedName: z.string().min(1).max(120),
  correctedEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  relatives: z.array(
    z.object({
      name: z.string().min(1).max(120),
      email: z.string().email().optional().or(z.literal("")),
      relationLabel: z.string().min(1).max(120),
      alive: z.boolean()
    })
  ).max(20)
});
