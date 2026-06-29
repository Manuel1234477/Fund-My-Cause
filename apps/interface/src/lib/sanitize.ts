/** Strip HTML tags (including script/style contents), normalize whitespace, and enforce max length. */
export function sanitizeText(input: string, maxLength?: number): string {
  let result = input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
  result = result.replace(/\s+/g, " ");
  if (maxLength !== undefined) result = result.slice(0, maxLength);
  return result;
}

export function sanitizeComment(content: string): string {
  return sanitizeText(content, 1000);
}

export function sanitizeUpdateTitle(title: string): string {
  return sanitizeText(title.replace(/[\r\n]+/g, " "), 200);
}

export function sanitizeUpdateBody(body: string): string {
  return sanitizeText(body, 5000);
}
