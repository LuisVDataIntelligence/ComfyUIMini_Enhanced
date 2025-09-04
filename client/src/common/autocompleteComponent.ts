export interface AutocompleteItem {
    text: string;
    isSecondary?: boolean;
    isAlias?: boolean;
    originalSearch?: string;
}

export class AutocompleteComponent {
    private container: HTMLElement;
    private dropdown: HTMLElement;
    private textarea: HTMLTextAreaElement;
    private isVisible = false;
    private selectedIndex = -1;
    private suggestions: AutocompleteItem[] = [];
    private currentWord = '';
    private currentWordStart = 0;
    private currentWordEnd = 0;

    constructor(textarea: HTMLTextAreaElement) {
        this.textarea = textarea;
        this.container = this.createContainer();
        this.dropdown = this.createDropdown();
        this.container.appendChild(this.dropdown);
        
        const innerWrapper = textarea.parentNode as HTMLElement | null;
        if (innerWrapper) {
            innerWrapper.appendChild(this.container);
            (innerWrapper as HTMLElement).style.position = 'relative';
        }
        
        this.attachEventListeners();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'autocomplete-container';
        return container;
    }

    private createDropdown(): HTMLElement {
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown hidden';
        return dropdown;
    }

    private attachEventListeners(): void {
        this.textarea.addEventListener('input', () => this.handleInput());
        this.textarea.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.textarea.addEventListener('blur', () => {
            setTimeout(() => this.hide(), 150);
        });
        
        this.dropdown.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const item = (e.target as HTMLElement).closest('.autocomplete-item');
            if (item) {
                const index = Array.from(this.dropdown.children).indexOf(item);
                this.selectItem(index);
            }
        });
        
        this.dropdown.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        this.setupMobileTouchHandling();
    }
    
    private setupMobileTouchHandling(): void {
        let isScrolling = false;
        let startY = 0;
        
        this.dropdown.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isScrolling = false;
        }, { passive: true });
        
        this.dropdown.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const deltaY = Math.abs(currentY - startY);
            
            if (deltaY > 10) {
                isScrolling = true;
            }
            
            if (isScrolling) {
                e.preventDefault();
            }
        }, { passive: false });
        
        this.dropdown.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isScrolling) {
                const item = (e.target as HTMLElement).closest('.autocomplete-item');
                if (item) {
                    const index = Array.from(this.dropdown.children).indexOf(item);
                    this.selectItem(index);
                }
            }
            isScrolling = false;
        });
    }

    private handleInput(): void {
        const cursorPos = this.textarea.selectionStart || 0;
        const text = this.textarea.value;
        
        const beforeCursor = text.substring(0, cursorPos);
        const afterCursor = text.substring(cursorPos);
        
        const wordStartMatch = beforeCursor.match(/(?:^|,)\s*([^,]*)$/);
        const wordEndMatch = afterCursor.match(/^([^,]*)/);
        
        if (!wordStartMatch) {
            this.hide();
            return;
        }
        
        this.currentWord = (wordStartMatch[1] + (wordEndMatch ? wordEndMatch[1] : '')).trim();
        this.currentWordStart = cursorPos - wordStartMatch[1].length;
        this.currentWordEnd = cursorPos + (wordEndMatch ? wordEndMatch[1].length : 0);
        
        if (this.currentWord.length < 2) {
            this.hide();
            return;
        }
        
        this.requestSuggestions(this.currentWord);
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (!this.isVisible) return;
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
            case 'Tab':
            case 'Enter':
                event.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.selectedIndex);
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.hide();
                break;
        }
    }

    private requestSuggestions(query: string): void {
        const event = new CustomEvent('autocomplete-request', {
            detail: { query, component: this }
        });
        document.dispatchEvent(event);
    }

    public showSuggestions(suggestions: AutocompleteItem[]): void {
        this.suggestions = suggestions;
        this.selectedIndex = -1;
        
        if (suggestions.length === 0) {
            this.hide();
            return;
        }
        
        this.renderSuggestions();
        this.show();
    }

    private renderSuggestions(): void {
        this.dropdown.innerHTML = '';
        
        this.suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = `autocomplete-item${suggestion.isSecondary ? ' secondary' : ''}${suggestion.isAlias ? ' alias' : ''}`;
            
            if (suggestion.isAlias && suggestion.originalSearch) {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag-name';
                tagSpan.textContent = suggestion.text;
                
                const aliasNote = document.createElement('span');
                aliasNote.className = 'alias-note';
                aliasNote.textContent = ` (from "${suggestion.originalSearch}")`;
                
                item.appendChild(tagSpan);
                item.appendChild(aliasNote);
            } else {
                item.textContent = suggestion.text;
            }
            
            item.setAttribute('data-index', index.toString());
            this.dropdown.appendChild(item);
        });
    }

    private updateSelection(): void {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
        
        if (this.selectedIndex >= 0) {
            const selectedItem = items[this.selectedIndex] as HTMLElement;
            selectedItem.scrollIntoView({ block: 'nearest' });
        }
    }

    private selectItem(index: number): void {
        if (index < 0 || index >= this.suggestions.length) return;
        
        const selectedSuggestion = this.suggestions[index];
        const text = this.textarea.value;
        const cursorPos = this.textarea.selectionStart || 0;
        
        const beforeCursor = text.substring(0, cursorPos);
        const afterCursor = text.substring(cursorPos);
        
        const wordStartMatch = beforeCursor.match(/(?:^|,)(\s*)([^,]*)$/);
        const wordEndMatch = afterCursor.match(/^([^,]*)/);
        
        if (!wordStartMatch) return;
        
        const partialTag = wordStartMatch[2];
        
        const wordStart = cursorPos - partialTag.length;
        const wordEnd = cursorPos + (wordEndMatch ? wordEndMatch[1].length : 0);
        
        const remainingText = text.substring(wordEnd);
        
        const newText = text.substring(0, wordStart) + 
                       selectedSuggestion.text + ',' +
                       remainingText;
        
        this.textarea.value = newText;
        
        const newCursorPos = wordStart + selectedSuggestion.text.length + 1;
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);
        
        this.suggestions = [];
        this.selectedIndex = -1;
        this.hide();
        
        setTimeout(() => {
            this.textarea.dispatchEvent(new Event('input', { bubbles: false }));
        }, 0);
    }

    private show(): void {
        this.isVisible = true;
        this.dropdown.classList.remove('hidden');
        this.positionDropdown();
    }

    private hide(): void {
        this.isVisible = false;
        this.dropdown.classList.add('hidden');
        this.selectedIndex = -1;
    }

    private positionDropdown(): void {
        // Positioning is handled by CSS for now
    }

    public destroy(): void {
        this.container.remove();
    }
}
