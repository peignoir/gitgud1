import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * Web Research Tool
 * Performs web research on markets, trends, competitors, and best practices
 */
export const webResearchTool = createTool({
  id: 'web-research',
  description: 'Search the web for founder profiles, market trends, competitor analysis, and industry insights. Use quotes for exact name matches to avoid homonyms. Search for interviews to reveal personality.',
  inputSchema: z.object({
    query: z.string().describe('Search query - use quotes for exact matches (e.g., "John Smith" founder to avoid homonyms)'),
    domains: z.array(z.string()).optional().describe('Specific domains to research'),
    focus: z.enum(['market', 'competition', 'trends', 'best-practices', 'investors']).optional(),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      source: z.string(),
      summary: z.string(),
      relevance: z.number(),
    })),
    insights: z.array(z.string()),
  }),
  execute: async (params: any) => {
    // Extract from Mastra's newer format: params.context contains the actual tool arguments
    const context = params.context;
    const query = context?.query || params.data?.query || params.query;
    const domains = context?.domains || params.data?.domains || params.domains;
    const focus = context?.focus || params.data?.focus || params.focus;
    
    console.log('🔍 [Web Research Tool] Query:', query);
    console.log('🔍 [Web Research Tool] Focus:', focus);

    if (!query) {
      console.error('❌ [Web Research Tool] No query provided!');
      return {
        results: [{
          title: 'Error: No query',
          source: 'Web Research Tool',
          summary: 'No search query was provided to the tool.',
          relevance: 0,
        }],
        insights: ['Tool invocation error: missing query parameter'],
      };
    }

    // Try to use real web search if API key available
    const tavilyKey = process.env.TAVILY_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;

    console.log('🔑 [Web Research Tool] Tavily Key exists:', !!tavilyKey);

    let searchResults: any[] = [];

    try {
      // Try Tavily AI search (good for research)
      if (tavilyKey) {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: 'advanced',
            max_results: 5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          searchResults = data.results || [];
          context.logger?.info('Tavily search successful', { resultCount: searchResults.length });
        }
      }
      // Try Serper Google Search API
      else if (serperKey) {
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': serperKey,
          },
          body: JSON.stringify({ q: query, num: 5 }),
        });

        if (response.ok) {
          const data = await response.json();
          searchResults = data.organic || [];
          context.logger?.info('Serper search successful', { resultCount: searchResults.length });
        }
      }
    } catch (error) {
      context.logger?.warn('Web search API failed, using fallback', { error });
    }

    // If we got real results, format them
    if (searchResults.length > 0) {
      const formattedResults = searchResults.slice(0, 5).map((result: any) => ({
        title: result.title || result.name || 'Result',
        source: result.url || result.link || 'Web',
        summary: result.content || result.snippet || result.description || '',
        relevance: result.score || 0.8,
      }));

      return {
        results: formattedResults,
        insights: [
          `Found ${formattedResults.length} relevant results for: ${query}`,
          `Research focus: ${focus || 'general'}`,
          'See summaries for key insights',
        ],
      };
    }

    // Fallback (shouldn't reach here with valid API key)
    console.log('⚠️ [Web Research Tool] Using fallback - no search API available');
    
    return {
      results: [
        {
          title: `Research: ${query}`,
          source: 'Web Search (Simulated)',
          summary: `To enable real web search, add TAVILY_API_KEY or SERPER_API_KEY to your environment. Query: "${query}"`,
          relevance: 0.7,
        },
      ],
      insights: [
        'Configure web search API for real-time results',
        'Tavily API: https://tavily.com (best for AI research)',
        'Serper API: https://serper.dev (Google search API)',
      ],
    };
  },
});
