
export interface ProcessingRule {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  description: string;
  category: "discourse" | "numbers" | "dates" | "time" | "corrections" | "formatting" | "punctuation" | "structure";
  priority: number; // Lower number = higher priority
}

export const LVMPD_PROCESSING_RULES: ProcessingRule[] = [
  // Structure and formatting rules (highest priority)
  // Structure and formatting rules (highest priority)
  {
    name: "clean_multiple_newlines_pre",
    pattern: /\n{3,}/g,
    replacement: "\n\n",
    description: "Remove excessive line breaks before processing",
    category: "structure",
    priority: 1
  },

  // Discourse markers standardization
  {
    name: "discourse_markers",
    pattern: /\bMh\b/g,
    replacement: "Mh-Mh",
    description: "Standardize discourse markers",
    category: "discourse",
    priority: 10
  },
  {
    name: "mmhm_standardization",
    pattern: /\b(mm-?hm|mhm|mmm|hmm)\b/gi,
    replacement: "Mmhm",
    description: "Standardize mmhm responses",
    category: "discourse",
    priority: 10
  },
  {
    name: "uh_standardization",
    pattern: /\b(uh|uhh|um|umm)\b/gi,
    replacement: "Uh",
    description: "Standardize uh fillers",
    category: "discourse",
    priority: 10
  },
  {
    name: "yeah_standardization",
    pattern: /\b(yeah|yah|ya)\b/gi,
    replacement: "Yeah",
    description: "Standardize yeah responses",
    category: "discourse",
    priority: 10
  },

  // Number formatting - spell out 1-10
  {
    name: "spell_numbers_1_10",
    pattern: /\b(1|2|3|4|5|6|7|8|9|10)\b/g,
    replacement: (match) => {
      const numbers = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
      return numbers[parseInt(match) - 1];
    },
    description: "Spell out numbers 1-10",
    category: "numbers",
    priority: 15
  },

  // Date formatting - remove ordinal suffixes
  {
    name: "remove_date_ordinals",
    pattern: /\b(\d+)(st|nd|rd|th)\b/g,
    replacement: "$1",
    description: "Remove ordinal suffixes from dates",
    category: "dates",
    priority: 15
  },

  // Time formatting
  {
    name: "time_format",
    pattern: /\b(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)\b/gi,
    replacement: "$1:$2 $3",
    description: "Standardize time format",
    category: "time",
    priority: 15
  },

  // Common transcription errors and corrections
  {
    name: "ejaculation_correction",
    pattern: /\bejaculation\b/gi,
    replacement: "ejaculate",
    description: "Correct common mishearing",
    category: "corrections",
    priority: 20
  },
  {
    name: "pacific_specific_correction",
    pattern: /\bpacific\b/gi,
    replacement: "specific",
    description: "Correct pacific/specific confusion",
    category: "corrections",
    priority: 20
  },
  {
    name: "calvary_cavalry_correction",
    pattern: /\bcalvary\b/gi,
    replacement: "cavalry",
    description: "Correct calvary/cavalry confusion",
    category: "corrections",
    priority: 20
  },
  {
    name: "could_of_correction",
    pattern: /\bcould of\b/gi,
    replacement: "could have",
    description: "Correct could of/could have",
    category: "corrections",
    priority: 20
  },
  {
    name: "should_of_correction",
    pattern: /\bshould of\b/gi,
    replacement: "should have",
    description: "Correct should of/should have",
    category: "corrections",
    priority: 20
  },
  {
    name: "would_of_correction",
    pattern: /\bwould of\b/gi,
    replacement: "would have",
    description: "Correct would of/would have",
    category: "corrections",
    priority: 20
  },

  // Clean up nonsense phrases
  {
    name: "clean_nonsense_doors",
    pattern: /\bbump hole there has doors\b/gi,
    replacement: "bunch of doors",
    description: "Fix garbled phrases",
    category: "corrections",
    priority: 20
  },
  {
    name: "clean_nonsense_general",
    pattern: /\b(illegible|inaudible|unclear)\b/gi,
    replacement: "[inaudible]",
    description: "Standardize unclear audio markers",
    category: "formatting",
    priority: 25
  },

  // Speaker interruptions and formatting
  {
    name: "interruption_markers",
    pattern: /\b(but|and|so|well)\s*-{2,}\s*/gi,
    replacement: "$1—",
    description: "Standardize interruption markers",
    category: "formatting",
    priority: 25
  },
  {
    name: "multiple_dashes",
    pattern: /-{2,}/g,
    replacement: "—",
    description: "Replace multiple dashes with em dash",
    category: "formatting",
    priority: 25
  },

  // Punctuation corrections
  {
    name: "comma_spacing",
    pattern: /\s*,\s*/g,
    replacement: ", ",
    description: "Standardize comma spacing",
    category: "punctuation",
    priority: 30
  },
  {
    name: "period_spacing",
    pattern: /\s*\.\s*/g,
    replacement: ". ",
    description: "Standardize period spacing",
    category: "punctuation",
    priority: 30
  },
  {
    name: "question_spacing",
    pattern: /\s*\?\s*/g,
    replacement: "? ",
    description: "Standardize question mark spacing",
    category: "punctuation",
    priority: 30
  },

  // Contractions standardization
  {
    name: "cant_contraction",
    pattern: /\bcan't\b/gi,
    replacement: "can't",
    description: "Standardize can't contraction",
    category: "formatting",
    priority: 30
  },
  {
    name: "wont_contraction",
    pattern: /\bwon't\b/gi,
    replacement: "won't",
    description: "Standardize won't contraction",
    category: "formatting",
    priority: 30
  },
  {
    name: "dont_contraction",
    pattern: /\bdon't\b/gi,
    replacement: "don't",
    description: "Standardize don't contraction",
    category: "formatting",
    priority: 30
  },

  // Final cleanup rules (lowest priority)
  {
    name: "clean_multiple_newlines",
    pattern: /\n{3,}/g,
    replacement: "\n\n",
    description: "Remove excessive line breaks",
    category: "formatting",
    priority: 100
  },
  {
    name: "clean_trailing_spaces",
    pattern: /[ \t]+$/gm,
    replacement: "",
    description: "Remove trailing spaces",
    category: "formatting",
    priority: 101
  }
];

export function processTranscriptContent(content: string): {
  processedContent: string;
  appliedRules: Array<{ rule: ProcessingRule; matches: number }>;
} {
  let processedContent = content;
  const appliedRules: Array<{ rule: ProcessingRule; matches: number }> = [];

  // Sort rules by priority (lower number = higher priority)
  const sortedRules = [...LVMPD_PROCESSING_RULES].sort((a, b) => a.priority - b.priority);

  // Apply each processing rule and track changes
  for (const rule of sortedRules) {
    const matches = (processedContent.match(rule.pattern) || []).length;
    
    if (matches > 0) {
      const beforeContent = processedContent;
      
      if (typeof rule.replacement === "string") {
        processedContent = processedContent.replace(rule.pattern, rule.replacement);
      } else {
        processedContent = processedContent.replace(rule.pattern, rule.replacement);
      }
      
      // Only add to applied rules if content actually changed
      if (beforeContent !== processedContent) {
        appliedRules.push({ rule, matches });
      }
    }
  }

  // Post-processing: ensure proper LVMPD structure
  processedContent = applyLVMPDStructure(processedContent);

  return { processedContent, appliedRules };
}

function applyLVMPDStructure(content: string): string {
  const lines = content.split('\n');
  const processedLines: string[] = [];
  let previousSpeaker = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }
    
    // Check if this is a speaker line (Q:, A:, etc.)
    const speakerMatch = trimmedLine.match(/^([A-Z]):(.*)$/);
    
    if (speakerMatch) {
      const [, speaker, content] = speakerMatch;
      const speakerLabel = `${speaker}:`;
      
      // Add blank line before new speaker (except first speaker)
      if (processedLines.length > 0 && speaker !== previousSpeaker) {
        processedLines.push('');
      }
      
      // Apply hanging indent to content
      if (content.trim()) {
        const sentences = content.trim().split(/(?<=[.!?])\s+/);
        
        // First sentence on same line as speaker
        processedLines.push(`${speakerLabel} ${sentences[0]}`);
        
        // Additional sentences with hanging indent
        for (let j = 1; j < sentences.length; j++) {
          if (sentences[j].trim()) {
            processedLines.push(`     ${sentences[j]}`);
          }
        }
      } else {
        processedLines.push(speakerLabel);
      }
      
      previousSpeaker = speaker;
    } else {
      // Non-speaker line - could be continuation or other content
      if (previousSpeaker && !trimmedLine.startsWith('     ')) {
        // Apply hanging indent to continuation lines
        processedLines.push(`     ${trimmedLine}`);
      } else {
        processedLines.push(trimmedLine);
      }
    }
  }
  
  return processedLines.join('\n');
}

export function generateLVMPDHeader(detectiveInfo: any, interviewInfo: any): string {
  if (!detectiveInfo?.name || !detectiveInfo?.badge || !detectiveInfo?.section || 
      !interviewInfo?.date || !interviewInfo?.time) {
    return "";
  }

  const date = new Date(interviewInfo.date);
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  const time24 = interviewInfo.time.replace(':', '');

  return `The following is the transcription of a tape-recorded interview conducted by DETECTIVE ${detectiveInfo.name}, P# ${detectiveInfo.badge}, LVMPD ${detectiveInfo.section} Detail, on ${formattedDate} at ${time24} hours.\n\n`;
}

export function generateLVMPDFooter(interviewInfo: any): string {
  if (!interviewInfo?.date || !interviewInfo?.time || !interviewInfo?.location) {
    return "";
  }

  const date = new Date(interviewInfo.date);
  const dayNames = ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH', 'ELEVENTH', 'TWELFTH', 'THIRTEENTH', 'FOURTEENTH', 'FIFTEENTH', 'SIXTEENTH', 'SEVENTEENTH', 'EIGHTEENTH', 'NINETEENTH', 'TWENTIETH', 'TWENTY-FIRST', 'TWENTY-SECOND', 'TWENTY-THIRD', 'TWENTY-FOURTH', 'TWENTY-FIFTH', 'TWENTY-SIXTH', 'TWENTY-SEVENTH', 'TWENTY-EIGHTH', 'TWENTY-NINTH', 'THIRTIETH', 'THIRTY-FIRST'];
  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

  const day = dayNames[date.getDate() - 1];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const time24 = interviewInfo.time.replace(':', '');

  return `\n\nTHIS STATEMENT WAS COMPLETED AT ${interviewInfo.location.toUpperCase()} ON THE ${day} DAY OF ${month}, ${year} AT ${time24} HOURS.`;
}

export function generateProcessingSummary(appliedRules: Array<{ rule: ProcessingRule; matches: number }>): string {
  if (appliedRules.length === 0) {
    return "No processing rules were applied.";
  }

  const categories = appliedRules.reduce((acc, { rule, matches }) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(`${rule.description} (${matches} changes)`);
    return acc;
  }, {} as Record<string, string[]>);

  let summary = "Applied processing rules:\n";
  Object.entries(categories).forEach(([category, rules]) => {
    summary += `\n${category.toUpperCase()}:\n`;
    rules.forEach(rule => {
      summary += `  • ${rule}\n`;
    });
  });

  const totalChanges = appliedRules.reduce((sum, { matches }) => sum + matches, 0);
  summary += `\nTotal changes applied: ${totalChanges}`;

  return summary;
}
