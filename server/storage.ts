import { type Transcript, type InsertTranscript, type UpdateTranscript } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getTranscript(id: string): Promise<Transcript | undefined>;
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  updateTranscript(id: string, updates: UpdateTranscript): Promise<Transcript | undefined>;
  deleteTranscript(id: string): Promise<boolean>;
  listTranscripts(): Promise<Transcript[]>;
}

export class MemStorage implements IStorage {
  private transcripts: Map<string, Transcript>;

  constructor() {
    this.transcripts = new Map();
  }

  async getTranscript(id: string): Promise<Transcript | undefined> {
    return this.transcripts.get(id);
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const id = randomUUID();
    const now = new Date();
    const transcript: Transcript = {
      id,
      filename: insertTranscript.filename,
      originalContent: insertTranscript.originalContent,
      processedContent: null,
      detectiveInfo: (insertTranscript.detectiveInfo as { name?: string; badge?: string; section?: string; } | null) || null,
      interviewInfo: (insertTranscript.interviewInfo as { date?: string; time?: string; location?: string; } | null) || null,
      speakerType: insertTranscript.speakerType || "standard",
      speakers: (insertTranscript.speakers as Array<{ label: string; description: string }>) || [],
      validationResults: null,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    this.transcripts.set(id, transcript);
    return transcript;
  }

  async updateTranscript(id: string, updates: UpdateTranscript): Promise<Transcript | undefined> {
    const existing = this.transcripts.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Transcript = {
      ...existing,
      processedContent: updates.processedContent !== undefined ? updates.processedContent : existing.processedContent,
      detectiveInfo: updates.detectiveInfo !== undefined ? (updates.detectiveInfo as { name?: string; badge?: string; section?: string; } | null) : existing.detectiveInfo,
      interviewInfo: updates.interviewInfo !== undefined ? (updates.interviewInfo as { date?: string; time?: string; location?: string; } | null) : existing.interviewInfo,
      speakerType: updates.speakerType !== undefined ? updates.speakerType : existing.speakerType,
      speakers: updates.speakers !== undefined ? (updates.speakers as Array<{ label: string; description: string }> | null) : existing.speakers,
      validationResults: updates.validationResults !== undefined ? (updates.validationResults as { issues: Array<{ line: number; type: string; message: string; suggestion?: string }>; score: number; } | null) : existing.validationResults,
      status: updates.status !== undefined ? updates.status : existing.status,
      updatedAt: new Date(),
    };
    this.transcripts.set(id, updated);
    return updated;
  }

  async deleteTranscript(id: string): Promise<boolean> {
    return this.transcripts.delete(id);
  }

  async listTranscripts(): Promise<Transcript[]> {
    return Array.from(this.transcripts.values()).sort((a, b) => {
      const aTime = a.updatedAt ? a.updatedAt.getTime() : 0;
      const bTime = b.updatedAt ? b.updatedAt.getTime() : 0;
      return bTime - aTime;
    });
  }
}

export const storage = new MemStorage();
