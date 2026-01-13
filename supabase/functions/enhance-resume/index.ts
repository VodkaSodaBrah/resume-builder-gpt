// Supabase Edge Function for Resume AI Enhancement
// Deploy with: supabase functions deploy enhance-resume

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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

interface EnhanceRequest {
  type: 'job_description' | 'all_experiences' | 'suggest_skills' | 'professional_summary';
  data: {
    description?: string;
    jobTitle?: string;
    workExperiences?: Array<{ jobTitle: string; responsibilities: string }>;
    existingSkills?: string[];
    personalInfo?: { fullName: string };
    workExperience?: Array<{ jobTitle: string; responsibilities: string }>;
    skills?: string[];
  };
  language?: string;
}

async function enhanceJobDescription(
  description: string,
  jobTitle: string,
  language: string = 'en'
): Promise<{ enhanced: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    }),
  });

  const data = await response.json();
  const enhanced = data.choices?.[0]?.message?.content?.trim() || description;

  return { enhanced };
}

async function enhanceAllWorkExperiences(
  workExperiences: Array<{ jobTitle: string; responsibilities: string }>,
  language: string = 'en'
): Promise<Array<{ enhanced: string }>> {
  const results = await Promise.all(
    workExperiences.map((exp) =>
      enhanceJobDescription(exp.responsibilities, exp.jobTitle, language)
    )
  );
  return results;
}

async function suggestSkills(
  workExperience: Array<{ jobTitle: string; responsibilities: string }>,
  existingSkills: string[]
): Promise<string[]> {
  const experienceSummary = workExperience
    .map((exp) => `${exp.jobTitle}: ${exp.responsibilities}`)
    .join('\n\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a career advisor helping people identify skills for their resume. Based on the job experience provided, suggest additional relevant skills they likely have but didn't mention. Return a JSON array of suggested skills, max 5 suggestions.`,
        },
        {
          role: 'user',
          content: `Work Experience:\n${experienceSummary}\n\nExisting Skills: ${existingSkills.join(', ')}\n\nSuggest additional skills:`,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '[]';

  try {
    const suggestions = JSON.parse(content);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch {
    return [];
  }
}

async function generateProfessionalSummary(
  personalInfo: { fullName: string },
  workExperience: Array<{ jobTitle: string; responsibilities: string }>,
  skills: string[],
  language: string = 'en'
): Promise<string> {
  const experienceSummary = workExperience
    .slice(0, 3)
    .map((exp) => exp.jobTitle)
    .join(', ');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: EnhanceRequest = await req.json();
    const { type, data, language = 'en' } = body;

    let result: unknown;

    switch (type) {
      case 'job_description': {
        const { description, jobTitle } = data;
        if (!description || !jobTitle) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing description or jobTitle' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await enhanceJobDescription(description, jobTitle, language);
        break;
      }

      case 'all_experiences': {
        const { workExperiences } = data;
        if (!workExperiences || !Array.isArray(workExperiences)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing workExperiences array' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await enhanceAllWorkExperiences(workExperiences, language);
        break;
      }

      case 'suggest_skills': {
        const { workExperience, existingSkills } = data;
        if (!workExperience) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing workExperience' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await suggestSkills(workExperience, existingSkills || []);
        break;
      }

      case 'professional_summary': {
        const { personalInfo, workExperience, skills } = data;
        if (!personalInfo || !workExperience) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing personalInfo or workExperience' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await generateProfessionalSummary(
          personalInfo,
          workExperience,
          skills || [],
          language
        );
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid enhancement type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Enhancement error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred during enhancement' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
