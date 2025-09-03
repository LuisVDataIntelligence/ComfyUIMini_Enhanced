import { Hono } from 'hono';
import { tagSearcher } from '../utils/tagSearchUtils';

const router = new Hono();

/**
 * Search for tags based on query string
 * GET /api/tags/search?q=query&limit=10
 */
router.get('/search', async (c) => {
    try {
        const query = c.req.query('q');
        const limit = parseInt(c.req.query('limit') || '10');

        if (!query) {
            return c.json({ error: 'Query parameter "q" is required' }, 400);
        }

        if (query.length < 2) {
            return c.json({ results: [] });
        }

        const useUnderscores = c.req.query('underscores') !== 'false'; // Default to true
        const results = await tagSearcher.searchTags(query, Math.min(limit, 20)); // Cap at 20 results
        
        // Apply underscore setting to results
        const processedResults = results.map(result => ({
            ...result,
            tag: useUnderscores ? result.tag : result.tag.replace(/_/g, ' '),
            matchedAlias: result.matchedAlias ? (useUnderscores ? result.matchedAlias : result.matchedAlias.replace(/_/g, ' ')) : undefined
        }));
        
        return c.json({ 
            results: processedResults,
            query,
            count: processedResults.length
        });

    } catch (error) {
        console.error('Tag search error:', error);
        return c.json({ error: 'Internal server error during tag search' }, 500);
    }
});

/**
 * Health check endpoint to verify tags file availability
 */
router.get('/health', async (c) => {
    try {
        // Try a simple search to verify the file is accessible
        const testResults = await tagSearcher.searchTags('test', 1);
        return c.json({ 
            status: 'ok', 
            message: 'Tag search service is operational',
            hasResults: testResults.length > 0
        });
    } catch {
        return c.json({ 
            status: 'error', 
            message: 'Tag search service is unavailable'
        }, 503);
    }
});

export default router; 