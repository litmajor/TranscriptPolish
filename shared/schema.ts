import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTranscriptSchema = createInsertSchema(transcripts).pick({
  filename: true,
  originalContent: true,
  detectiveInfo: true,
  interviewInfo: true,
  speakerType: true,
  speakers: true,
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
