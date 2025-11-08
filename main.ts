import { Plugin, MarkdownPostProcessorContext, editorLivePreviewField, MarkdownRenderChild, Notice } from 'obsidian';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder, EditorState } from '@codemirror/state';

// Types for highlight rules
interface HighlightRule {
    type: 'line' | 'range' | 'regex' | 'text';
    value: number | [number, number] | RegExp | string;
}

export default class CodeHighlighterPlugin extends Plugin {
    async onload() {
        // Register markdown post-processor for Reading mode
        this.registerMarkdownPostProcessor(this.processCodeBlock.bind(this), 2000);

        // Register CodeMirror extension for Live Preview mode
        this.registerEditorExtension(this.createLivePreviewExtension());
    }

    /**
     * Parse highlight syntax from code fence info string
     * Supports: hl:1,3,5 or hl:2-4 or hl:/regex/ or hl:"text" or {1,3-5}
     */
    parseHighlightRules(info: string): HighlightRule[] {
        const rules: HighlightRule[] = [];

        // Match hl:... syntax
        const hlMatch = info.match(/hl:([^\s]+)/);
        // Match {...} syntax (R Markdown style)
        const braceMatch = info.match(/\{([^}]+)\}/);

        const rulesString = hlMatch ? hlMatch[1] : (braceMatch ? braceMatch[1] : null);

        if (!rulesString) {
            return rules;
        }

        // Split by comma, but respect quoted strings and regex patterns
        const parts = this.splitRules(rulesString);

        for (const part of parts) {
            const trimmed = part.trim();

            // Regex pattern: /pattern/
            if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
                try {
                    const pattern = trimmed.slice(1, -1);
                    rules.push({ type: 'regex', value: new RegExp(pattern) });
                } catch (e) {
                    console.warn('Invalid regex pattern:', trimmed);
                }
            }
            // Text match: "text" or 'text'
            else if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                const text = trimmed.slice(1, -1);
                rules.push({ type: 'text', value: text });
            }
            // Range: 2-4
            else if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                if (!isNaN(start) && !isNaN(end)) {
                    rules.push({ type: 'range', value: [start, end] });
                }
            }
            // Single line number: 1
            else if (!isNaN(parseInt(trimmed))) {
                rules.push({ type: 'line', value: parseInt(trimmed) });
            }
            // Bare text: process
            else {
                rules.push({ type: 'text', value: trimmed });
            }
        }

        return rules;
    }

    /**
     * Split rules string by comma, respecting quoted strings and regex patterns
     */
    private splitRules(rulesString: string): string[] {
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;
        let inRegex = false;
        let quoteChar = '';

        for (let i = 0; i < rulesString.length; i++) {
            const char = rulesString[i];

            if ((char === '"' || char === "'") && !inRegex) {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuotes = false;
                    quoteChar = '';
                }
                current += char;
            } else if (char === '/' && !inQuotes) {
                if (!inRegex) {
                    inRegex = true;
                } else {
                    inRegex = false;
                }
                current += char;
            } else if (char === ',' && !inQuotes && !inRegex) {
                if (current.trim()) {
                    parts.push(current.trim());
                }
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            parts.push(current.trim());
        }

        return parts;
    }

    /**
     * Check if a line should be highlighted based on rules
     */
    shouldHighlightLine(lineNumber: number, lineContent: string, rules: HighlightRule[]): boolean {
        for (const rule of rules) {
            switch (rule.type) {
                case 'line':
                    if (lineNumber === rule.value) return true;
                    break;
                case 'range':
                    const [start, end] = rule.value as [number, number];
                    if (lineNumber >= start && lineNumber <= end) return true;
                    break;
                case 'regex':
                    if ((rule.value as RegExp).test(lineContent)) return true;
                    break;
                case 'text':
                    if (lineContent.includes(rule.value as string)) return true;
                    break;
            }
        }
        return false;
    }

    /**
     * Process code blocks in Reading mode
     */
    processCodeBlock(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const codeBlocks = el.querySelectorAll('pre > code');

        codeBlocks.forEach((codeEl) => {
            const preEl = codeEl.parentElement as HTMLElement | null;
            if (!preEl) return;

            // Try to find the original info string
            // In Reading mode, we need to check the section info
            const sectionInfo = ctx.getSectionInfo(preEl);
            if (!sectionInfo) return;

            // Get the source text to extract the info string
            const lines = sectionInfo.text.split('\n').slice(sectionInfo.lineStart, sectionInfo.lineEnd + 1) || [];
            const firstLine = lines[0] || '';

            // Extract info string from ```language hl:... or ```language {..}
            const infoMatch = firstLine.match(/^```(\S+.*?)$/);
            if (!infoMatch) return;

            const info = infoMatch[1];
            const rules = this.parseHighlightRules(info);

            if (rules.length === 0) return;

            // Get code block content (excluding the opening ``` line and closing ``` line)
            const codeLines = lines.slice(1, -1); // Remove first line (```...) and last line (```)
            if (codeLines.length === 0) return;

            // Manage lifecycle for this code block
            const child = new (class extends MarkdownRenderChild {
                overlays: HTMLElement[] = [];
                observer?: MutationObserver;
                timeoutId?: number;
                clear() {
                    this.overlays.forEach((e) => e.remove());
                    this.overlays = [];
                }
                onunload(): void {
                    this.clear();
                    if (this.observer) {
                        this.observer.disconnect();
                        this.observer = undefined;
                    }
                    if (this.timeoutId) {
                        window.clearTimeout(this.timeoutId);
                        this.timeoutId = undefined;
                    }
                }
            })(preEl);

            ctx.addChild(child);

            const tryRender = (): boolean => {
                // Check if syntax highlighting spans exist yet
                const spans = codeEl.querySelectorAll('span');
                if (spans.length === 0) return false;

                // Ensure pre is positioned for absolute overlays
                const preComputed = getComputedStyle(preEl);
                if (preComputed.position === 'static') preEl.style.position = 'relative';

                // Compute line height
                const rootStyles = getComputedStyle(codeEl);
                const fontSize = parseFloat(rootStyles.getPropertyValue('--font-text-size')) || parseFloat(rootStyles.fontSize) || 14;
                const lineHeightRatio = parseFloat(rootStyles.getPropertyValue('--line-height-normal')) || (parseFloat(rootStyles.lineHeight) / fontSize) || 1.6;
                const lineHeight = fontSize * lineHeightRatio;

                const firstSpan = spans[0] as HTMLElement;
                const rect = firstSpan.getBoundingClientRect();
                const lineHeightAdjustment = (lineHeight - rect.height) / 2;
                const firstLineOffsetTop = firstSpan.offsetTop;

                // Calculate which lines should be highlighted
                const highlightedLines: number[] = [];
                codeLines.forEach((lineContent, index) => {
                    const lineNumber = index + 1; // Line numbers start from 1
                    if (this.shouldHighlightLine(lineNumber, lineContent, rules)) {
                        highlightedLines.push(lineNumber);
                    }
                });

                // Clear any previous overlays before re-rendering
                child.clear();

                // Create overlay for each highlighted line
                highlightedLines.forEach((lineNumber) => {
                    // Calculate position: (lineNumber - 1) * lineHeight + firstLineOffsetTop - lineHeightAdjustment
                    const top = (lineNumber - 1) * lineHeight + firstLineOffsetTop - lineHeightAdjustment;

                    const overlay = preEl.createEl('div');
                    overlay.addClass('code-highlighter-highlighted');
                    overlay.style.setProperty('position', 'absolute');
                    overlay.style.setProperty('top', `${top}px`);
                    overlay.style.setProperty('left', '0.5em');
                    overlay.style.setProperty('marginLeft', '0');
                    overlay.style.setProperty('width', '100%');
                    overlay.style.setProperty('height', `${lineHeightRatio}em`);
                    // overlay.style.setProperty('pointer-events', 'none');

                    child.overlays.push(overlay);
                });

                return true;
            };

            // Try to render after layout settles (double rAF)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (tryRender()) return;

                    // Fallback: watch briefly for syntax highlighting completion
                    child.observer = new MutationObserver(() => {
                        if (tryRender()) {
                            child.observer?.disconnect();
                            child.observer = undefined;
                        }
                    });
                    child.observer.observe(codeEl, { childList: true, subtree: true });
                    // Safety timeout to avoid leaks
                    child.timeoutId = window.setTimeout(() => {
                        child.observer?.disconnect();
                        child.observer = undefined;
                    }, 1500);
                });
            });

        });
    }

    /**
     * Escape HTML special characters
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Create CodeMirror extension for Live Preview mode
     */
    createLivePreviewExtension() {
        const plugin = this;

        return ViewPlugin.fromClass(class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView): DecorationSet {
                // Only apply in Live Preview mode
                if (!view.state.field(editorLivePreviewField)) {
                    return Decoration.none;
                }

                const builder = new RangeSetBuilder<Decoration>();
                const doc = view.state.doc;

                // Iterate through each line in the document
                let lineNum = 1;
                while (lineNum <= doc.lines) {
                    const line = doc.line(lineNum);
                    const lineText = line.text;

                    // Check if this line starts a code block
                    if (lineText.startsWith('```')) {
                        const infoLine = lineText.substring(3);
                        const rules = plugin.parseHighlightRules(infoLine);

                        // Skip to next line after opening ```
                        lineNum++;

                        if (rules.length > 0) {
                            // Process code block lines
                            let codeLineNum = 1;
                            while (lineNum <= doc.lines) {
                                const codeLine = doc.line(lineNum);
                                const codeLineText = codeLine.text;

                                // Check if we've reached the closing ```
                                if (codeLineText.startsWith('```')) {
                                    break;
                                }

                                // Check if this line should be highlighted
                                const shouldHighlight = plugin.shouldHighlightLine(codeLineNum, codeLineText, rules);

                                if (shouldHighlight) {
                                    // Add line decoration at the start of the line
                                    builder.add(
                                        codeLine.from,
                                        codeLine.from,
                                        Decoration.line({ class: 'code-highlighter-highlighted' })
                                    );
                                }

                                codeLineNum++;
                                lineNum++;
                            }
                        } else {
                            // No rules, skip to closing ```
                            while (lineNum <= doc.lines) {
                                const codeLine = doc.line(lineNum);
                                if (codeLine.text.startsWith('```')) {
                                    break;
                                }
                                lineNum++;
                            }
                        }
                    }

                    lineNum++;
                }

                return builder.finish();
            }
        }, {
            decorations: v => v.decorations
        });
    }
}
