/**
 * src/services/ai/aiService.js
 *
 * WHY: Wraps the AI provider (Anthropic Claude) so we can swap it out
 *      without changing any controller or route code.
 * HOW: Each method crafts a system + user prompt, calls the API,
 *      and returns a clean string response.
 * DESIGN: Strategy pattern — if we add OpenAI or Gemini, we swap the
 *         provider object without touching the method signatures.
 *
 * All prompts are written to make the AI respond like a senior engineer
 * teaching a student — clear, educational, and actionable.
 */

import { GoogleGenAI } from "@google/genai";
import logger from '../../config/logger.js';
import { AppError } from '../../utils/AppError.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const MAX_TOKENS = 2048;

// System prompt that sets the AI's persona
const SYSTEM_PROMPT = `You are an expert software engineer and coding interview coach with 10+ years of experience at top tech companies. You specialize in data structures, algorithms, and helping developers understand and solve LeetCode problems.

When explaining problems or solutions:
- Be clear and educational
- Use examples with concrete values
- Explain the intuition before the implementation
- Mention time and space complexity
- Keep explanations concise but complete`;

export const aiService = {
  /**
   * Explain what a LeetCode problem is asking.
   * Breaks down the problem statement into plain English.
   */
  async explainProblem(problem) {
    return callAI(`
      Explain this LeetCode problem in simple terms:

      Title: ${problem.title}
      Difficulty: ${problem.difficulty}
      Description: ${stripHtml(problem.content || '')}

      Provide:
      1. A plain English explanation of what is being asked
      2. A concrete example walkthrough
      3. Key constraints to pay attention to
      4. Common edge cases to consider
    `);
  },

  /**
   * Generate progressive hints without giving away the full solution.
   * Returns 3 hints of increasing specificity.
   */
  async generateHints(problem) {
    return callAI(`
      Generate 3 progressive hints for this LeetCode problem:

      Title: ${problem.title}
      Difficulty: ${problem.difficulty}
      Description: ${stripHtml(problem.content || '')}

      Rules for hints:
      - Hint 1: High-level intuition only (don't mention specific data structures)
      - Hint 2: Suggest a data structure or approach
      - Hint 3: Near-complete walkthrough, but don't write actual code

      Format as:
      Hint 1: ...
      Hint 2: ...
      Hint 3: ...
    `);
  },

  /**
   * Explain an existing solution in detail.
   */
  async explainSolution(problem, solutionCode, language = 'python') {
    return callAI(`
      Explain this solution to the LeetCode problem "${problem.title}":

      Solution Code (${language}):
      \`\`\`${language}
      ${solutionCode}
      \`\`\`

      Provide:
      1. High-level approach/algorithm used
      2. Step-by-step walkthrough with an example
      3. Time complexity analysis with justification
      4. Space complexity analysis with justification
      5. Any potential improvements or alternative approaches
    `);
  },

  /**
   * Analyze user-submitted code for correctness, style, and performance.
   */
  async analyzeCode(problem, userCode, language = 'python') {
    return callAI(`
      Analyze this code submitted for the LeetCode problem "${problem?.title || 'Unknown'}":

      Code (${language}):
      \`\`\`${language}
      ${userCode}
      \`\`\`

      Provide analysis on:
      1. Correctness: Does it handle all cases?
      2. Time Complexity: What is the Big-O?
      3. Space Complexity: What is the memory usage?
      4. Code quality: Readability, variable names, comments
      5. Edge cases: What inputs might break this?
      6. Overall score (1-10) with brief justification
    `);
  },

  /**
   * Suggest optimizations for code that is functionally correct but slow.
   */
  async suggestOptimizations(problem, userCode, language = 'python') {
    return callAI(`
      This code solves "${problem?.title || 'the problem'}" but may not be optimal.
      Suggest specific optimizations:

      Code (${language}):
      \`\`\`${language}
      ${userCode}
      \`\`\`

      Provide:
      1. Current complexity analysis
      2. Specific bottlenecks identified
      3. Recommended optimization approach
      4. Optimized code example
      5. New complexity after optimization
    `);
  },

  /**
   * Estimate time complexity of arbitrary code.
   */
  async estimateTimeComplexity(code, language = 'python') {
    return callAI(`
      Analyze the time complexity of this code:

      \`\`\`${language}
      ${code}
      \`\`\`

      Provide:
      1. Overall time complexity in Big-O notation
      2. Per-operation breakdown explaining each loop/recursion
      3. Best case, average case, and worst case analysis
      4. Whether this is optimal for the problem type
    `);
  },

  /**
   * Estimate space complexity of arbitrary code.
   */
  async estimateSpaceComplexity(code, language = 'python') {
    return callAI(`
      Analyze the space complexity of this code:

      \`\`\`${language}
      ${code}
      \`\`\`

      Provide:
      1. Overall space complexity in Big-O notation
      2. What data structures are consuming space
      3. Auxiliary space vs input space distinction
      4. Whether the space usage can be reduced
    `);
  },
};

/**
 * Internal helper: makes a request to the Anthropic API.
 * All public methods route through this so error handling is centralized.
 *
 * @param {string} userPrompt
 * @returns {Promise<string>} AI response text
 */
async function callAI(userPrompt) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
    });

    return response.text;
  } catch (err) {
    logger.error("AI service call failed", {
      error: err.message,
    });

    throw new AppError(
      "AI service temporarily unavailable",
      503
    );
  }
}

/**
 * Strip HTML tags from LeetCode problem descriptions.
 * LeetCode returns HTML content — we need plain text for AI prompts.
 * Time Complexity: O(n) where n is string length.
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
