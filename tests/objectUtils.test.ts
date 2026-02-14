/**
 * Tests for setNestedValue utility
 * Extracted from conversationStore to be shared with usePreviewEditor
 */

import { describe, it, expect } from 'vitest';
import { setNestedValue } from '@/lib/objectUtils';

describe('setNestedValue', () => {
  it('should set a simple top-level key', () => {
    const obj = { name: 'old' };
    const result = setNestedValue(obj, 'name', 'new');
    expect(result.name).toBe('new');
  });

  it('should set a nested key', () => {
    const obj = { personalInfo: { fullName: 'old' } };
    const result = setNestedValue(obj, 'personalInfo.fullName', 'John Doe');
    expect((result.personalInfo as Record<string, unknown>).fullName).toBe('John Doe');
  });

  it('should create intermediate objects if they do not exist', () => {
    const obj = {} as Record<string, unknown>;
    const result = setNestedValue(obj, 'personalInfo.fullName', 'Jane');
    expect((result.personalInfo as Record<string, unknown>).fullName).toBe('Jane');
  });

  it('should handle array index notation in the path', () => {
    const obj = { workExperience: [{ jobTitle: 'old' }] };
    const result = setNestedValue(obj, 'workExperience[0].jobTitle', 'Engineer');
    const work = (result.workExperience as Record<string, unknown>[])[0];
    expect(work.jobTitle).toBe('Engineer');
  });

  it('should create array slots if they do not exist', () => {
    const obj = {} as Record<string, unknown>;
    const result = setNestedValue(obj, 'workExperience[0].jobTitle', 'Dev');
    const work = (result.workExperience as Record<string, unknown>[])[0];
    expect(work.jobTitle).toBe('Dev');
  });

  it('should handle array index as the last key', () => {
    const obj = { items: ['a', 'b', 'c'] };
    const result = setNestedValue(obj, 'items[1]', 'B');
    expect((result.items as string[])[1]).toBe('B');
  });

  it('should handle deeply nested paths', () => {
    const obj = { a: { b: { c: 'old' } } };
    const result = setNestedValue(obj, 'a.b.c', 'new');
    expect(((result.a as Record<string, unknown>).b as Record<string, unknown>).c).toBe('new');
  });

  it('should handle mixed array and object paths', () => {
    const obj = {
      skills: { languages: [{ language: 'English', proficiency: 'native' }] },
    };
    const result = setNestedValue(obj, 'skills.languages[0].proficiency', 'professional');
    const skills = result.skills as Record<string, unknown>;
    const languages = skills.languages as Record<string, unknown>[];
    expect(languages[0].proficiency).toBe('professional');
  });

  it('should not mutate the original object', () => {
    const obj = { name: 'original' };
    const result = setNestedValue(obj, 'name', 'changed');
    // The result is a shallow copy at the top level
    expect(result).not.toBe(obj);
    expect(result.name).toBe('changed');
  });

  it('should handle setting a value to an array', () => {
    const obj = { skills: { technicalSkills: ['old'] } };
    const result = setNestedValue(obj, 'skills.technicalSkills', ['React', 'TypeScript']);
    const skills = result.skills as Record<string, unknown>;
    expect(skills.technicalSkills).toEqual(['React', 'TypeScript']);
  });

  it('should handle setting a value to an object', () => {
    const obj = { personalInfo: { fullName: 'Test' } };
    const result = setNestedValue(obj, 'personalInfo', { fullName: 'New', email: 'a@b.com' });
    expect(result.personalInfo).toEqual({ fullName: 'New', email: 'a@b.com' });
  });
});
