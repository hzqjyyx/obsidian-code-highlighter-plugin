# Code Highlighter Plugin for Obsidian

A lightweight Obsidian plugin that highlights specific lines in code blocks. Supports Reading mode, Live Preview mode (coming soon), and Canvas.

## Features

- 🎯 **Line Number Highlighting**: Highlight specific lines by number
- 📊 **Range Support**: Highlight ranges of lines (e.g., 1-5)
- 🔍 **Regex Matching**: Highlight lines matching a regular expression
- 📝 **Text Matching**: Highlight lines containing specific text
- 🎨 **Canvas Support**: Works in Obsidian Canvas
- 🌓 **Theme Aware**: Adapts to light and dark themes

## Usage

Add highlight parameters to your code blocks using the `hl:` syntax:

### Line Numbers

```javascript hl:1,3,5
// This line will be highlighted (line 1)
const foo = "bar";
// This line will be highlighted (line 3)
const baz = "qux";
// This line will be highlighted (line 5)
```

### Line Ranges

```python hl:2-4
def hello():
    # Lines 2-4 will be highlighted
    print("Hello")
    print("World")
    return True
```

### Regular Expression

```javascript hl:/console/
const x = 10;
console.log(x);  // This line will be highlighted
const y = 20;
console.error(y);  // This line will be highlighted
```

### Text Matching

```javascript hl:"TODO"
const x = 10;
// TODO: Fix this  // This line will be highlighted
const y = 20;
// TODO: Refactor  // This line will be highlighted
```

### Combined Rules

You can combine multiple highlight rules:

```javascript hl:1,3-5,/error/,"TODO"
// Line 1 highlighted
const x = 10;
// Lines 3-5 highlighted
console.error("test");  // Also highlighted by regex
// TODO: Fix  // Also highlighted by text match
```

### R Markdown Style

You can also use R Markdown style syntax with curly braces:

```javascript {1,3-5}
// Line 1 highlighted
const x = 10;
// Lines 3-5 highlighted
const y = 20;
const z = 30;
```

## Installation

### Manual Installation

1. Download the latest release
2. Extract the files to your vault's plugins folder: `<vault>/.obsidian/plugins/code-highlighter/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### Development Installation

1. Clone this repository into your vault's plugins folder
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Reload Obsidian
5. Enable the plugin in Settings → Community Plugins

## Customization

You can customize the highlight color by adding CSS snippets to your vault:

```css
/* Custom highlight color */
.code-highlighter-highlighted {
    background-color: rgba(100, 200, 255, 0.2) !important;
    border-left-color: rgba(100, 200, 255, 0.8) !important;
}
```

## Roadmap

- [x] Reading mode support
- [x] Canvas support
- [x] Line number highlighting
- [x] Range highlighting
- [x] Regex matching
- [x] Text matching
- [ ] Full Live Preview mode support
- [ ] Settings panel for customization
- [ ] Multiple highlight colors
- [ ] Line number display (optional)

## Version History

### v0.1.0 (Initial Release)

- Basic line highlighting in Reading mode
- Canvas support
- Support for line numbers, ranges, regex, and text matching
- R Markdown style syntax support

## Credits

This plugin was inspired by [Obsidian-Code-Styler](https://github.com/mayurankv/Obsidian-Code-Styler) and extracts its core line highlighting functionality into a lightweight, focused plugin.

## License

MIT License - See LICENSE file for details

## Support

If you encounter any issues or have feature requests, please open an issue on GitHub.
