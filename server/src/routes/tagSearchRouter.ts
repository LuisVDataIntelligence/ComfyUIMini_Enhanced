import express from 'express';
import { tagSearcher } from '../utils/tagSearchUtils';

const router = express.Router();

/**
 * Search for tags based on query string
 * GET /api/tags/search?q=query&limit=10
 */
router.get('/search', async (req, res): Promise<void> => {
    try {
        const query = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!query) {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return;
        }

        if (query.length < 2) {
            res.json({ results: [] });
            return;
        }

        const useUnderscores = req.query.underscores !== 'false'; // Default to true
        const results = await tagSearcher.searchTags(query, Math.min(limit, 20)); // Cap at 20 results
        
        // Apply underscore setting to results
        const processedResults = results.map(result => ({
            ...result,
            tag: useUnderscores ? result.tag : result.tag.replace(/_/g, ' '),
            matchedAlias: result.matchedAlias ? (useUnderscores ? result.matchedAlias : result.matchedAlias.replace(/_/g, ' ')) : undefined
        }));
        
        res.json({ 
            results: processedResults,
            query,
            count: processedResults.length
        });

    } catch (error) {
        console.error('Tag search error:', error);
        res.status(500).json({ error: 'Internal server error during tag search' });
    }
});

/**
 * Health check endpoint to verify tags file availability
 */
router.get('/health', async (req, res): Promise<void> => {
    try {
        // Try a simple search to verify the file is accessible
        const testResults = await tagSearcher.searchTags('test', 1);
        res.json({ 
            status: 'ok', 
            message: 'Tag search service is operational',
            hasResults: testResults.length > 0
        });
    } catch {
        res.status(503).json({ 
            status: 'error', 
            message: 'Tag search service is unavailable'
        });
    }
});

export default router; 