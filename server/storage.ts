import { type Transcript, type InsertTranscript, type UpdateTranscript, transcripts } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import 'dotenv/config';

export interface IStorage {
  getTranscript(id: string): Promise<Transcript | undefined>;
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  updateTranscript(id: string, updates: UpdateTranscript): Promise<Transcript | undefined>;
  deleteTranscript(id: string): Promise<boolean>;
  listTranscripts(): Promise<Transcript[]>;
}

// In-memory storage implementation for development
class InMemoryStorage implements IStorage {
  private transcripts: Map<string, Transcript> = new Map();

  async getTranscript(id: string): Promise<Transcript | undefined> {
    return this.transcripts.get(id);
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const id = insertTranscript.id || Math.random().toString(36).substring(7);
    const now = new Date();
    const transcript: Transcript = {
      ...insertTranscript,
      id,
      createdAt: now,
      updatedAt: now,
    } as Transcript;
    this.transcripts.set(id, transcript);
    return transcript;
  }

  async updateTranscript(id: string, updates: UpdateTranscript): Promise<Transcript | undefined> {
    const existing = this.transcripts.get(id);
    if (!existing) return undefined;
    
    const updated: Transcript = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.transcripts.set(id, updated);
    return updated;
  }

  async deleteTranscript(id: string): Promise<boolean> {
    return this.transcripts.delete(id);
  }

  async listTranscripts(): Promise<Transcript[]> {
    return Array.from(this.transcripts.values()).sort(
      (a, b) => (b.updatedAt || new Date()).getTime() - (a.updatedAt || new Date()).getTime()
    );
  }
}

// Initialize database connection or fallback to in-memory storage
let storage: IStorage;

async function initializeStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    try {
      console.log('Attempting to connect to PostgreSQL database...');
      const sql = neon(process.env.DATABASE_URL);
      const db = drizzle(sql);
      
      // Test the connection
      await db.select().from(transcripts).limit(1);
      console.log('PostgreSQL database connection successful');
      
      class DatabaseStorage implements IStorage {
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
      
      return new DatabaseStorage();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Failed to connect to PostgreSQL:', errorMessage);
      console.log('Falling back to in-memory storage for development');
      return new InMemoryStorage();
    }
  } else {
    console.log('DATABASE_URL not found, using in-memory storage for development');
    return new InMemoryStorage();
  }
}

// Export storage initialization function
export async function getStorage(): Promise<IStorage> {
  if (!storage) {
    storage = await initializeStorage();
  }
  return storage;
}
