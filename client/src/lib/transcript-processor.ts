export interface ProcessingRule {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  description: string;
}

export const LVMPD_PROCESSING_RULES: ProcessingRule[] = [
  // Discourse markers standardization
  {
    name: "discourse_markers",
    pattern: /\bMh\b/g,
    replacement: "Mh-Mh",
    description: "Standardize discourse markers"
  },
  {
    name: "mmhm_standardization",
    pattern: /\b(mm-?hm|mhm)\b/gi,
    replacement: "Mmhm",
    description: "Standardize mmhm responses"
  },
  {
    name: "uh_standardization",
    pattern: /\b(uh|uhh)\b/gi,
    replacement: "Uh",
    description: "Standardize uh fillers"
  },

  // Number formatting
  {
    name: "spell_numbers_1_10",
    pattern: /\b(1|2|3|4|5|6|7|8|9|10)\b/g,
    replacement: (match) => {
      const numbers = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
      return numbers[parseInt(match) - 1];
    },
    description: "Spell out numbers 1-10"
  },

  // Date formatting - remove ordinal suffixes
  {
    name: "remove_date_ordinals",
    pattern: /\b(\d+)(st|nd|rd|th)\b/g,
    replacement: "$1",
    description: "Remove ordinal suffixes from dates"
  },

  // Time formatting
  {
    name: "time_format",
    pattern: /\b(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)\b/gi,
    replacement: "$1:$2 $3",
    description: "Standardize time format"
  },

  // Common transcription errors
  {
    name: "ejaculation_correction",
    pattern: /\bejaculation\b/gi,
    replacement: "ejaculate",
    description: "Correct common mishearing"
  },

  // Clean up nonsense phrases (example)
  {
    name: "clean_nonsense",
    pattern: /\bbump hole there has doors\b/gi,
    replacement: "bunch of doors",
    description: "Fix garbled phrases"
  },

  // Speaker interruptions
  {
    name: "interruption_markers",
    pattern: /\b(but|and|so|well)\s*-{2,}\s*/gi,
    replacement: "$1—",
    description: "Standardize interruption markers"
  }
];

export function processTranscriptContent(content: string): string {
  let processedContent = content;

  // Apply each processing rule
  for (const rule of LVMPD_PROCESSING_RULES) {
    if (typeof rule.replacement === "string") {
      processedContent = processedContent.replace(rule.pattern, rule.replacement);
    } else {
      processedContent = processedContent.replace(rule.pattern, rule.replacement);
    }
  }

  return processedContent;
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
