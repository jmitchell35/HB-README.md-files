document.addEventListener('DOMContentLoaded', function () {
  const scanButton = document.getElementById('scanButton')
  const saveButton = document.getElementById('saveButton')
  const copyButton = document.getElementById('copyButton')
  const resultActions = document.getElementById('resultActions')
  const status = document.getElementById('status')

  let markdownContent = ''
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  })

  // Configure TurndownService to handle code blocks and text areas better
  turndownService.addRule('codeBlock', {
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
  })

  // Add special rule for text areas that aren't code blocks
  turndownService.addRule('textarea', {
    filter: 'textarea',
    replacement: function (content, node) {
      // If this textarea was already handled by the code block rule, skip it
      if (node.className.includes('code') || node.parentElement.className.includes('code')) {
        return ''
      }
      // For regular text areas, just return the content
      return content.trim()
    },
  })

  scanButton.addEventListener('click', async () => {
    try {
      status.textContent = 'Scanning page...'

      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      // Execute script to get content
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const container = document.createElement('div')

          // Helper function to get section content
          function getSectionContent(heading) {
            const content = document.createElement('div')

            // Add the heading
            const h2 = document.createElement('h2')
            h2.textContent = heading.textContent.trim()
            content.appendChild(h2)

            // Get all siblings until next h2 or end of parent
            let currentElement = heading.nextElementSibling
            while (currentElement && currentElement.tagName !== 'H2') {
              // Special handling for textareas and code blocks
              if (currentElement.tagName === 'TEXTAREA' || currentElement.tagName === 'PRE') {
                const wrapper = document.createElement('div')
                wrapper.className = 'code-wrapper'
                const clone = currentElement.cloneNode(true)
                // Preserve original formatting
                clone.textContent = currentElement.value || currentElement.textContent
                wrapper.appendChild(clone)
                content.appendChild(wrapper)
              } else {
                content.appendChild(currentElement.cloneNode(true))
              }
              currentElement = currentElement.nextElementSibling
            }

            return content
          }

          // Get all h2 headings
          const headings = Array.from(document.querySelectorAll('.panel-body h2, .panel-body.text-justify h2'))

          // Process sections in order of appearance
          let foundResources = false
          let foundObjectives = false
          let foundRequirements = false

          headings.forEach(heading => {
            const headingText = heading.textContent.trim().toLowerCase()

            if (headingText.includes('resources') && !foundResources) {
              foundResources = true
              container.appendChild(getSectionContent(heading))
            } else if ((headingText.includes('learning objectives') || headingText.includes('learning objective')) && !foundObjectives) {
              foundObjectives = true
              container.appendChild(getSectionContent(heading))
            } else if (headingText.includes('requirements') && !foundRequirements) {
              foundRequirements = true
              container.appendChild(getSectionContent(heading))
            }
          })

          // Add Tasks section
          const tasksHeader = document.createElement('h2')
          tasksHeader.textContent = 'Tasks'
          container.appendChild(tasksHeader)

          // Get all task elements with special handling for code blocks
          const tasks = document.querySelectorAll('[data-role^="task"]')
          tasks.forEach(task => {
            const taskClone = task.cloneNode(true)

            // Remove unwanted elements
            const unwantedSelectors = [
              '.hidden',
              '[style*="display: none"]',
              '.task-card-done',
              '.check-your-task-button',
              '.correction-request-buttons',
              '.score',
              '.mandatory',
              '.advanced',
              '.QA-review',
              '.review-your-work',
              '.get-a-sandbox',
              '.help',
              '[id^="user_id"]',
              '.panel-heading-actions',
              '.fine',
            ]

            unwantedSelectors.forEach(selector => {
              const elements = taskClone.querySelectorAll(selector)
              elements.forEach(el => el.remove())
            })

            // Get task number and title
            const taskPosition = taskClone.getAttribute('data-position')
            const taskTitle = taskClone.querySelector('.panel-title, .list-group-item-heading')?.textContent?.trim() || ''

            // Create task header
            const taskHeader = document.createElement('h3')
            taskHeader.textContent = `${taskPosition}. ${taskTitle}`
            container.appendChild(taskHeader)

            // Get task content with special handling for code blocks
            const taskContent = taskClone.querySelector('.list-group-item-text, .panel-body')
            if (taskContent) {
              const cleanTask = document.createElement('div')
              Array.from(taskContent.childNodes).forEach(node => {
                if (node.tagName === 'TEXTAREA' || node.tagName === 'PRE') {
                  const wrapper = document.createElement('div')
                  wrapper.className = 'code-wrapper'
                  const clone = node.cloneNode(true)
                  clone.textContent = node.value || node.textContent
                  wrapper.appendChild(clone)
                  cleanTask.appendChild(wrapper)
                } else {
                  cleanTask.appendChild(node.cloneNode(true))
                }
              })
              container.appendChild(cleanTask)
            }

            // Add spacing between tasks
            container.appendChild(document.createElement('br'))
          })

          return container.innerHTML
        },
      })

      const html = result[0].result
      markdownContent = turndownService.turndown(html)

      // Clean up the markdown
      markdownContent = markdownContent
        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
        .replace(/\*\*\s*\*\*/g, '') // Remove empty bold tags
        .replace(/Score:\s*\d+\.\d+%/g, '') // Remove score lines
        .replace(/\(Checks completed.*?\)/g, '') // Remove checks completed text
        .replace(/Repo:\n\n/g, '') // Remove "Repo:" headers
        .replace(/File:\n\n/g, '') // Remove "File:" headers
        .replace(/Directory:\s*([^\n]+)/g, '**Directory:** `$1`') // Format directory paths
        .replace(/File:\s*([^\n]+)/g, '**File:** `$1`') // Format file paths
        .replace(/Read or watch:/, '**Read or watch:**')
        .replace(/MDN resources:/, '**MDN resources:**')
        .replace(/```\n\n```/g, '') // Remove empty code blocks
        .replace(/\n\n```\n/g, '\n```\n') // Fix spacing before code blocks
        .replace(/\n```\n\n/g, '\n```\n') // Fix spacing after code blocks
        .trim()

      resultActions.style.display = 'block'
      status.textContent = 'Content converted successfully!'
    } catch (error) {
      status.textContent = 'Error scanning page: ' + error.message
    }
  })

  saveButton.addEventListener('click', async () => {
    try {
      const blob = new Blob([markdownContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'README.md'
      a.click()
      URL.revokeObjectURL(url)
      status.textContent = 'File saved as README.md'
    } catch (error) {
      status.textContent = 'Error saving file: ' + error.message
    }
  })

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(markdownContent)
      status.textContent = 'Content copied to clipboard!'
    } catch (error) {
      status.textContent = 'Error copying to clipboard: ' + error.message
    }
  })
})
