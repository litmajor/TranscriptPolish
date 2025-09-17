import { type Transcript, type InsertTranscript, type UpdateTranscript, transcripts } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getTranscript(id: string): Promise<Transcript | undefined>;
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  updateTranscript(id: string, updates: UpdateTranscript): Promise<Transcript | undefined>;
  deleteTranscript(id: string): Promise<boolean>;
  listTranscripts(): Promise<Transcript[]>;
}

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  async getTranscript(id: string): Promise<Transcript | undefined> {
    const result = await db.select().from(transcripts).where(eq(transcripts.id, id));
    return result[0] || undefined;
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const result = await db.insert(transcripts).values(insertTranscript as any).returning();
    return result[0];
  }

  async updateTranscript(id: string, updates: UpdateTranscript): Promise<Transcript | undefined> {
    const result = await db.update(transcripts)
      .set({
        ...updates,
        updatedAt: new Date(),
      } as any)
      .where(eq(transcripts.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteTranscript(id: string): Promise<boolean> {
    const result = await db.delete(transcripts).where(eq(transcripts.id, id)).returning();
    return result.length > 0;
  }

  async listTranscripts(): Promise<Transcript[]> {
    return await db.select().from(transcripts).orderBy(desc(transcripts.updatedAt));
  }
}

export const storage = new DatabaseStorage();
