# Debugging and Troubleshooting Guide

Common issues when developing Obsidian plugins and how to fix them.

## Setup Issues

### Plugin Not Loading
**Symptoms:** Plugin doesn't appear in Community Plugins
**Solutions:**
1. Check `manifest.json` is valid JSON
2. Ensure `main.js` exists (run `npm run build`)
3. Verify plugin folder is in `.obsidian/plugins/`
4. Check Obsidian console for errors (Ctrl+Shift+I)

### TypeScript Errors
**Symptoms:** Build fails with type errors
**Solutions:**
1. Install types: `npm install --save-dev obsidian`
2. Check `tsconfig.json` includes correct paths
3. Verify imports: `import { App, Plugin } from 'obsidian'`

## Runtime Issues

### Changes Not Appearing
**Solutions:**
1. Disable and re-enable plugin in settings
2. Reload Obsidian (Ctrl+R)
3. Check if files are being built (`npm run dev` should show changes)

### CSS Not Applying
**Solutions:**
1. Verify `styles.css` exists in plugin folder
2. Check CSS class names are correct
3. Use browser DevTools to inspect elements
4. Ensure no typos in class names
5. Try adding `!important` to test specificity issues

### Markdown Post Processor Not Working
**Common mistakes:**
- Not waiting for elements to render
- Wrong selector (try `querySelectorAll` instead of `findAll`)
- Processing already-processed elements (check for marker class)

**Fix:**
```typescript
this.registerMarkdownPostProcessor((element, context) => {
    // Add marker to prevent re-processing
    if (element.hasClass('my-plugin-processed')) return;
    element.addClass('my-plugin-processed');
    
    // Your processing logic
});
```

## Code Block Manipulation Issues

### Line Highlighting Not Working
**Problem:** Lines aren't highlighting in code blocks
**Solutions:**
1. Ensure you're targeting the right element:
```typescript
const codeBlocks = element.querySelectorAll('pre > code');
// Not just 'code' - needs to be inside 'pre'
```

2. Check CSS specificity:
```css
/* More specific selector */
.markdown-preview-view pre > code .highlighted-line {
    background-color: yellow;
}
```

3. Verify HTML structure is preserved:
```typescript
// Keep existing classes
const lines = block.innerHTML.split('\n');
block.innerHTML = lines.map((line, i) => {
    return `<span class="line">${line}</span>`;
}).join('\n');
```

### Code Block Language Detection
```typescript
this.registerMarkdownPostProcessor((element, context) => {
    const codeBlocks = element.querySelectorAll('pre > code');
    codeBlocks.forEach((block: HTMLElement) => {
        // Get language from class
        const classes = block.className.split(' ');
        const langClass = classes.find(c => c.startsWith('language-'));
        const language = langClass?.replace('language-', '') || 'plaintext';
        
        console.log('Detected language:', language);
    });
});
```

## Event Handler Issues

### Events Not Firing
**Solutions:**
1. Verify event is registered with `this.registerEvent()`
2. Check event name is correct
3. Ensure cleanup in `onunload()`

**Correct pattern:**
```typescript
onload() {
    this.registerEvent(
        this.app.workspace.on('file-open', this.handleFileOpen.bind(this))
    );
}

handleFileOpen(file: TFile) {
    console.log('File opened:', file.path);
}
```

### Memory Leaks
**Symptoms:** Obsidian slows down over time
**Solutions:**
1. Always use `this.register()` or `this.registerEvent()`
2. Clean up in `onunload()`
3. Remove event listeners manually if not using register methods

## Settings Issues

### Settings Not Persisting
**Solutions:**
1. Call `await this.saveSettings()` after changes
2. Verify `loadData()` and `saveData()` are being called
3. Check data.json in plugin folder for correct structure

**Pattern:**
```typescript
async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
    await this.saveData(this.settings);
}
```

## Performance Issues

### Slow Rendering
**Solutions:**
1. Debounce expensive operations
2. Use `requestAnimationFrame` for DOM updates
3. Process elements in batches
4. Add early returns for unchanged content

**Example:**
```typescript
this.registerMarkdownPostProcessor((element, context) => {
    // Early return if already processed
    if (element.hasAttribute('data-processed')) return;
    element.setAttribute('data-processed', 'true');
    
    // Batch process
    requestAnimationFrame(() => {
        // Heavy processing here
    });
});
```

## Common Gotchas

### 1. DOM Element References
Don't store references to DOM elements - they may be destroyed and recreated.
```typescript
// Bad
this.myElement = element.querySelector('.my-class');

// Good
function getMyElement() {
    return document.querySelector('.my-class');
}
```

### 2. Async Operations in Constructor
Don't use async operations in class constructors.
```typescript
// Bad
class MyPlugin extends Plugin {
    constructor() {
        super();
        await this.loadData(); // Won't work
    }
}

// Good
class MyPlugin extends Plugin {
    async onload() {
        await this.loadSettings();
    }
}
```

### 3. Obsidian API Changes
Some APIs change between versions. Check `minAppVersion` in manifest.json and test with that version.

## Debugging Tools

### Console Methods
```typescript
console.log('Info:', data);
console.warn('Warning:', issue);
console.error('Error:', error);
console.table(arrayOfObjects); // Pretty print arrays
```

### Breakpoints
1. Open Developer Tools (Ctrl+Shift+I)
2. Go to Sources tab
3. Find your plugin's main.js
4. Click line numbers to set breakpoints

### Element Inspection
1. Open Developer Tools
2. Click element picker (top-left icon)
3. Click element in Obsidian
4. View computed styles, event listeners, etc.

## Testing Checklist

Before releasing your plugin:
- [ ] Test in both edit and preview mode
- [ ] Test with different themes (light/dark)
- [ ] Test on different platforms (desktop/mobile if applicable)
- [ ] Check console for errors
- [ ] Verify settings persist
- [ ] Test plugin disable/enable
- [ ] Check for memory leaks (leave running, check performance)
- [ ] Validate all user inputs
