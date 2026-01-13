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

// System prompts for different tasks
const RESUME_ENHANCEMENT_PROMPT = `You are a professional resume writer helping people create impressive resumes. Your task is to enhance job descriptions and responsibilities to sound more professional and impactful while remaining truthful to the original content.

Guidelines:
- Use strong action verbs (Managed, Developed, Implemented, Led, Created, Achieved)
- Quantify achievements where possible (add reasonable estimates if not provided)
- Keep the enhanced version concise but impactful
- Make it ATS-friendly (use standard terminology)
- Maintain the original meaning - don't invent new responsibilities
- Format as bullet points if the input describes multiple tasks
- Output in the same language as the input

Return only the enhanced text, no explanations.`;

const SKILL_SUGGESTION_PROMPT = `You are a career advisor helping people identify skills for their resume. Based on the job experience provided, suggest additional relevant skills they likely have but didn't mention.

Return a JSON array of suggested skills, max 5 suggestions. Only suggest skills that are reasonably implied by the experience described.`;

const TRANSLATION_PROMPT = `You are a professional translator. Translate the following resume content while maintaining professional tone and ATS-friendly formatting. Keep proper nouns, company names, and technical terms in their original form when appropriate.`;

export const enhanceJobDescription = async (
  description: string,
  jobTitle: string,
  language: string = 'en'
): Promise<EnhancementResult> => {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: RESUME_ENHANCEMENT_PROMPT },
        {
          role: 'user',
          content: `Job Title: ${jobTitle}\n\nOriginal Description:\n${description}\n\nLanguage: ${language}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
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
    const experienceSummary = workExperience
      .map((exp) => `${exp.jobTitle}: ${exp.responsibilities}`)
      .join('\n\n');

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SKILL_SUGGESTION_PROMPT },
        {
          role: 'user',
          content: `Work Experience:\n${experienceSummary}\n\nExisting Skills: ${existingSkills.join(', ')}\n\nSuggest additional skills:`,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content?.trim() || '[]';

    try {
      const suggestions = JSON.parse(content);
      return Array.isArray(suggestions) ? suggestions : [];
    } catch {
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
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: TRANSLATION_PROMPT },
        {
          role: 'user',
          content: `Translate to ${targetLanguage}:\n\n${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
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
    const experienceSummary = workExperience
      .slice(0, 3)
      .map((exp) => exp.jobTitle)
      .join(', ');

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional resume writer. Create a brief, impactful professional summary (2-3 sentences) for a resume. Use the same language as specified. Do not include the person's name in the summary.`,
        },
        {
          role: 'user',
          content: `Create a professional summary for someone with experience as: ${experienceSummary}\n\nKey skills: ${skills.slice(0, 5).join(', ')}\n\nLanguage: ${language}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
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
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<ConversationCompletionResult> => {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature,
      max_tokens: maxTokens,
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
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<{ fullResponse: string; extractedData: Record<string, unknown> | null }> => {
  try {
    const stream = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature,
      max_tokens: maxTokens,
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
