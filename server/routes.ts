
import express, { type Request, Response } from "express";
import multer from "multer";
import { getStorage } from "./storage";
import { validateTranscript } from "../client/src/lib/validation-rules";
import { processTranscriptContent, generateLVMPDHeader, generateLVMPDFooter, generateProcessingSummary } from "../client/src/lib/transcript-processor";

const router = express.Router();
const upload = multer();

export async function registerRoutes(app: express.Express) {
  const { createServer } = await import("http");
  const server = createServer(app);

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
    const { id } = req.params;
    try {
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

  // Upload transcript file
  app.post("/api/transcripts/upload", upload.single("file"), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { originalname, buffer } = req.file;
    
    try {
      const content = buffer.toString("utf-8");
      const lines = content.split('\n');

      // Comprehensive validation for original content
      const originalValidation = {
        issues: [] as Array<{ line: number; type: string; message: string; suggestion?: string }>,
        score: 100
      };

      // Check for common transcription issues
      lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // Check for unclear audio markers
        if (line.match(/\[unclear\]|\[inaudible\]|\?\?\?/i)) {
          originalValidation.issues.push({
            line: lineNumber,
            type: "audio_quality",
            message: "Contains unclear audio markers"
          });
        }

        // Check for common transcription errors
        if (line.match(/\b(ejaculation|could of|should of|would of|pacific specific)\b/i)) {
          originalValidation.issues.push({
            line: lineNumber,
            type: "transcription_error",
            message: "Contains common transcription errors"
          });
        }

        // Check for unstandardized discourse markers
        if (line.match(/\b(Mh(?!-Mh)|mm-?hm|mhm|uh|uhh|um|umm)\b/i)) {
          originalValidation.issues.push({
            line: lineNumber,
            type: "discourse_marker",
            message: "Contains unstandardized discourse markers"
          });
        }

        // Check for numbers that should be spelled out
        if (line.match(/\b[1-9]|10\b/)) {
          originalValidation.issues.push({
            line: lineNumber,
            type: "number_format",
            message: "Contains numbers that should be spelled out"
          });
        }

        // Check for date formatting issues
        if (line.match(/\d+(st|nd|rd|th)/)) {
          originalValidation.issues.push({
            line: lineNumber,
            type: "date_format",
            message: "Contains ordinal suffixes that should be removed"
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

      // Calculate original score based on severity
      const errorCount = originalValidation.issues.filter(i => 
        ['header', 'footer', 'transcription_error'].includes(i.type)
      ).length;
      const warningCount = originalValidation.issues.filter(i => 
        ['audio_quality', 'discourse_marker', 'number_format', 'date_format'].includes(i.type)
      ).length;

      originalValidation.score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5));

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
        status: "draft",
        validationResults: originalValidation,
        versions: [originalVersion]
      });

      res.status(201).json(transcript);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // Process transcript with comprehensive LVMPD rules
  app.post("/api/transcripts/:id/process", async (req, res) => {
    const { id } = req.params;
    try {
      const transcript = await (await getStorage()).getTranscript(id);
      
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }

      // Update status to processing
      await (await getStorage()).updateTranscript(id, { status: "processing" });

      // Apply comprehensive LVMPD processing rules
      const { processedContent, appliedRules } = processTranscriptContent(transcript.originalContent);

      // Generate LVMPD header
      const { detectiveInfo, interviewInfo } = transcript;
      let header = '';
      if (detectiveInfo?.name && detectiveInfo?.badge && detectiveInfo?.section && interviewInfo?.date && interviewInfo?.time) {
        header = generateLVMPDHeader(detectiveInfo, interviewInfo);
      }

      // Generate LVMPD footer
      let footer = '';
      if (interviewInfo?.date && interviewInfo?.time && interviewInfo?.location) {
        footer = generateLVMPDFooter(interviewInfo);
      }

      const finalContent = header + processedContent + footer;

      // Enhanced validation for processed content
      const validationResults = validateTranscript(finalContent, transcript.speakers || []);

      // Calculate improvement score based on applied rules
      let improvementScore = 0;
      const issuesFixed = appliedRules.reduce((total, { matches }) => total + matches, 0);
      
      // Bonus points for different categories of improvements
      const categoryBonuses = {
        discourse: 5,
        numbers: 10,
        dates: 8,
        time: 8,
        corrections: 15,
        formatting: 5,
        punctuation: 3
      };

      appliedRules.forEach(({ rule, matches }) => {
        improvementScore += (categoryBonuses[rule.category] || 5) * matches;
      });

      // Check for LVMPD formatting improvements
      const hasProperHeader = finalContent.includes("The following is the transcription of a tape-recorded interview");
      const hasProperFooter = finalContent.includes("THIS STATEMENT WAS COMPLETED AT");
      
      if (hasProperHeader) improvementScore += 20;
      if (hasProperFooter) improvementScore += 20;

      // Calculate final score
      const originalScore = transcript.validationResults?.score || 0;
      let baseScore = 100 - (validationResults.issues.length * 3);
      let bonusScore = Math.min(50, improvementScore * 0.5);
      
      validationResults.score = Math.min(100, Math.max(originalScore, baseScore + bonusScore));

      // Create version for processed content with detailed scoring
      const existingVersions = Array.isArray(transcript.versions) ? transcript.versions : [];
      const newProcessedVersion = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        content: finalContent,
        type: "processed" as const,
        changes: `LVMPD processing applied - ${issuesFixed} corrections made`,
        score: validationResults.score
      };

      const updatedVersions = [...existingVersions, newProcessedVersion];

      // Update transcript with processed content
      const updatedTranscript = await (await getStorage()).updateTranscript(id, {
        processedContent: finalContent,
        validationResults,
        status: "ready"
      });

      // Generate processing summary
      const processingSummary = generateProcessingSummary(appliedRules);

      res.json({
        ...updatedTranscript,
        processingSummary,
        appliedRules: appliedRules.length,
        issuesFixed
      });
    } catch (error) {
      console.error("Error processing transcript:", error);
      
      // Update status to error
      await (await getStorage()).updateTranscript(id, { status: "error" });
      
      res.status(500).json({ message: "Failed to process transcript" });
    }
  });

  // Update transcript
  app.patch("/api/transcripts/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const transcript = await (await getStorage()).updateTranscript(id, req.body);
      if (!transcript) {
        return res.status(404).json({ message: "Transcript not found" });
      }
      res.json(transcript);
    } catch (error) {
      console.error("Error updating transcript:", error);
      res.status(500).json({ message: "Failed to update transcript" });
    }
  });

  // Delete transcript
  app.delete("/api/transcripts/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const success = await (await getStorage()).deleteTranscript(id);
      if (!success) {
        return res.status(404).json({ message: "Transcript not found" });
      }
      res.json({ message: "Transcript deleted successfully" });
    } catch (error) {
      console.error("Error deleting transcript:", error);
      res.status(500).json({ message: "Failed to delete transcript" });
    }
  });

  return server;
}
