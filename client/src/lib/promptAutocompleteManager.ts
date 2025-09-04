import { AutocompleteComponent } from '../common/autocompleteComponent';
import type { AutocompleteItem } from '../common/autocompleteComponent';
import { tagAutocomplete } from './tagAutocomplete';

export class PromptAutocompleteManager {
    private components = new Map<HTMLTextAreaElement, AutocompleteComponent>();

    attachToTextarea(textarea: HTMLTextAreaElement) {
        if (this.components.has(textarea)) return;

        const component = new AutocompleteComponent(textarea);
        this.components.set(textarea, component);
    }

    detachFromTextarea(textarea: HTMLTextAreaElement) {
        const component = this.components.get(textarea);
        if (component) {
            component.destroy();
            this.components.delete(textarea);
        }
    }

    constructor() {
        // Global listener for request events emitted by components
        document.addEventListener('autocomplete-request', async (ev: Event) => {
            const e = ev as CustomEvent<{ query: string; component: AutocompleteComponent }>;
            const { query, component } = e.detail;

            try {
                const suggestions = await tagAutocomplete.getSuggestions(query, 8);

                const items: AutocompleteItem[] = suggestions.map((s: any) => ({
                    text: s.tag,
                    isSecondary: s.isAlias,
                    isAlias: s.isAlias,
                    originalSearch: s.matchedAlias || (s.isAlias ? query : undefined)
                }));

                component.showSuggestions(items);
            } catch (err) {
                console.error('Autocomplete request failed', err);
                component.showSuggestions([]);
            }
        });
    }
}

export const promptAutocompleteManager = new PromptAutocompleteManager();
