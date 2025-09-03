import { AutocompleteComponent, AutocompleteItem } from '../common/autocompleteComponent.js';
import { tagAutocomplete } from './tagAutocomplete.js';

export class PromptAutocompleteManager {
    private components = new Map<HTMLTextAreaElement, AutocompleteComponent>();

    constructor() {
        this.setupEventListeners();
    }

    /**
     * Attaches autocomplete to a textarea if it's a prompt input
     */
    public attachToTextarea(textarea: HTMLTextAreaElement, title: string): void {
        if (this.isPromptInput(title)) {
            const component = new AutocompleteComponent(textarea);
            this.components.set(textarea, component);
        }
    }

    /**
     * Removes autocomplete from a textarea
     */
    public detachFromTextarea(textarea: HTMLTextAreaElement): void {
        const component = this.components.get(textarea);
        if (component) {
            component.destroy();
            this.components.delete(textarea);
        }
    }

    /**
     * Checks if an input should have autocomplete based on its title
     */
    private isPromptInput(title: string): boolean {
        const promptKeywords = ['prompt', 'negative prompt', 'positive prompt', 'text'];
        const lowerTitle = title.toLowerCase();
        return promptKeywords.some(keyword => lowerTitle.includes(keyword));
    }

    /**
     * Sets up global event listeners for autocomplete requests
     */
    private setupEventListeners(): void {
        document.addEventListener('autocomplete-request', ((event: CustomEvent) => {
            const { query, component } = event.detail;
            this.handleAutocompleteRequest(query, component);
        }) as EventListener);
    }

    /**
     * Handles autocomplete requests from components
     */
    private async handleAutocompleteRequest(query: string, component: AutocompleteComponent): Promise<void> {
        if (!tagAutocomplete.isReady()) {
            component.showSuggestions([]);
            return;
        }

        try {
            const suggestions = await tagAutocomplete.getSuggestions(query, 8);
            const autocompleteItems: AutocompleteItem[] = suggestions.map(suggestion => ({
                text: suggestion.tag,
                isSecondary: suggestion.isAlias,
                isAlias: suggestion.isAlias,
                originalSearch: suggestion.matchedAlias || (suggestion.isAlias ? query : undefined)
            }));

            component.showSuggestions(autocompleteItems);
        } catch (error) {
            console.error('Error handling autocomplete request:', error);
            component.showSuggestions([]);
        }
    }

    /**
     * Destroys all autocomplete components
     */
    public destroy(): void {
        for (const [, component] of this.components) {
            component.destroy();
        }
        this.components.clear();
    }
}

// Global instance
export const promptAutocompleteManager = new PromptAutocompleteManager(); 