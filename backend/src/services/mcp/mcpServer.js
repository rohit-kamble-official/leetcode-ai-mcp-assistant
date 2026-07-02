/**
 * src/services/mcp/mcpServer.js
 *
 * WHY: The Model Context Protocol (MCP) lets AI assistants (Claude Desktop,
 *      Cursor, Continue.dev) call our tools programmatically.
 *      Instead of copy-pasting LeetCode URLs into chat, the AI can directly
 *      call search_problem or get_daily_problem.
 *
 * HOW: We register tools with the MCP SDK. Each tool has:
 *      - name: what the AI calls
 *      - description: what the AI reads to decide when to use it
 *      - inputSchema: JSON Schema for the tool's parameters
 *      - handler: the actual function
 *
 * DESIGN: The MCP server is completely separate from the REST API.
 *         It runs as a stdio transport (standard for MCP servers).
 *         AI tools communicate via stdin/stdout.
 *
 * Usage: node src/services/mcp/mcpServer.js
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { leetcodeService } from '../leetcode/leetcodeService.js';
import { aiService } from '../ai/aiService.js';
import logger from '../../config/logger.js';

// Create the MCP Server instance
const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || 'leetcode-ai-mcp',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// --- Tool Definitions ---
// These are what AI assistants see when they connect to this MCP server

const TOOLS = [
  {
    name: 'search_problems',
    description:
      'Search LeetCode problems by keyword, difficulty, or topic tags. Returns a list of matching problems with their metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword (e.g., "two sum", "binary tree", "dynamic programming")',
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard'],
          description: 'Filter by difficulty level',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Topic tags to filter by (e.g., ["array", "hash-table"])',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (default: 10, max: 50)',
          default: 10,
        },
      },
      required: [],
    },
  },
  {
    name: 'get_problem',
    description:
      'Get full details of a specific LeetCode problem by its title slug. Returns the problem description, examples, constraints, and code templates.',
    inputSchema: {
      type: 'object',
      properties: {
        titleSlug: {
          type: 'string',
          description:
            'The problem slug from LeetCode URL (e.g., "two-sum", "longest-substring-without-repeating-characters")',
        },
      },
      required: ['titleSlug'],
    },
  },
  {
    name: 'get_daily_problem',
    description:
      "Get today's LeetCode daily coding challenge problem with full details.",
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'explain_problem',
    description:
      'Get an AI-powered explanation of a LeetCode problem. Breaks down the problem statement, provides examples, and highlights edge cases.',
    inputSchema: {
      type: 'object',
      properties: {
        titleSlug: {
          type: 'string',
          description: 'The problem slug (e.g., "two-sum")',
        },
      },
      required: ['titleSlug'],
    },
  },
  {
    name: 'get_hints',
    description:
      'Get progressive hints for a LeetCode problem without revealing the full solution. Returns 3 hints of increasing specificity.',
    inputSchema: {
      type: 'object',
      properties: {
        titleSlug: {
          type: 'string',
          description: 'The problem slug',
        },
      },
      required: ['titleSlug'],
    },
  },
  {
    name: 'analyze_solution',
    description:
      'Analyze a code solution for a LeetCode problem. Provides correctness check, time/space complexity analysis, and improvement suggestions.',
    inputSchema: {
      type: 'object',
      properties: {
        titleSlug: {
          type: 'string',
          description: 'The problem slug',
        },
        code: {
          type: 'string',
          description: 'The code solution to analyze',
        },
        language: {
          type: 'string',
          description: 'Programming language (e.g., "python", "javascript", "java")',
          default: 'python',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'get_user_stats',
    description:
      "Get a LeetCode user's public statistics including solved problems count, acceptance rate, and ranking.",
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'LeetCode username',
        },
      },
      required: ['username'],
    },
  },
];

// --- Register Tool List Handler ---
// Called when an AI assistant asks "what tools do you have?"
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// --- Register Tool Call Handler ---
// Called when an AI assistant wants to actually use a tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info('MCP tool called', { tool: name, args });

  try {
    const result = await handleTool(name, args || {});
    return {
      content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    logger.error('MCP tool error', { tool: name, error: err.message });
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

/**
 * Route tool calls to the correct service method.
 * Extracted into its own function for testability.
 */
async function handleTool(name, args) {
  switch (name) {
    case 'search_problems': {
      const results = await leetcodeService.searchProblems({
        query: args.query,
        difficulty: args.difficulty,
        tags: args.tags || [],
        limit: Math.min(args.limit || 10, 50),
      });
      return results;
    }

    case 'get_problem': {
      const problem = await leetcodeService.getProblemBySlug(args.titleSlug);
      return problem;
    }

    case 'get_daily_problem': {
      const daily = await leetcodeService.getDailyChallenge();
      return daily;
    }

    case 'explain_problem': {
      const problem = await leetcodeService.getProblemBySlug(args.titleSlug);
      const explanation = await aiService.explainProblem(problem);
      return explanation;
    }

    case 'get_hints': {
      const problem = await leetcodeService.getProblemBySlug(args.titleSlug);
      const hints = await aiService.generateHints(problem);
      return hints;
    }

    case 'analyze_solution': {
      let problem = null;
      if (args.titleSlug) {
        problem = await leetcodeService.getProblemBySlug(args.titleSlug);
      }
      const analysis = await aiService.analyzeCode(problem, args.code, args.language || 'python');
      return analysis;
    }

    case 'get_user_stats': {
      const stats = await leetcodeService.getUserStats(args.username);
      return stats;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Start the MCP server with stdio transport.
 * stdio is the standard transport for MCP — AI tools pipe messages to us.
 */
export const startMcpServer = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('✅ MCP Server started on stdio transport');
};

export { handleTool };
