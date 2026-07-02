/**
 * src/controllers/aiController.js
 *
 * WHY: Handles all AI-powered analysis endpoints.
 * HOW: Fetches problem data from LeetCode service, then passes it to the AI service.
 *      The AI service does the heavy lifting (prompt engineering + API calls).
 */

import { leetcodeService } from '../services/leetcode/leetcodeService.js';
import { aiService } from '../services/ai/aiService.js';
import { sendSuccess } from '../utils/response.js';

export const aiController = {
  /**
   * POST /ai/problems/:titleSlug/explain
   * Get an AI explanation of a LeetCode problem.
   */
  async explainProblem(req, res, next) {
    try {
      const { titleSlug } = req.params;
      const problem = await leetcodeService.getProblemBySlug(titleSlug);
      const explanation = await aiService.explainProblem(problem);

      return sendSuccess(res, { explanation, problem: { title: problem.title, difficulty: problem.difficulty } }, 'Problem explanation generated');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ai/problems/:titleSlug/hints
   * Get progressive hints for a problem.
   */
  async getHints(req, res, next) {
    try {
      const { titleSlug } = req.params;
      const problem = await leetcodeService.getProblemBySlug(titleSlug);
      const hints = await aiService.generateHints(problem);

      return sendSuccess(res, { hints, problem: { title: problem.title } }, 'Hints generated');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ai/problems/:titleSlug/explain-solution
   * Explain a user-provided solution to a problem.
   */
  async explainSolution(req, res, next) {
    try {
      const { titleSlug } = req.params;
      const { code, language = 'python' } = req.body;

      const problem = await leetcodeService.getProblemBySlug(titleSlug);
      const explanation = await aiService.explainSolution(problem, code, language);

      return sendSuccess(res, { explanation }, 'Solution explanation generated');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ai/analyze-code
   * Analyze arbitrary code (not tied to a specific problem).
   */
  async analyzeCode(req, res, next) {
    try {
      const { code, language = 'python', titleSlug } = req.body;

      let problem = null;
      if (titleSlug) {
        problem = await leetcodeService.getProblemBySlug(titleSlug).catch(() => null);
      }

      const analysis = await aiService.analyzeCode(problem, code, language);
      return sendSuccess(res, { analysis }, 'Code analysis complete');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ai/optimize-code
   * Get optimization suggestions for code.
   */
  async optimizeCode(req, res, next) {
    try {
      const { code, language = 'python', titleSlug } = req.body;

      let problem = null;
      if (titleSlug) {
        problem = await leetcodeService.getProblemBySlug(titleSlug).catch(() => null);
      }

      const suggestions = await aiService.suggestOptimizations(problem, code, language);
      return sendSuccess(res, { suggestions }, 'Optimization suggestions generated');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ai/time-complexity
   * Estimate the time complexity of code.
   */
  async timeComplexity(req, res, next) {
    try {
      const { code, language = 'python' } = req.body;
      const result = await aiService.estimateTimeComplexity(code, language);
      return sendSuccess(res, { analysis: result }, 'Time complexity analysis complete');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ai/space-complexity
   * Estimate the space complexity of code.
   */
  async spaceComplexity(req, res, next) {
    try {
      const { code, language = 'python' } = req.body;
      const result = await aiService.estimateSpaceComplexity(code, language);
      return sendSuccess(res, { analysis: result }, 'Space complexity analysis complete');
    } catch (err) {
      next(err);
    }
  },
};
