import type { FrameworkId } from '@/types';
import { jungPrompt } from './jung';
import { freudPrompt } from './freud';
import { gestaltPrompt } from './gestalt';
import { islamicPrompt } from './islamic';
import { indigenousPrompt } from './indigenous';
import { cognitivePrompt } from './cognitive';
import { existentialPrompt } from './existential';

const frameworkPrompts: Record<FrameworkId, string> = {
  jung: jungPrompt,
  freud: freudPrompt,
  gestalt: gestaltPrompt,
  islamic: islamicPrompt,
  indigenous: indigenousPrompt,
  cognitive: cognitivePrompt,
  existential: existentialPrompt,
};

export function buildSystemPrompt(
  framework: FrameworkId,
  personalSymbols?: Array<{ name: string; meaning: string }>,
  isFollowUp?: boolean
): string {
  let prompt = frameworkPrompts[framework];

  if (personalSymbols && personalSymbols.length > 0) {
    prompt += '\n\n## Personal Symbol Dictionary\n';
    prompt += 'The dreamer has defined these personal meanings for symbols. Prioritize these over general interpretations:\n\n';
    for (const symbol of personalSymbols) {
      prompt += `- **${symbol.name}**: ${symbol.meaning}\n`;
    }
  }

  if (isFollowUp) {
    // For follow-up conversations, use conversational instructions
    prompt += `\n\n## Follow-Up Conversation Mode
You are continuing a conversation about a dream interpretation. The user is asking a follow-up question.

Guidelines:
- Respond conversationally and directly to the question
- Be concise (1-3 paragraphs typically)
- Reference your previous interpretation naturally
- Provide deeper insights or clarification as needed
- Do NOT use section headers, bullet points, or structured formatting
- Do NOT include [SYMBOL] or [FOLLOW_UP] tags
- Do NOT restate the dream content or repeat the full interpretation`;
  } else {
    // For initial interpretations, use structured format
    prompt += `\n\n## Response Format Requirements

1. Structure your interpretation with clear sections
2. When identifying key symbols, wrap each in [SYMBOL]symbol name[/SYMBOL] tags
3. Be specific and reference actual dream content
4. Maintain the authentic voice of the ${framework} framework
5. Keep response between 400-800 words unless follow-up conversation

## CRITICAL: Follow-Up Questions Format
At the very end of your response, you MUST include exactly 2-3 follow-up questions using this EXACT tag format:

[FOLLOW_UP]What personal meaning does the airport hold for you?[/FOLLOW_UP]
[FOLLOW_UP]How did the fear of being late make you feel upon waking?[/FOLLOW_UP]

Do NOT create a "Suggested Follow-Up Questions" section with numbered lists. Only use the [FOLLOW_UP] tags as shown above.`;
  }

  return prompt;
}

export { frameworkPrompts };
