# Obsidian Plugin API Reference

Quick reference for commonly used Obsidian API features when building plugins.

## Core Classes

### Plugin
Base class for all plugins. Main lifecycle methods:
- `onload()` - Called when plugin loads. Set up your plugin here.
- `onunload()` - Called when plugin unloads. Clean up resources.
- `loadData()` / `saveData(data)` - Load/save plugin data

### App
Main application object providing access to workspace, vault, and other core features.
- `app.workspace` - Access to workspace (panes, leaves, views)
- `app.vault` - Access to vault (files, folders)
- `app.metadataCache` - Access to file metadata and links

## Common Plugin Patterns

### Adding Commands
```typescript
this.addCommand({
    id: 'unique-command-id',
    name: 'Command Name',
    callback: () => {
        // Command logic
    }
});
```

### Adding Ribbon Icons
```typescript
this.addRibbonIcon('icon-name', 'Tooltip text', (evt: MouseEvent) => {
    // Click handler
});
```

### Adding Settings Tab
```typescript
this.addSettingTab(new MySettingTab(this.app, this));
```

### Markdown Post Processor
Process markdown after it's rendered:
```typescript
this.registerMarkdownPostProcessor((element, context) => {
    // Modify the rendered element
    const codeBlocks = element.findAll('pre > code');
    codeBlocks.forEach(block => {
        // Process code blocks
    });
});
```

### CodeMirror 6 Extensions
Add editor extensions for live preview mode:
```typescript
this.registerEditorExtension([
    ViewPlugin.fromClass(class {
        constructor(view: EditorView) {
            // Initialize
        }
        update(update: ViewUpdate) {
            // Handle updates
        }
    })
]);
```

## Working with Files

### Read File
```typescript
const file = this.app.vault.getAbstractFileByPath('path/to/file.md');
if (file instanceof TFile) {
    const content = await this.app.vault.read(file);
}
```

### Modify File
```typescript
await this.app.vault.modify(file, newContent);
```

### Get Active File
```typescript
const activeFile = this.app.workspace.getActiveFile();
```

## Working with the Editor

### Get Active Editor
```typescript
const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
if (activeView) {
    const editor = activeView.editor;
    // Use editor methods
}
```

### Editor Methods
- `editor.getValue()` - Get entire content
- `editor.setValue(text)` - Replace entire content
- `editor.getSelection()` - Get selected text
- `editor.replaceSelection(text)` - Replace selection
- `editor.getCursor()` - Get cursor position
- `editor.setCursor(pos)` - Set cursor position
- `editor.getLine(n)` - Get specific line

## UI Components

### Modal
```typescript
class MyModal extends Modal {
    constructor(app: App) {
        super(app);
    }
    
    onOpen() {
        const {contentEl} = this;
        contentEl.setText('Modal content');
    }
    
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

// Open modal
new MyModal(this.app).open();
```

### Notice
```typescript
new Notice('Notification message', 5000); // 5 second duration
```

### Settings
```typescript
new Setting(containerEl)
    .setName('Setting name')
    .setDesc('Setting description')
    .addText(text => text
        .setPlaceholder('Placeholder')
        .setValue(this.settings.value)
        .onChange(async (value) => {
            this.settings.value = value;
            await this.saveSettings();
        }));
```

## Styling

### Adding Custom CSS
Create a `styles.css` file in your plugin directory. It will be automatically loaded.

### CSS Classes
Prefix your CSS classes with your plugin name to avoid conflicts:
```css
.my-plugin-container { }
.my-plugin-highlight { }
```

## Events

### Register Events
```typescript
this.registerEvent(
    this.app.workspace.on('file-open', (file) => {
        // Handle file open
    })
);
```

### Common Events
- `'file-open'` - File opened
- `'active-leaf-change'` - Active pane changed
- `'layout-change'` - Layout changed
- `'quit'` - App closing

## Debugging

### Console Logging
```typescript
console.log('Debug message', data);
```

### Developer Console
- Windows/Linux: Ctrl+Shift+I
- Mac: Cmd+Option+I

## Common UI Patterns

### Highlighting Code Blocks
```typescript
this.registerMarkdownPostProcessor((element, context) => {
    const codeBlocks = element.querySelectorAll('pre > code');
    codeBlocks.forEach((block) => {
        // Add line numbers or highlighting
        const lines = block.textContent.split('\n');
        block.innerHTML = lines.map((line, i) => 
            `<span class="line" data-line="${i + 1}">${line}</span>`
        ).join('\n');
    });
});
```

### Custom View
```typescript
class MyView extends ItemView {
    getViewType(): string {
        return "my-view-type";
    }
    
    getDisplayText(): string {
        return "My view";
    }
    
    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h4", { text: "My View" });
    }
    
    async onClose() {
        // Clean up
    }
}

// Register view
this.registerView(
    "my-view-type",
    (leaf) => new MyView(leaf)
);

// Activate view
this.app.workspace.getRightLeaf(false).setViewState({
    type: "my-view-type",
    active: true,
});
```
