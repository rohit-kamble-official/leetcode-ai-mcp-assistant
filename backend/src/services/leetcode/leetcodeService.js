/**
 * src/services/leetcode/leetcodeService.js
 *
 * WHY: LeetCode doesn't have an official public REST API.
 *      They expose a GraphQL endpoint which we query directly.
 * HOW: graphql-request is a lightweight GraphQL client.
 *      All queries are defined as constants at the top for readability.
 * DESIGN: Each method corresponds to one LeetCode feature.
 *         Results are cached in Redis to avoid hammering LeetCode's servers.
 *
 * Time Complexity: GraphQL queries are O(1) network calls, O(n) parsing
 *                 where n is the response size.
 */

import { GraphQLClient, gql } from 'graphql-request';
import redis from '../../config/redis.js';
import logger from '../../config/logger.js';
import { AppError } from '../../utils/AppError.js';

const client = new GraphQLClient(
  process.env.LEETCODE_GRAPHQL_URL || 'https://leetcode.com/graphql',
  {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0', // LeetCode blocks bots without UA
      Referer: 'https://leetcode.com',
    },
  }
);

// Cache TTL constants (seconds)
const TTL_PROBLEM = parseInt(process.env.REDIS_TTL_PROBLEM) || 3600;   // 1 hour
const TTL_DAILY   = parseInt(process.env.REDIS_TTL_DAILY) || 86400;     // 24 hours
const TTL_STATS   = parseInt(process.env.REDIS_TTL_STATS) || 1800;      // 30 min

// --- GraphQL Query Definitions ---

const PROBLEM_LIST_QUERY = gql`
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        acRate
        difficulty
        freqBar
        frontendQuestionId: questionFrontendId
        isFavor
        isPaidOnly
        status
        title
        titleSlug
        topicTags {
          name
          id
          slug
        }
      }
    }
  }
`;

const PROBLEM_DETAIL_QUERY = gql`
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      content
      difficulty
      likes
      dislikes
      isLiked
      similarQuestions
      exampleTestcases
      topicTags {
        name
        slug
      }
      codeSnippets {
        lang
        langSlug
        code
      }
      stats
      hints
      solution {
        id
        canSeeDetail
        paidOnly
        hasVideoSolution
        paidOnlyVideo
      }
      companyTagStats
      acRate
    }
  }
`;

const DAILY_CHALLENGE_QUERY = gql`
  query questionOfToday {
    activeDailyCodingChallengeQuestion {
      date
      userStatus
      link
      question {
        acRate
        difficulty
        freqBar
        frontendQuestionId: questionFrontendId
        isFavor
        isPaidOnly
        status
        title
        titleSlug
        hasVideoSolution
        hasSolution
        topicTags {
          name
          id
          slug
        }
      }
    }
  }
`;

const USER_PROFILE_QUERY = gql`
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      contestBadge {
        name
        expired
        hoverText
        icon
      }
      username
      githubUrl
      twitterUrl
      linkedinUrl
      profile {
        ranking
        userAvatar
        realName
        aboutMe
        school
        websites
        countryName
        company
        jobTitle
        skillTags
        postViewCount
        reputation
        solutionCount
      }
      submissionCalendar
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

const CONTEST_QUERY = gql`
  query {
    topTwoContests {
      title
      titleSlug
      startTime
      duration
      originStartTime
      isVirtual
      company {
        watermark
      }
    }
  }
`;

// --- Service Methods ---

export const leetcodeService = {
  /**
   * Search/list problems with optional filters.
   * Supports filtering by difficulty, tags, company.
   *
   * @param {Object} params - { query, difficulty, tags, skip, limit }
   */
  async searchProblems({ query = '', difficulty, tags = [], skip = 0, limit = 20 } = {}) {
    const cacheKey = `problems:search:${query}:${difficulty}:${tags.join(',')}:${skip}:${limit}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return cached;

    const filters = {};
    if (query) filters.searchKeywords = query;
    if (difficulty) filters.difficulty = difficulty.toUpperCase();
    if (tags.length) filters.tags = tags;

    try {
      const data = await client.request(PROBLEM_LIST_QUERY, {
        categorySlug: '',
        limit,
        skip,
        filters,
      });

      const result = data.problemsetQuestionList;
      await setCache(cacheKey, result, TTL_PROBLEM);
      return result;
    } catch (err) {
      logger.error('LeetCode searchProblems failed', { error: err.message });
      throw new AppError('Failed to fetch problems from LeetCode', 502);
    }
  },

  /**
   * Get full problem details by its URL slug.
   * Example: "two-sum" for the Two Sum problem.
   */
  async getProblemBySlug(titleSlug) {
    const cacheKey = `problem:${titleSlug}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const data = await client.request(PROBLEM_DETAIL_QUERY, { titleSlug });
      if (!data.question) {
        throw new AppError(`Problem "${titleSlug}" not found`, 404);
      }

      await setCache(cacheKey, data.question, TTL_PROBLEM);
      return data.question;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('LeetCode getProblemBySlug failed', { titleSlug, error: err.message });
      throw new AppError('Failed to fetch problem from LeetCode', 502);
    }
  },

  /**
   * Get today's daily coding challenge.
   */
  async getDailyChallenge() {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `daily:${today}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const data = await client.request(DAILY_CHALLENGE_QUERY);
      const challenge = data.activeDailyCodingChallengeQuestion;

      await setCache(cacheKey, challenge, TTL_DAILY);
      return challenge;
    } catch (err) {
      logger.error('LeetCode getDailyChallenge failed', { error: err.message });
      throw new AppError('Failed to fetch daily challenge from LeetCode', 502);
    }
  },

  /**
   * Get a public user's LeetCode stats.
   * Note: Only works for public profiles.
   */
  async getUserStats(username) {
    const cacheKey = `user:stats:${username}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const data = await client.request(USER_PROFILE_QUERY, { username });
      if (!data.matchedUser) {
        throw new AppError(`LeetCode user "${username}" not found`, 404);
      }

      await setCache(cacheKey, data.matchedUser, TTL_STATS);
      return data.matchedUser;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('LeetCode getUserStats failed', { username, error: err.message });
      throw new AppError('Failed to fetch user stats from LeetCode', 502);
    }
  },

  /**
   * Get upcoming contests.
   */
  async getContests() {
    const cacheKey = 'contests:upcoming';

    const cached = await getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const data = await client.request(CONTEST_QUERY);
      await setCache(cacheKey, data.topTwoContests, 1800);
      return data.topTwoContests;
    } catch (err) {
      logger.error('LeetCode getContests failed', { error: err.message });
      throw new AppError('Failed to fetch contests from LeetCode', 502);
    }
  },
};

// --- Redis Cache Helpers ---

async function getFromCache(key) {
  try {
    const val = await redis.get(key);
    if (val) {
      logger.debug('Cache hit', { key });
      return JSON.parse(val);
    }
  } catch (err) {
    // Cache failure is not fatal — just fetch fresh data
    logger.warn('Redis get failed', { key, error: err.message });
  }
  return null;
}

async function setCache(key, value, ttl) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn('Redis set failed', { key, error: err.message });
  }
}
