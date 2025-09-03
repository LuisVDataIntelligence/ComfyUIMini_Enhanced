import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

export interface TagSuggestion {
    tag: string;
    isAlias: boolean;
    postCount: number;
    matchedAlias?: string;
}

class TagSearcher {
    private tagsFilePath: string;
    private isFileChecked = false;
    private fileExists = false;

    constructor() {
        // Since we're running from server directory, go up one level to project root
        const projectRoot = path.resolve(process.cwd(), '..');
        this.tagsFilePath = path.join(projectRoot, 'shared', 'config', 'tags.csv');
        console.log('Looking for tags file at:', this.tagsFilePath);
    }

    /**
     * Checks if the tags file exists
     */
    private checkFileExists(): boolean {
        if (!this.isFileChecked) {
            this.fileExists = fs.existsSync(this.tagsFilePath);
            this.isFileChecked = true;
        }
        return this.fileExists;
    }

    /**
     * Searches for tags matching the query string
     */
    public async searchTags(query: string, maxResults: number = 10): Promise<TagSuggestion[]> {
        if (!this.checkFileExists()) {
            console.warn('Tags file not found at:', this.tagsFilePath);
            return [];
        }

        if (!query || query.length < 2) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        // Also search for underscore version if spaces are provided, and vice versa
        const alternateSearchTerm = searchTerm.includes('_') 
            ? searchTerm.replace(/_/g, ' ')
            : searchTerm.replace(/ /g, '_');
        
        const results: TagSuggestion[] = [];
        const seenTags = new Set<string>();

        return new Promise((resolve, reject) => {
            const fileStream = createReadStream(this.tagsFilePath);
            const rl = createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            rl.on('line', (line) => {
                if (results.length >= maxResults) {
                    rl.close();
                    return;
                }

                const match = this.parseCsvLine(line);
                if (!match) return;

                const { mainTag, postCount, aliases } = match;

                // Check main tag against both search terms
                const mainTagLower = mainTag.toLowerCase();
                if ((mainTagLower.startsWith(searchTerm) || mainTagLower.startsWith(alternateSearchTerm)) && !seenTags.has(mainTag)) {
                    results.push({
                        tag: mainTag,
                        isAlias: false,
                        postCount
                    });
                    seenTags.add(mainTag);
                }

                // Check aliases against both search terms
                if (results.length < maxResults) {
                    for (const alias of aliases) {
                        const aliasLower = alias.toLowerCase();
                        let matchedAlias: string | undefined = undefined;
                        
                        if (aliasLower.startsWith(searchTerm)) {
                            matchedAlias = alias;
                        } else if (aliasLower.startsWith(alternateSearchTerm)) {
                            matchedAlias = alias;
                        }
                        
                        if (matchedAlias && !seenTags.has(mainTag)) {
                            results.push({
                                tag: mainTag, // Return main tag, not alias
                                isAlias: true,
                                postCount,
                                matchedAlias
                            });
                            seenTags.add(mainTag);
                            break; // Only add once per main tag
                        }
                    }
                }
            });

            rl.on('close', () => {
                // Sort by post count (descending) for better relevance
                results.sort((a, b) => b.postCount - a.postCount);
                resolve(results);
            });

            rl.on('error', (error) => {
                console.error('Error reading tags file:', error);
                reject(error);
            });

            // Set a timeout to prevent hanging
            setTimeout(() => {
                rl.close();
                resolve(results);
            }, 5000); // 5 second timeout
        });
    }

    /**
     * Parses a single CSV line and extracts tag information
     */
    private parseCsvLine(line: string): { mainTag: string; postCount: number; aliases: string[] } | null {
        if (!line.trim()) return null;

        try {
            // More flexible regex to handle different CSV formats
            // Handles: mainTag,aliasCount,postCount,"aliases" OR mainTag,aliasCount,postCount,
            const match = line.match(/^([^,]+),(\d+),(\d+),?(?:"([^"]*)")?/);
            if (!match) return null;

            const [, mainTag, , postCountStr, aliasesStr] = match;
            const aliases = aliasesStr ? aliasesStr.split(',').map(a => a.trim()).filter(a => a) : [];
            const postCount = parseInt(postCountStr);

            return {
                mainTag: mainTag.trim(),
                postCount,
                aliases
            };
        } catch {
            return null;
        }
    }
}

// Export singleton instance
export const tagSearcher = new TagSearcher(); 