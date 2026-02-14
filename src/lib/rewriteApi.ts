/**
 * Client-side API helper for the AI rewrite endpoint.
 * Sends a single field value to be improved by AI.
 */
export async function rewriteField(
  fieldType: string,
  currentValue: string,
  context?: { jobTitle?: string; section?: string },
  language: string = 'en'
): Promise<string | null> {
  try {
    const response = await fetch('/api/resume/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldType,
        currentValue,
        context,
        language,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.success ? data.rewritten : null;
  } catch {
    return null;
  }
}
