import type { AIAction } from '../store/types';

const VALID_ACTIONS = new Set(['create_block', 'add_features', 'modify_sequence', 'rename_block', 'select_region']);

/**
 * Parse ~~~action ... ~~~ blocks from AI response text.
 * Handles various formatting: newlines after opening fence, whitespace around JSON,
 * and closing fence on same or different line.
 * Returns an array of validated actions. Malformed blocks are silently skipped.
 */
export function parseActions(text: string): AIAction[] {
  const actions: AIAction[] = [];
  // Match opening ~~~action with optional whitespace/newlines, then capture content up to closing ~~~
  const regex = /~~~action\s*([\s\S]*?)~~~/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    try {
      const json = match[1].trim();
      if (!json) continue;

      const parsed = JSON.parse(json);

      if (!parsed.action || typeof parsed.action !== 'string') continue;
      if (!VALID_ACTIONS.has(parsed.action)) continue;

      actions.push(parsed as AIAction);
    } catch {
      // Skip malformed JSON
    }
  }

  return actions;
}

/**
 * Strip action blocks from response text for cleaner display.
 */
export function stripActionBlocks(text: string): string {
  return text.replace(/~~~action\s*[\s\S]*?~~~/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
