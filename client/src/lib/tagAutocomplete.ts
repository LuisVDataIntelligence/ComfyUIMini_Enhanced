import { useConfigStore } from '../stores/config';
export interface TagSuggestion {
    tag: string;
    isAlias: boolean;
    matchedAlias?: string;
}

export class TagAutocomplete {
    private isServiceAvailable = true;

    constructor() {
        this.checkServiceHealth();
    }

    /**
     * Checks if the tag search service is available
     */
    private async checkServiceHealth(): Promise<void> {
        try {
            const response = await fetch('/api/tags/health');
            const data = await response.json();
            this.isServiceAvailable = data.status === 'ok';
        } catch (error) {
            console.warn('Tag search service not available:', error);
            this.isServiceAvailable = false;
        }
    }

    /**
     * Gets tag suggestions based on partial input using server-side search
     */
    public async getSuggestions(input: string, maxResults: number = 10): Promise<TagSuggestion[]> {
        if (!this.isServiceAvailable || !input.trim() || input.length < 2) {
            return [];
        }
        
        try {
            // Get underscore setting from config store
            const config = useConfigStore();
            const useUnderscores = config.autocomplete.tagAutocomplete.useUnderscores;
            
            const response = await fetch(`/api/tags/search?q=${encodeURIComponent(input)}&limit=${maxResults}&underscores=${useUnderscores}`);
            
            if (!response.ok) {
                console.error('Tag search failed:', response.statusText);
                return [];
            }
            
            const data = await response.json();
            return data.results.map((result: {tag: string, isAlias: boolean, matchedAlias?: string}) => ({
                tag: result.tag,
                isAlias: result.isAlias,
                matchedAlias: result.matchedAlias
            }));
            
        } catch (error) {
            console.error('Error fetching tag suggestions:', error);
            return [];
        }
    }

    /**
     * Checks if the service is ready
     */
    public isReady(): boolean {
        return this.isServiceAvailable;
    }
}

// Global instance
export const tagAutocomplete = new TagAutocomplete();
