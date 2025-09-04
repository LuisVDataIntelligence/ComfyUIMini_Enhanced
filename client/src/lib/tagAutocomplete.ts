// Lightweight client wrapper to query the server tag search API
export class TagAutocomplete {
    base = '/api/tags';

    async checkServiceHealth(): Promise<boolean> {
        try {
            const res = await fetch(`${this.base}/health`);
            if (!res.ok) return false;
            const j = await res.json();
            return j.status === 'ok';
        } catch {
            return false;
        }
    }

    async getSuggestions(q: string, limit = 10, useUnderscores = true) {
        if (!q || q.trim().length < 2) return [];
        const params = new URLSearchParams({ q, limit: String(limit), underscores: String(useUnderscores) });
        try {
            const res = await fetch(`${this.base}/search?${params.toString()}`);
            if (!res.ok) return [];
            const j = await res.json();
            return j.results ?? [];
        } catch {
            return [];
        }
    }
}

export const tagAutocomplete = new TagAutocomplete();
