export interface ValidationIssue {
  line: number;
  type: string;
  message: string;
  suggestion?: string;
  severity: "error" | "warning" | "info";
}

export interface ValidationResult {
  issues: ValidationIssue[];
  score: number;
}

export function validateTranscript(content: string, speakers: any[] = []): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for proper speaker identification
    if (line.trim() && !line.match(/^[A-Z0-9]+:|The following|THIS STATEMENT/)) {
      const hasSpeakerLabel = speakers.some(speaker => 
        line.startsWith(speaker.label)
      );
      
      if (!hasSpeakerLabel && line.trim().length > 0) {
        issues.push({
          line: lineNumber,
          type: "speaker_identification",
          message: "Line missing speaker identification",
          severity: "warning"
        });
      }
    }

    // Check for unstandardized discourse markers
    if (line.match(/\bMh\b/) && !line.match(/\bMh-Mh\b/)) {
      issues.push({
        line: lineNumber,
        type: "discourse_marker",
        message: "Discourse marker should be standardized",
        suggestion: line.replace(/\bMh\b/g, "Mh-Mh"),
        severity: "info"
      });
    }

    // Check for numbers that should be spelled out
    const numberMatches = line.match(/\b[1-9]|10\b/g);
    if (numberMatches) {
      issues.push({
        line: lineNumber,
        type: "number_format",
        message: "Numbers 1-10 should be spelled out",
        severity: "info"
      });
    }

    // Check for time format issues
    if (line.match(/\d+:\d+\s*(am|pm)/i) && !line.match(/\d+:\d+\s+(am|pm)/i)) {
      issues.push({
        line: lineNumber,
        type: "time_format",
        message: "Time format should include space before am/pm",
        severity: "warning"
      });
    }

    // Check for ordinal suffixes in dates
    if (line.match(/\d+(st|nd|rd|th)/)) {
      issues.push({
        line: lineNumber,
        type: "date_format",
        message: "Remove ordinal suffixes from dates",
        suggestion: line.replace(/(\d+)(st|nd|rd|th)/g, "$1"),
        severity: "info"
      });
    }

    // Check for missing punctuation at end of statements
    if (line.match(/^[A-Z0-9]+:/) && line.length > 10 && !line.match(/[.!?]$/)) {
      issues.push({
        line: lineNumber,
        type: "punctuation",
        message: "Statement should end with punctuation",
        severity: "warning"
      });
    }

    // Check for improper capitalization after speaker labels
    const speakerMatch = line.match(/^([A-Z0-9]+:)\s*([a-z])/);
    if (speakerMatch) {
      issues.push({
        line: lineNumber,
        type: "capitalization",
        message: "First word after speaker label should be capitalized",
        suggestion: line.replace(speakerMatch[0], `${speakerMatch[1]} ${speakerMatch[2].toUpperCase()}`),
        severity: "warning"
      });
    }
  });

  // Check for LVMPD header
  const hasHeader = content.includes("The following is the transcription of a tape-recorded interview");
  if (!hasHeader) {
    issues.push({
      line: 1,
      type: "header",
      message: "Missing LVMPD header",
      severity: "error"
    });
  }

  // Check for LVMPD footer
  const hasFooter = content.includes("THIS STATEMENT WAS COMPLETED AT");
  if (!hasFooter) {
    issues.push({
      line: lines.length,
      type: "footer",
      message: "Missing LVMPD footer",
      severity: "error"
    });
  }

  // Calculate score based on issues
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const infoCount = issues.filter(i => i.severity === "info").length;

  const score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 8) - (infoCount * 3));

  return {
    issues,
    score: Math.round(score)
  };
}

export function getValidationSummary(result: ValidationResult): string {
  const { issues, score } = result;
  
  if (issues.length === 0) {
    return "Perfect! No issues found.";
  }

  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const infoCount = issues.filter(i => i.severity === "info").length;

  let summary = `Score: ${score}/100. `;
  
  if (errorCount > 0) {
    summary += `${errorCount} error${errorCount > 1 ? 's' : ''}. `;
  }
  if (warningCount > 0) {
    summary += `${warningCount} warning${warningCount > 1 ? 's' : ''}. `;
  }
  if (infoCount > 0) {
    summary += `${infoCount} suggestion${infoCount > 1 ? 's' : ''}.`;
  }

  return summary.trim();
}
