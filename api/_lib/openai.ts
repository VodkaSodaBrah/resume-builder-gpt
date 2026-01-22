import OpenAI from 'openai';

// Lazy initialization to avoid loading before Azure Functions sets env vars
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export interface EnhancementResult {
  enhanced: string;
  suggestions?: string[];
}

// ============================================================================
// OPTIMIZED SYSTEM PROMPTS FOR GPT-5-mini
// ============================================================================
// Best practices applied:
// 1. Concise, structured instructions (token-efficient)
// 2. Explicit output format with examples
// 3. Role constraints clearly defined
// 4. Numbered guidelines for consistency
// ============================================================================

const RESUME_ENHANCEMENT_PROMPT = `Role: Expert resume writer specializing in ATS-optimized content.

Task: Transform job descriptions into impactful, professional bullet points.

Rules:
1. Start each bullet with a strong action verb (Led, Managed, Developed, Achieved, Implemented, Created, Optimized)
2. Include metrics/numbers when possible (estimate reasonable figures if none provided)
3. Keep bullets concise: 1-2 lines each
4. Use industry-standard terminology for ATS compatibility
5. Preserve truthfulness - enhance presentation, don't invent duties
6. Match the input language

Output Format: Return ONLY the enhanced bullet points, one per line starting with •

Example Input: "helped customers and did sales stuff"
Example Output: • Delivered exceptional customer service to 50+ daily patrons, driving repeat business
• Generated $X in monthly sales through consultative selling techniques`;

const SKILL_SUGGESTION_PROMPT = `Role: Career advisor analyzing work experience to identify implicit skills.

Task: Suggest 3-5 relevant skills the candidate likely has based on their experience but didn't list.

Rules:
1. Only suggest skills clearly implied by the work described
2. Avoid duplicating their existing skills
3. Prioritize in-demand, transferable skills
4. Be specific (not "communication" but "client communication" or "technical documentation")

Output Format: Return a JSON array of strings, nothing else.
Example: ["inventory management", "POS systems", "team coordination"]`;

const TRANSLATION_PROMPT = `Role: Professional translator for resume/CV content.

Task: Translate while maintaining professional tone and ATS compatibility.

Rules:
1. Keep proper nouns, company names, and technical terms in original form
2. Use formal/professional register appropriate for resumes
3. Maintain bullet point formatting
4. Preserve any metrics/numbers exactly

Output: Return ONLY the translated text, no explanations.`;

const PROFESSIONAL_SUMMARY_PROMPT = `Role: Resume writer creating professional summaries.

Task: Write a 2-3 sentence professional summary for a resume.

Rules:
1. Do NOT include the person's name
2. Highlight years of experience (estimate from roles if needed)
3. Mention 2-3 key skills or strengths
4. Include target role/industry focus if clear
5. Use confident, active language
6. Match the specified language

Output: Return ONLY the summary paragraph, no headers or labels.

Example: "Results-driven retail professional with 3+ years of experience in customer service and sales. Proven track record of exceeding sales targets and training new team members. Seeking to leverage strong interpersonal skills in a supervisory role."`;

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const enhanceJobDescription = async (
  description: string,
  jobTitle: string,
  language: string = 'en'
): Promise<EnhancementResult> => {
  try {
    // Structured user prompt for consistent parsing
    const userPrompt = `Position: ${jobTitle}
Language: ${language}
Original:
${description}

Enhanced:`;

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: RESUME_ENHANCEMENT_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      // Note: gpt-4.1-mini only supports temperature=1 (default)
      max_completion_tokens: 400, // Reduced - bullet points should be concise
    });

    const enhanced = response.choices[0]?.message?.content?.trim() || description;

    return { enhanced };
  } catch (error) {
    console.error('Error enhancing job description:', error);
    return { enhanced: description };
  }
};

export const suggestSkills = async (
  workExperience: Array<{ jobTitle: string; responsibilities: string }>,
  existingSkills: string[]
): Promise<string[]> => {
  try {
    // Compact experience format
    const experienceSummary = workExperience
      .map((exp) => `• ${exp.jobTitle}: ${exp.responsibilities.slice(0, 200)}`)
      .join('\n');

    const userPrompt = `Experience:
${experienceSummary}

Already listed: ${existingSkills.slice(0, 10).join(', ') || 'none'}

JSON:`;

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: SKILL_SUGGESTION_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      // Note: gpt-4.1-mini only supports temperature=1 (default)
      max_completion_tokens: 100, // JSON array is small
    });

    const content = response.choices[0]?.message?.content?.trim() || '[]';

    try {
      // Handle potential markdown code blocks
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(jsonContent);
      return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];
    } catch {
      // Try to extract array from malformed response
      const arrayMatch = content.match(/\[.*\]/s);
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]).slice(0, 5);
        } catch {
          return [];
        }
      }
      return [];
    }
  } catch (error) {
    console.error('Error suggesting skills:', error);
    return [];
  }
};

export const translateContent = async (
  content: string,
  targetLanguage: string
): Promise<string> => {
  try {
    const userPrompt = `Target: ${targetLanguage}
Text:
${content}

Translation:`;

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: TRANSLATION_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      // Note: gpt-4.1-mini only supports temperature=1 (default)
      max_completion_tokens: Math.min(content.length * 2, 1500), // Scale with input
    });

    return response.choices[0]?.message?.content?.trim() || content;
  } catch (error) {
    console.error('Error translating content:', error);
    return content;
  }
};

export const generateProfessionalSummary = async (
  personalInfo: { fullName: string },
  workExperience: Array<{ jobTitle: string; responsibilities: string }>,
  skills: string[],
  language: string = 'en'
): Promise<string> => {
  try {
    // Extract job titles for role focus
    const roles = workExperience
      .slice(0, 3)
      .map((exp) => exp.jobTitle)
      .join(', ');

    // Calculate approximate years of experience
    const yearsExp = workExperience.length > 0
      ? `${Math.max(1, workExperience.length)}+`
      : '';

    const userPrompt = `Roles: ${roles}
${yearsExp ? `Years: ${yearsExp}` : ''}
Skills: ${skills.slice(0, 5).join(', ') || 'various'}
Language: ${language}

Summary:`;

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: PROFESSIONAL_SUMMARY_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      // Note: gpt-4.1-mini only supports temperature=1 (default)
      max_completion_tokens: 120, // 2-3 sentences don't need more
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating professional summary:', error);
    return '';
  }
};

// Batch enhance all work experiences
export const enhanceAllWorkExperiences = async (
  workExperiences: Array<{
    jobTitle: string;
    responsibilities: string;
  }>,
  language: string = 'en'
): Promise<Array<{ enhanced: string }>> => {
  const results = await Promise.all(
    workExperiences.map((exp) =>
      enhanceJobDescription(exp.responsibilities, exp.jobTitle, language)
    )
  );
  return results;
};

// Conversational AI types
export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConversationCompletionResult {
  response: string;
  extractedData: Record<string, unknown> | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Conversational completion for resume building
export const getConversationCompletion = async (
  systemPrompt: string,
  messages: ConversationMessage[],
  _temperature: number = 0.7, // Ignored: gpt-4.1-mini only supports temperature=1
  maxTokens: number = 1000
): Promise<ConversationCompletionResult> => {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      // Note: gpt-4.1-mini only supports temperature=1 (default)
      max_completion_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content?.trim() || '';

    // Try to extract structured data from the response
    // The AI is prompted to include <extracted_data>...</extracted_data> tags
    let extractedData: Record<string, unknown> | null = null;
    const extractedMatch = content.match(/<extracted_data>([\s\S]*?)<\/extracted_data>/);

    if (extractedMatch) {
      try {
        extractedData = JSON.parse(extractedMatch[1].trim());
      } catch {
        // If JSON parsing fails, leave extractedData as null
        console.warn('Failed to parse extracted data from AI response');
      }
    }

    // Remove the extracted_data tags from the visible response
    const cleanResponse = content.replace(/<extracted_data>[\s\S]*?<\/extracted_data>/g, '').trim();

    return {
      response: cleanResponse,
      extractedData,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Error in conversation completion:', error);
    throw error;
  }
};

// Streaming conversation completion (for real-time responses)
export const getConversationCompletionStream = async (
  systemPrompt: string,
  messages: ConversationMessage[],
  onChunk: (chunk: string) => void,
  _temperature: number = 0.7, // Ignored: gpt-4.1-mini only supports temperature=1
  maxTokens: number = 1000
): Promise<{ fullResponse: string; extractedData: Record<string, unknown> | null }> => {
  try {
    const stream = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      // Note: gpt-4.1-mini only supports temperature=1 (default)
      max_completion_tokens: maxTokens,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;

      // Don't stream the extracted_data tags
      if (!fullResponse.includes('<extracted_data>')) {
        onChunk(content);
      }
    }

    // Parse extracted data after streaming completes
    let extractedData: Record<string, unknown> | null = null;
    const extractedMatch = fullResponse.match(/<extracted_data>([\s\S]*?)<\/extracted_data>/);

    if (extractedMatch) {
      try {
        extractedData = JSON.parse(extractedMatch[1].trim());
      } catch {
        console.warn('Failed to parse extracted data from streamed response');
      }
    }

    const cleanResponse = fullResponse.replace(/<extracted_data>[\s\S]*?<\/extracted_data>/g, '').trim();

    return {
      fullResponse: cleanResponse,
      extractedData,
    };
  } catch (error) {
    console.error('Error in streaming conversation completion:', error);
    throw error;
  }
};
