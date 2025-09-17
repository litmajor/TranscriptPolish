import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertTranscriptSchema, updateTranscriptSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all transcripts
  app.get("/api/transcripts", async (req, res) => {
    try {
      const transcripts = await (await getStorage()).listTranscripts();
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
      const transcript = await (await getStorage()).getTranscript(id);
      
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
      const transcript = await (await getStorage()).createTranscript(validatedData);
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
      
      const transcript = await (await getStorage()).updateTranscript(id, validatedData);
      
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
      const deleted = await (await getStorage()).deleteTranscript(id);
      
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

      // Score original content
      const originalValidation = {
        issues: [] as Array<{ line: number; type: string; message: string; suggestion?: string }>,
        score: 0
      };

      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Check for discourse marker issues
        if (line.includes('Mh') && !line.includes('Mh-Mh')) {
          originalValidation.issues.push({
            line: index + 1,
            type: "discourse_marker",
            message: "Discourse marker needs standardization",
            suggestion: line.replace(/\bMh\b/g, "Mh-Mh")
          });
        }
        // Check for numbers that should be spelled out
        if (line.match(/\b[1-9]|10\b/)) {
          originalValidation.issues.push({
            line: index + 1,
            type: "number_format",
            message: "Numbers 1-10 should be spelled out"
          });
        }
        // Check for missing punctuation
        if (line.match(/^[A-Z0-9]+:/) && line.length > 10 && !line.match(/[.!?]$/)) {
          originalValidation.issues.push({
            line: index + 1,
            type: "punctuation",
            message: "Statement should end with punctuation"
          });
        }
      });

      // Check for LVMPD formatting
      const hasHeader = content.includes("The following is the transcription");
      const hasFooter = content.includes("THIS STATEMENT WAS COMPLETED");
      
      if (!hasHeader) {
        originalValidation.issues.push({
          line: 1,
          type: "header",
          message: "Missing LVMPD header"
        });
      }
      if (!hasFooter) {
        originalValidation.issues.push({
          line: lines.length,
          type: "footer",
          message: "Missing LVMPD footer"
        });
      }

      // Calculate original score
      originalValidation.score = Math.max(0, 100 - (originalValidation.issues.length * 8));

      // Create initial version for original content
      const originalVersion = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        content: content,
        type: "original" as const,
        changes: "Initial upload",
        score: originalValidation.score
      };

      // Create transcript record
      const transcript = await (await getStorage()).createTranscript({
        filename: originalname,
        originalContent: content,
        detectiveInfo: {},
        interviewInfo: {},
        speakerType: "standard",
        speakers: [
          { label: "Q:", description: "Interviewer" },
          { label: "A:", description: "Interviewee" }
        ],
        validationResults: originalValidation,
        versions: [originalVersion]
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
      const transcript = await (await getStorage()).getTranscript(id);
      
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      // Update status to processing
      await (await getStorage()).updateTranscript(id, { status: "processing" });

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

      // Enhanced validation for processed content
      const validationResults = {
        issues: [] as Array<{ line: number; type: string; message: string; suggestion?: string }>,
        score: 100
      };

      const processedLines = finalContent.split('\n');
      const originalLines = transcript.originalContent.split('\n');
      
      let improvementScore = 0;
      let issueCount = 0;

      // Check for remaining issues
      processedLines.forEach((line, index) => {
        if (line.includes('Mh') && !line.includes('Mh-Mh')) {
          validationResults.issues.push({
            line: index + 1,
            type: "discourse_marker",
            message: "Discourse marker should be standardized",
            suggestion: line.replace(/\bMh\b/g, "Mh-Mh")
          });
          issueCount++;
        }
        
        if (line.match(/\b[1-9]|10\b/) && !line.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/)) {
          validationResults.issues.push({
            line: index + 1,
            type: "number_format",
            message: "Numbers should be spelled out"
          });
          issueCount++;
        }
      });

      // Calculate improvement metrics
      const originalIssues = transcript.validationResults?.issues?.length || 0;
      const processedIssues = validationResults.issues.length;
      const issuesFixed = Math.max(0, originalIssues - processedIssues);

      // Check for LVMPD formatting improvements
      const hasProperHeader = finalContent.includes("The following is the transcription of a tape-recorded interview");
      const hasProperFooter = finalContent.includes("THIS STATEMENT WAS COMPLETED AT");
      
      if (hasProperHeader) improvementScore += 15;
      if (hasProperFooter) improvementScore += 15;

      // Reward content improvements
      const originalWords = transcript.originalContent.split(/\s+/).length;
      const processedWords = finalContent.split(/\s+/).length;
      const contentImprovement = Math.abs(processedWords - originalWords) / originalWords;

      // Calculate final score
      let baseScore = 100 - (processedIssues * 5);
      let bonusScore = improvementScore + (issuesFixed * 10) + (contentImprovement * 20);
      
      validationResults.score = Math.min(100, Math.max(0, baseScore + bonusScore));

      // Create version for processed content with scoring
      const existingVersions = transcript.versions || [];
      const newProcessedVersion = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        content: finalContent,
        type: "processed" as const,
        changes: "LVMPD processing applied",
        score: validationResults.score
      };

      // Update transcript with processed content and version
      const updatedTranscript = await (await getStorage()).updateTranscript(id, {
        processedContent: finalContent,
        validationResults,
        status: "ready",
        versions: [...existingVersions, newProcessedVersion]
      });

      res.json(updatedTranscript);
    } catch (error) {
      console.error("Error processing transcript:", error);
      await (await getStorage()).updateTranscript(id, { status: "error" });
      res.status(500).json({ message: "Failed to process transcript" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
