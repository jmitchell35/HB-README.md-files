# Holberton Markdown Extension

A Chrome extension that helps Holberton students quickly generate README.md files from their project pages.

## Features

- One-click conversion of Holberton project pages to Markdown
- Automatically extracts:
  - Resources section
  - Learning Objectives
  - Requirements
  - All tasks with their descriptions
- Clean and organized output
- Option to save directly as README.md
- Copy to clipboard functionality

## Installation

1. Clone this repository:

```bash
git clone https://github.com/yourusername/holberton-markdown-extension.git
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any Holberton project page
2. Click the extension icon in your browser toolbar
3. Click "Scan Page" to convert the content
4. Choose to either:
   - Save directly as README.md
   - Copy to clipboard

### Tech Stack

- HTML/CSS for the popup interface
- Vanilla JavaScript for functionality
- TurndownJS for HTML to Markdown conversion
- Chrome Extension APIs

## Development

### Prerequisites

- Node.js and npm installed
- Chrome browser

### Setup for Development

1. Install dependencies:

```bash
npm install turndown
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [TurndownJS](https://github.com/mixmark-io/turndown) for HTML to Markdown conversion
- Holberton School for inspiration and the project structure
