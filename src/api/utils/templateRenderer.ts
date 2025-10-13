import { readFileSync } from "fs";
import { join } from "path";

const TEMPLATES_DIR = join(__dirname, "../templates");

const templateCache = new Map<string, string>();

/**
 * Load and cache HTML template
 */
function loadTemplate(templateName: string): string {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = join(TEMPLATES_DIR, `${templateName}.html`);
  const template = readFileSync(templatePath, "utf-8");
  templateCache.set(templateName, template);
  return template;
}

/**
 * Render template with variables
 * Example: renderTemplate('email-confirmed', { EMAIL: 'user@example.com' })
 */
export function renderTemplate(
  templateName: string,
  variables: Record<string, string> = {}
): string {
  let html = loadTemplate(templateName);

  // Replace all {{VARIABLE}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    html = html.replace(placeholder, value);
  }

  return html;
}
