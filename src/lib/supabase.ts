import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Resume data types for Supabase
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  zipCode?: string;
  city?: string;
  country?: string;
}

export interface WorkExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  isCurrentJob: boolean;
  location: string;
  responsibilities: string;
  enhancedResponsibilities?: string;
}

export interface Education {
  id: string;
  schoolName: string;
  degree: string;
  fieldOfStudy?: string;
  startYear: string;
  endYear?: string;
  isCurrentlyStudying: boolean;
}

export interface Volunteering {
  id: string;
  organizationName: string;
  role: string;
  startDate: string;
  endDate?: string;
  responsibilities: string;
}

export interface Skills {
  certifications: string[];
  technicalSkills: string[];
  softSkills: string[];
  languages: Array<{
    language: string;
    proficiency: 'basic' | 'conversational' | 'professional' | 'native';
  }>;
}

export interface Reference {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  relationship: string;
}

export type TemplateStyle = 'classic' | 'modern' | 'professional';

export interface ResumeData {
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  volunteering: Volunteering[];
  skills: Skills;
  references: Reference[];
  templateStyle: TemplateStyle;
  language: string;
  hasWorkExperience?: boolean;
  hasVolunteering?: boolean;
  hasReferences?: boolean;
  referencesUponRequest?: boolean;
}

// Supabase table type
export interface Resume {
  id: string;
  clerk_user_id: string;
  name: string;
  resume_data: ResumeData;
  created_at: string;
  updated_at: string;
}

// Resume CRUD operations
export async function getResumes(clerkUserId: string): Promise<Resume[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }

  return data || [];
}

export async function getResume(id: string, clerkUserId: string): Promise<Resume | null> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching resume:', error);
    throw error;
  }

  return data;
}

export async function createResume(
  clerkUserId: string,
  name: string,
  resumeData: ResumeData
): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      clerk_user_id: clerkUserId,
      name,
      resume_data: resumeData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating resume:', error);
    throw error;
  }

  return data;
}

export async function updateResume(
  id: string,
  clerkUserId: string,
  updates: { name?: string; resume_data?: ResumeData }
): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('clerk_user_id', clerkUserId)
    .select()
    .single();

  if (error) {
    console.error('Error updating resume:', error);
    throw error;
  }

  return data;
}

export async function deleteResume(id: string, clerkUserId: string): Promise<void> {
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
}
