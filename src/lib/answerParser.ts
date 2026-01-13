/**
 * Intelligent Answer Parser
 *
 * Parses combined user answers to extract multiple pieces of information
 * from a single response, making the conversation more intuitive.
 */

interface ParsedAnswer {
  /** The primary value (what was directly asked) */
  primaryValue: string;
  /** Additional fields extracted from the answer */
  extractedFields: Record<string, string>;
  /** Fields to skip in subsequent questions */
  fieldsToSkip: string[];
}

// Common patterns for job title + company combinations
const JOB_COMPANY_PATTERNS = [
  // "line cook at dennys" or "cashier at walmart"
  /^(.+?)\s+at\s+(.+)$/i,
  // "dennys line cook" or "walmart cashier"
  /^(.+?)\s+(.+?)$/i,
];

// Common job titles to help identify which part is the job title
const COMMON_JOB_TITLES = [
  'line cook', 'cook', 'chef', 'sous chef', 'prep cook',
  'server', 'waiter', 'waitress', 'host', 'hostess', 'busser', 'bartender',
  'cashier', 'sales associate', 'sales rep', 'sales representative',
  'customer service', 'customer service rep', 'receptionist',
  'manager', 'assistant manager', 'shift manager', 'store manager', 'general manager',
  'supervisor', 'team lead', 'team leader',
  'driver', 'delivery driver', 'truck driver',
  'warehouse worker', 'warehouse associate', 'stocker', 'forklift operator',
  'cleaner', 'janitor', 'housekeeper', 'custodian',
  'security guard', 'security officer',
  'barista', 'crew member', 'team member',
  'administrative assistant', 'office assistant', 'secretary', 'clerk',
  'nurse', 'nursing assistant', 'cna', 'medical assistant',
  'teacher', 'tutor', 'instructor', 'teacher assistant',
  'intern', 'internship',
  'developer', 'software developer', 'engineer', 'software engineer',
  'designer', 'graphic designer',
  'accountant', 'bookkeeper',
  'technician', 'mechanic', 'electrician', 'plumber',
];

// Common company identifiers and well-known companies
const COMMON_COMPANIES = [
  "denny's", 'dennys', 'mcdonalds', "mcdonald's", 'burger king', 'wendys', "wendy's",
  'starbucks', 'dunkin', "dunkin' donuts", 'subway', 'chipotle', 'taco bell',
  'olive garden', 'applebees', "applebee's", 'chilis', "chili's", 'ihop', 'outback',
  'walmart', 'target', 'costco', 'walgreens', 'cvs', 'kroger', 'safeway',
  'home depot', 'lowes', "lowe's", 'best buy', 'staples', 'office depot',
  'amazon', 'ups', 'fedex', 'usps',
  'bank of america', 'chase', 'wells fargo', 'citibank',
];

/**
 * Capitalizes the first letter of each word
 */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Checks if a string looks like a job title
 */
function looksLikeJobTitle(text: string): boolean {
  const lowerText = text.toLowerCase().trim();
  return COMMON_JOB_TITLES.some(title =>
    lowerText === title ||
    lowerText.includes(title) ||
    title.includes(lowerText)
  );
}

/**
 * Checks if a string looks like a company name
 */
function looksLikeCompany(text: string): boolean {
  const lowerText = text.toLowerCase().trim();
  return COMMON_COMPANIES.some(company =>
    lowerText === company ||
    lowerText.includes(company) ||
    company.includes(lowerText)
  );
}

/**
 * Parses a combined job title + company answer
 * Examples: "line cook at dennys", "server olive garden"
 */
function parseJobAndCompany(
  answer: string,
  currentField: string
): ParsedAnswer | null {
  const trimmedAnswer = answer.trim();

  // Check for "job at company" pattern first (most explicit)
  const atMatch = trimmedAnswer.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    const [, part1, part2] = atMatch;
    const isCurrentlyAskingCompany = currentField.includes('companyName');

    // "line cook at dennys" - first part is job title, second is company
    if (looksLikeJobTitle(part1) || looksLikeCompany(part2)) {
      const jobTitle = titleCase(part1.trim());
      const companyName = titleCase(part2.trim());

      if (isCurrentlyAskingCompany) {
        // We're asking for company, but got job + company
        return {
          primaryValue: companyName,
          extractedFields: {
            'jobTitle': jobTitle,
          },
          fieldsToSkip: ['jobTitle'],
        };
      } else {
        // We're asking for job title, but got job + company
        return {
          primaryValue: jobTitle,
          extractedFields: {
            'companyName': companyName,
          },
          fieldsToSkip: ['companyName'],
        };
      }
    }
  }

  // Check for "company job" or "job company" pattern (less explicit)
  const words = trimmedAnswer.split(/\s+/);
  if (words.length >= 2 && !atMatch) {
    // Try to identify which part is job title and which is company
    let jobPart: string | null = null;
    let companyPart: string | null = null;

    // Check if first word(s) are a job title
    for (let i = words.length - 1; i >= 1; i--) {
      const firstPart = words.slice(0, i).join(' ');
      const secondPart = words.slice(i).join(' ');

      if (looksLikeJobTitle(firstPart) && looksLikeCompany(secondPart)) {
        jobPart = firstPart;
        companyPart = secondPart;
        break;
      }
      if (looksLikeCompany(firstPart) && looksLikeJobTitle(secondPart)) {
        companyPart = firstPart;
        jobPart = secondPart;
        break;
      }
    }

    if (jobPart && companyPart) {
      const isCurrentlyAskingCompany = currentField.includes('companyName');

      if (isCurrentlyAskingCompany) {
        return {
          primaryValue: titleCase(companyPart),
          extractedFields: {
            'jobTitle': titleCase(jobPart),
          },
          fieldsToSkip: ['jobTitle'],
        };
      } else {
        return {
          primaryValue: titleCase(jobPart),
          extractedFields: {
            'companyName': titleCase(companyPart),
          },
          fieldsToSkip: ['companyName'],
        };
      }
    }
  }

  return null;
}

/**
 * Parses a date range from an answer
 * Examples: "2020 to 2023", "Jan 2020 - Dec 2023", "2020-2023"
 */
function parseDateRange(answer: string): { startDate?: string; endDate?: string } | null {
  // Pattern: "month year to/- month year" or "year to/- year"
  const dateRangePattern = /(\w+\s*\d{4}|\d{4})\s*(?:to|-|–)\s*(\w+\s*\d{4}|\d{4}|present|current)/i;
  const match = answer.match(dateRangePattern);

  if (match) {
    const [, start, end] = match;
    return {
      startDate: start.trim(),
      endDate: end.toLowerCase() === 'present' || end.toLowerCase() === 'current'
        ? 'Present'
        : end.trim(),
    };
  }

  return null;
}

/**
 * Main parsing function - analyzes the answer based on the current question context
 */
export function parseAnswer(
  answer: string,
  currentField: string,
  currentQuestionId: string
): ParsedAnswer {
  // Default result - no additional parsing
  const defaultResult: ParsedAnswer = {
    primaryValue: answer.trim(),
    extractedFields: {},
    fieldsToSkip: [],
  };

  // Work experience: Company + Job Title parsing
  if (currentQuestionId.startsWith('work_company') || currentQuestionId.startsWith('work_title')) {
    const jobCompanyResult = parseJobAndCompany(answer, currentField);
    if (jobCompanyResult) {
      return jobCompanyResult;
    }
  }

  // Date range parsing for date fields
  if (currentField.includes('startDate') || currentField.includes('Start')) {
    const dateResult = parseDateRange(answer);
    if (dateResult && dateResult.startDate && dateResult.endDate) {
      // Extract the array index from the field path
      const indexMatch = currentField.match(/\[(\d+)\]/);
      const index = indexMatch ? indexMatch[1] : '0';

      return {
        primaryValue: dateResult.startDate,
        extractedFields: {
          [`endDate`]: dateResult.endDate,
        },
        fieldsToSkip: ['endDate'],
      };
    }
  }

  return defaultResult;
}

/**
 * Updates the resume data with extracted fields
 */
export function applyExtractedFields(
  currentResumeData: Record<string, unknown>,
  currentField: string,
  extractedFields: Record<string, string>
): Record<string, unknown> {
  const updatedData = { ...currentResumeData };

  // Get the base path (e.g., "workExperience[0]" from "workExperience[0].companyName")
  const basePath = currentField.split('.').slice(0, -1).join('.');

  for (const [fieldName, value] of Object.entries(extractedFields)) {
    const fullPath = basePath ? `${basePath}.${fieldName}` : fieldName;

    // Set nested value using the path
    const keys = fullPath.split('.');
    let current: Record<string, unknown> = updatedData;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const arrayMatch = key.match(/(\w+)\[(\d+)\]/);

      if (arrayMatch) {
        const [, arrayName, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);
        if (!Array.isArray(current[arrayName])) {
          current[arrayName] = [];
        }
        const arr = current[arrayName] as Record<string, unknown>[];
        if (!arr[index]) {
          arr[index] = {};
        }
        current = arr[index];
      } else {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }
    }

    current[keys[keys.length - 1]] = value;
  }

  return updatedData;
}

/**
 * Checks if a question should be skipped based on already-extracted fields
 */
export function shouldSkipQuestion(
  questionField: string,
  fieldsToSkip: string[],
  currentResumeData: Record<string, unknown>
): boolean {
  // Get the field name without the array index path
  const fieldName = questionField.split('.').pop() || '';

  // Check if this field was already extracted
  if (fieldsToSkip.includes(fieldName)) {
    return true;
  }

  // Also check if the field already has a value
  // This handles cases where data was extracted from a previous answer
  const value = getNestedValue(currentResumeData, questionField);
  if (value && typeof value === 'string' && value.trim() !== '') {
    return true;
  }

  return false;
}

/**
 * Gets a nested value from an object using a dot-notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
    if (arrayMatch) {
      const [, arrayName, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      const arr = (current as Record<string, unknown>)[arrayName];
      if (!Array.isArray(arr)) {
        return undefined;
      }
      current = arr[index];
    } else {
      current = (current as Record<string, unknown>)[key];
    }
  }

  return current;
}
