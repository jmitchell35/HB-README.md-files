export const turndownConfig = {
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
}

export const turndownRules = {
  codeBlock: {
    filter: ['pre', 'textarea'],
    replacement: function (content, node) {
      // If it's a textarea containing code or a pre element
      if (node.tagName === 'TEXTAREA' || node.parentElement.className.includes('code') || node.className.includes('code')) {
        // Clean up the content
        let code = content
          .trim()
          .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
          .replace(/\u200B/g, '') // Remove zero-width spaces

        // Determine if we need a language specifier
        let language = ''
        if (node.className && node.className.includes('language-')) {
          language = node.className.match(/language-(\w+)/)[1]
        } else if (node.parentElement.className && node.parentElement.className.includes('language-')) {
          language = node.parentElement.className.match(/language-(\w+)/)[1]
        }

        return '\n```' + language + '\n' + code + '\n```\n'
      }
      return content
    },
  },
  textarea: {
    filter: 'textarea',
    replacement: function (content, node) {
      // If this textarea was already handled by the code block rule, skip it
      if (node.className.includes('code') || node.parentElement.className.includes('code')) {
        return ''
      }
      // For regular text areas, just return the content
      return content.trim()
    },
  },
}
