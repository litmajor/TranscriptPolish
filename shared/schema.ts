import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transcripts = pgTable("transcripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalContent: text("original_content").notNull(),
  processedContent: text("processed_content"),
  detectiveInfo: json("detective_info").$type<{
    name?: string;
    badge?: string;
    section?: string;
  }>(),
  interviewInfo: json("interview_info").$type<{
    date?: string;
    time?: string;
    location?: string;
  }>(),
  speakerType: text("speaker_type").notNull().default("standard"), // "standard" or "custom"
  speakers: json("speakers").$type<Array<{ label: string; description: string }>>().default(sql`'[]'::json`),
  validationResults: json("validation_results").$type<{
    issues: Array<{
      line: number;
      type: string;
      message: string;
      suggestion?: string;
    }>;
    score: number;
  }>(),
  status: text("status").notNull().default("draft"), // "draft", "processing", "ready", "error"
  versions: jsonb("versions").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTranscriptSchema = z.object({
  id: z.string().optional(),
  filename: z.string(),
  originalContent: z.string(),
  processedContent: z.string().optional(),
  detectiveInfo: z.record(z.any()).default({}),
  interviewInfo: z.record(z.any()).default({}),
  speakerType: z.enum(["standard", "numbered"]).default("standard"),
  speakers: z.array(z.object({
    label: z.string(),
    description: z.string()
  })).default([]),
  status: z.enum(["draft", "processing", "ready", "error"]).default("draft"),
  validationResults: z.object({
    issues: z.array(z.object({
      line: z.number(),
      type: z.string(),
      message: z.string(),
      suggestion: z.string().optional()
    })),
    score: z.number()
  }).optional(),
  versions: z.array(z.object({
    id: z.string(),
    timestamp: z.date(),
    content: z.string(),
    type: z.enum(["original", "processed"]),
    changes: z.string().optional(),
    score: z.number().optional()
  })).default([]),
});

export const updateTranscriptSchema = createInsertSchema(transcripts).pick({
  processedContent: true,
  detectiveInfo: true,
  interviewInfo: true,
  speakerType: true,
  speakers: true,
  validationResults: true,
  status: true,
}).partial();

export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type UpdateTranscript = z.infer<typeof updateTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;