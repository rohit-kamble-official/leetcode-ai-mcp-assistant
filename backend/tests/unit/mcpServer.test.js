/**
 * tests/unit/mcpServer.test.js
 *
 * WHY: Tests that MCP tool routing maps each tool name to the correct service.
 * HOW: Mocks services and MCP SDK, calls handleTool() directly.
 */

import { jest } from '@jest/globals';

const mockLeetcode = {
  searchProblems: jest.fn().mockResolvedValue({ questions: [{ title: 'Two Sum' }], total: 1 }),
  getProblemBySlug: jest.fn().mockResolvedValue({ title: 'Two Sum', difficulty: 'Easy', content: '<p>Test</p>' }),
  getDailyChallenge: jest.fn().mockResolvedValue({ date: '2024-01-15', question: { title: 'Daily Problem' } }),
  getUserStats: jest.fn().mockResolvedValue({ username: 'testuser', submitStats: {} }),
};

const mockAi = {
  explainProblem: jest.fn().mockResolvedValue('Here is the explanation...'),
  generateHints: jest.fn().mockResolvedValue('Hint 1: ...\nHint 2: ...\nHint 3: ...'),
  analyzeCode: jest.fn().mockResolvedValue('Code analysis: Time O(n), Space O(1)'),
};

jest.unstable_mockModule('../../src/services/leetcode/leetcodeService.js', () => ({
  leetcodeService: mockLeetcode,
}));

jest.unstable_mockModule('../../src/services/ai/aiService.js', () => ({
  aiService: mockAi,
}));

// Stub MCP SDK — we only test handleTool(), not the MCP protocol itself
jest.unstable_mockModule('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
  })),
}));

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

jest.unstable_mockModule('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
}));

const { handleTool } = await import('../../src/services/mcp/mcpServer.js');

describe('MCP handleTool()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('search_problems — delegates to leetcodeService.searchProblems', async () => {
    const result = await handleTool('search_problems', { query: 'two sum', limit: 5 });
    expect(mockLeetcode.searchProblems).toHaveBeenCalledWith({
      query: 'two sum',
      difficulty: undefined,
      tags: [],
      limit: 5,
    });
    expect(result).toHaveProperty('questions');
  });

  it('get_problem — delegates to leetcodeService.getProblemBySlug', async () => {
    const result = await handleTool('get_problem', { titleSlug: 'two-sum' });
    expect(mockLeetcode.getProblemBySlug).toHaveBeenCalledWith('two-sum');
    expect(result.title).toBe('Two Sum');
  });

  it('get_daily_problem — returns daily challenge', async () => {
    const result = await handleTool('get_daily_problem', {});
    expect(mockLeetcode.getDailyChallenge).toHaveBeenCalled();
    expect(result).toHaveProperty('question');
  });

  it('explain_problem — fetches problem then calls aiService', async () => {
    const result = await handleTool('explain_problem', { titleSlug: 'two-sum' });
    expect(mockLeetcode.getProblemBySlug).toHaveBeenCalledWith('two-sum');
    expect(mockAi.explainProblem).toHaveBeenCalled();
    expect(typeof result).toBe('string');
  });

  it('get_hints — returns AI-generated hints', async () => {
    const result = await handleTool('get_hints', { titleSlug: 'two-sum' });
    expect(mockAi.generateHints).toHaveBeenCalled();
    expect(typeof result).toBe('string');
  });

  it('analyze_solution — calls aiService.analyzeCode', async () => {
    const result = await handleTool('analyze_solution', {
      titleSlug: 'two-sum',
      code: 'def solve(n): return n',
      language: 'python',
    });
    expect(mockAi.analyzeCode).toHaveBeenCalled();
    expect(typeof result).toBe('string');
  });

  it('get_user_stats — delegates to leetcodeService.getUserStats', async () => {
    const result = await handleTool('get_user_stats', { username: 'testuser' });
    expect(mockLeetcode.getUserStats).toHaveBeenCalledWith('testuser');
    expect(result.username).toBe('testuser');
  });

  it('throws for unknown tool name', async () => {
    await expect(handleTool('nonexistent_tool', {})).rejects.toThrow('Unknown tool: nonexistent_tool');
  });
});
