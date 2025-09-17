import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranscriptSchema, updateTranscriptSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all transcripts
  app.get("/api/transcripts", async (req, res) => {
    try {
      const transcripts = await storage.listTranscripts();
      res.json(transcripts);
    } catch (error) {
      console.error("Error fetching transcripts:", error);
      res.status(500).json({ message: "Failed to fetch transcripts" });
    }
  });

  // Get single transcript
  app.get("/api/transcripts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const transcript = await storage.getTranscript(id);
      
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }
      
      res.json(transcript);
    } catch (error) {
      console.error("Error fetching transcript:", error);
      res.status(500).json({ message: "Failed to fetch transcript" });
    }
  });

  // Create new transcript
  app.post("/api/transcripts", async (req, res) => {
    try {
      const validatedData = insertTranscriptSchema.parse(req.body);
      const transcript = await storage.createTranscript(validatedData);
      res.status(201).json(transcript);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating transcript:", error);
      res.status(500).json({ message: "Failed to create transcript" });
    }
  });

  // Update transcript
  app.patch("/api/transcripts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateTranscriptSchema.parse(req.body);
      
      const transcript = await storage.updateTranscript(id, validatedData);
      
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }
      
      res.json(transcript);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating transcript:", error);
      res.status(500).json({ message: "Failed to update transcript" });
    }
  });

  // Delete transcript
  app.delete("/api/transcripts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTranscript(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Transcript not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transcript:", error);
      res.status(500).json({ message: "Failed to delete transcript" });
    }
  });

  // Upload and parse file
  app.post("/api/transcripts/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { originalname, path: filePath } = req.file;
      const fs = await import('fs');
      
      let content = '';
      
      // Read file content based on type
      if (originalname.endsWith('.txt')) {
        content = await fs.promises.readFile(filePath, 'utf-8');
      } else if (originalname.endsWith('.docx')) {
        // For now, return error for unsupported formats
        // In production, use libraries like mammoth.js for docx parsing
        return res.status(400).json({ message: "DOCX files not yet supported. Please convert to TXT format." });
      } else if (originalname.endsWith('.pdf')) {
        // For now, return error for unsupported formats
        // In production, use libraries like pdf-parse for PDF parsing
        return res.status(400).json({ message: "PDF files not yet supported. Please convert to TXT format." });
      } else {
        return res.status(400).json({ message: "Unsupported file format. Please use .txt files." });
      }

      // Clean up uploaded file
      await fs.promises.unlink(filePath);

      // Create transcript record
      const transcript = await storage.createTranscript({
        filename: originalname,
        originalContent: content,
        detectiveInfo: {},
        interviewInfo: {},
        speakerType: "standard",
        speakers: [
          { label: "Q:", description: "Interviewer" },
          { label: "A:", description: "Interviewee" }
        ],
      });

      res.status(201).json(transcript);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // Process transcript with LVMPD rules
  app.post("/api/transcripts/:id/process", async (req, res) => {
    const { id } = req.params;
    try {
      const transcript = await storage.getTranscript(id);
      
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      // Update status to processing
      await storage.updateTranscript(id, { status: "processing" });

      // Process the transcript content (simplified version)
      let processedContent = transcript.originalContent;
      
      // Apply basic corrections based on LVMPD rules
      // This is a simplified version - in production, implement comprehensive rules
      processedContent = processedContent
        .replace(/\bMh\b/g, "Mh-Mh")
        .replace(/\bUh\b/g, "Uh")
        .replace(/\bMmhm\b/g, "Mmhm")
        .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, (match) => match.toLowerCase())
        .replace(/\b(1st|2nd|3rd|4th|5th|6th|7th|8th|9th)\b/g, (match) => match.replace(/st|nd|rd|th/, ''));

      // Generate LVMPD header
      const { detectiveInfo, interviewInfo } = transcript;
      let header = '';
      if (detectiveInfo?.name && detectiveInfo?.badge && detectiveInfo?.section && interviewInfo?.date && interviewInfo?.time) {
        const date = new Date(interviewInfo.date);
        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
        const time24 = interviewInfo.time.replace(':', '');
        
        header = `The following is the transcription of a tape-recorded interview conducted by DETECTIVE ${detectiveInfo.name}, P# ${detectiveInfo.badge}, LVMPD ${detectiveInfo.section} Detail, on ${formattedDate} at ${time24} hours.\n\n`;
      }

      // Generate LVMPD footer
      let footer = '';
      if (interviewInfo?.date && interviewInfo?.time && interviewInfo?.location) {
        const date = new Date(interviewInfo.date);
        const dayNames = ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH', 'ELEVENTH', 'TWELFTH', 'THIRTEENTH', 'FOURTEENTH', 'FIFTEENTH', 'SIXTEENTH', 'SEVENTEENTH', 'EIGHTEENTH', 'NINETEENTH', 'TWENTIETH', 'TWENTY-FIRST', 'TWENTY-SECOND', 'TWENTY-THIRD', 'TWENTY-FOURTH', 'TWENTY-FIFTH', 'TWENTY-SIXTH', 'TWENTY-SEVENTH', 'TWENTY-EIGHTH', 'TWENTY-NINTH', 'THIRTIETH', 'THIRTY-FIRST'];
        const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
        
        const day = dayNames[date.getDate() - 1];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const time24 = interviewInfo.time.replace(':', '');
        
        footer = `\n\nTHIS STATEMENT WAS COMPLETED AT ${interviewInfo.location.toUpperCase()} ON THE ${day} DAY OF ${month}, ${year} AT ${time24} HOURS.`;
      }

      const finalContent = header + processedContent + footer;

      // Basic validation
      const validationResults = {
        issues: [] as Array<{ line: number; type: string; message: string; suggestion?: string }>,
        score: 100
      };

      // Check for common issues
      const lines = finalContent.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('Mh') && !line.includes('Mh-Mh')) {
          validationResults.issues.push({
            line: index + 1,
            type: "discourse_marker",
            message: "Discourse marker should be standardized",
            suggestion: line.replace(/\bMh\b/g, "Mh-Mh")
          });
        }
      });

      validationResults.score = Math.max(0, 100 - (validationResults.issues.length * 5));

      // Update transcript with processed content
      const updatedTranscript = await storage.updateTranscript(id, {
        processedContent: finalContent,
        validationResults,
        status: "ready"
      });

      res.json(updatedTranscript);
    } catch (error) {
      console.error("Error processing transcript:", error);
      await storage.updateTranscript(id, { status: "error" });
      res.status(500).json({ message: "Failed to process transcript" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
