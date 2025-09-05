import { Hono } from 'hono';
import { z } from 'zod';
import { tagSearcher } from '../utils/tagSearchUtils';

const router = new Hono();

/**
 * Search for tags based on query string
 * GET /api/tags/search?q=query&limit=10
 */
router.get('/search', async (c) => {
    try {
        const querySchema = z.object({
            q: z.string().min(1),
            limit: z
                .string()
                .transform((val) => parseInt(val, 10))
                .pipe(z.number().int().min(1).max(20))
                .optional(),
            underscores: z.string().optional(),
        });

        const parsed = querySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
        if (!parsed.success) {
            return c.json({ error: parsed.error.message }, 400);
        }

        const { q, limit = 10, underscores } = parsed.data;

        if (q.length < 2) {
            return c.json({ results: [], query: q, count: 0 });
        }

        const useUnderscores = underscores !== 'false'; // Default to true
        const results = await tagSearcher.searchTags(q, limit);
        
        // Apply underscore setting to results
        const processedResults = results.map(result => ({
            ...result,
            tag: useUnderscores ? result.tag : result.tag.replace(/_/g, ' '),
            matchedAlias: result.matchedAlias ? (useUnderscores ? result.matchedAlias : result.matchedAlias.replace(/_/g, ' ')) : undefined
        }));
        
        return c.json({ results: processedResults, query: q, count: processedResults.length });

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
