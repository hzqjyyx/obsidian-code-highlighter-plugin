---
name: obsidian-plugin
description: Create, modify, debug, and enhance Obsidian plugins with focus on UI enhancements. Use when the user asks to create an Obsidian plugin, build a plugin for Obsidian, modify an existing Obsidian plugin, fix plugin issues, or debug plugin problems. Particularly useful for UI customizations like highlighting, styling, custom views, and markdown post-processing.
---

# Obsidian Plugin Development

Expert guidance for creating, modifying, and debugging Obsidian plugins, with emphasis on UI enhancements and beginner-friendly explanations.

## Quick Start

### Creating a New Plugin

1. **Copy the plugin template:**
```bash
cp -r /mnt/skills/user/obsidian-plugin/assets/plugin-template ./my-plugin
cd my-plugin
```

2. **Customize the manifest:**
Edit `manifest.json` with plugin details (id, name, description, author)

3. **Install dependencies:**
```bash
npm install
```

4. **Start development:**
```bash
npm run dev
```

5. **Test the plugin:**
- Copy the plugin folder to `.obsidian/plugins/` in your vault
- Enable the plugin in Obsidian Settings → Community plugins
- Reload Obsidian (Ctrl+R) to see changes

### Modifying Existing Plugins

When modifying uploaded plugin files:
1. Read the existing `main.ts` to understand current functionality
2. Identify the specific code section to modify
3. Make targeted changes while preserving existing structure
4. Test thoroughly after modifications

### Debugging Issues

When fixing plugin problems:
1. Check the console (Ctrl+Shift+I) for error messages
2. Read `references/debugging.md` for common issues and solutions
3. Verify file structure and dependencies
4. Test incrementally after each fix

## Core Development Patterns

### Plugin Structure

Every plugin has this basic structure:
```typescript
import { Plugin } from 'obsidian';

export default class MyPlugin extends Plugin {
    async onload() {
        // Plugin initialization
        // Add commands, register events, etc.
    }

    onunload() {
        // Cleanup when plugin is disabled
    }
}
```

### Adding UI Features

**Commands (Command Palette):**
```typescript
this.addCommand({
    id: 'my-command',
    name: 'My Command',
    callback: () => {
        // Your logic here
    }
});
```

**Ribbon Icons (Left Sidebar):**
```typescript
this.addRibbonIcon('icon-name', 'Tooltip', (evt: MouseEvent) => {
    // Click handler
});
```

**Settings Tab:**
```typescript
this.addSettingTab(new MySettingTab(this.app, this));
```

### Processing Markdown (UI Enhancements)

For UI customizations like highlighting code blocks, use markdown post-processors:

```typescript
this.registerMarkdownPostProcessor((element, context) => {
    // Find elements to modify
    const codeBlocks = element.querySelectorAll('pre > code');
    
    codeBlocks.forEach((block: HTMLElement) => {
        // Modify the rendered HTML
        // Example: add line numbers, highlight lines, etc.
    });
});
```

**Key points:**
- Runs after markdown is rendered to HTML
- Modify the `element` directly
- Use CSS classes for styling (defined in `styles.css`)
- Add marker classes to prevent re-processing

### Common UI Enhancement Pattern

For code block highlighting (a common request):

```typescript
this.registerMarkdownPostProcessor((element, context) => {
    const codeBlocks = element.querySelectorAll('pre > code');
    
    codeBlocks.forEach((block: HTMLElement) => {
        // Prevent re-processing
        if (block.hasClass('processed')) return;
        block.addClass('processed');
        
        // Split into lines
        const lines = block.textContent.split('\n');
        
        // Wrap each line in a span for styling
        block.innerHTML = lines.map((line, index) => {
            const lineNum = index + 1;
            // Add classes for specific line highlighting
            const classes = shouldHighlight(lineNum) ? 'line highlighted' : 'line';
            return `<span class="${classes}" data-line="${lineNum}">${line}</span>`;
        }).join('\n');
    });
});
```

Then in `styles.css`:
```css
.my-plugin .highlighted {
    background-color: rgba(255, 255, 0, 0.3);
}
```

## Building and Testing

### Development Workflow

1. **Start dev server:** `npm run dev` (watches for changes)
2. **Make code changes** in `main.ts`
3. **Reload Obsidian** (Ctrl+R) to see updates
4. **Check console** for errors (Ctrl+Shift+I)

### Production Build

```bash
npm run build
```

Creates optimized `main.js` for distribution.

## Helpful Resources

### API Reference
Read `references/api_reference.md` for:
- Common plugin patterns
- Working with files and editor
- UI components (modals, notices, settings)
- Event handling
- Styling guidelines

### Debugging Guide
Read `references/debugging.md` when encountering:
- Plugin not loading issues
- TypeScript/build errors
- CSS not applying
- Markdown post-processor problems
- Performance issues
- Common gotchas

## Settings and Data Persistence

### Basic Settings Pattern

```typescript
interface MyPluginSettings {
    setting1: string;
    setting2: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    setting1: 'default',
    setting2: true
}

export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        await this.loadSettings();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
```

### Settings UI

```typescript
class MySettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Setting name')
            .setDesc('Description')
            .addText(text => text
                .setValue(this.plugin.settings.setting1)
                .onChange(async (value) => {
                    this.plugin.settings.setting1 = value;
                    await this.plugin.saveSettings();
                }));
    }
}
```

## Best Practices

1. **Prefix CSS classes** with your plugin name to avoid conflicts
2. **Use `this.register()` or `this.registerEvent()`** for automatic cleanup
3. **Check console for errors** during development
4. **Test with both light and dark themes**
5. **Add comments** for complex logic
6. **Handle edge cases** (empty files, invalid input, etc.)
7. **Provide user feedback** with notices for actions

## Common Beginner Mistakes

1. **Forgetting to rebuild:** Changes require `npm run dev` or `npm run build`
2. **Not reloading Obsidian:** Press Ctrl+R after rebuilding
3. **Wrong element selectors:** Use browser DevTools to inspect elements
4. **Missing async/await:** Use `async` for functions that load/save data
5. **Not checking console:** Errors appear in Developer Console (Ctrl+Shift+I)

## File Structure Reference

```
my-plugin/
├── main.ts           # Main plugin code
├── manifest.json     # Plugin metadata
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── esbuild.config.mjs # Build configuration
├── styles.css        # Custom styling (optional)
├── .gitignore        # Git ignore rules
└── node_modules/     # Dependencies (created by npm install)
```
