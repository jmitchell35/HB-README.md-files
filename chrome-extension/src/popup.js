import { turndownConfig, turndownRules } from './config/turndown.config.js'
import { cleanupMarkdown } from './utils/content-processor.js'

document.addEventListener('DOMContentLoaded', function () {
  const scanButton = document.getElementById('scanButton')
  const saveButton = document.getElementById('saveButton')
  const copyButton = document.getElementById('copyButton')
  const resultActions = document.getElementById('resultActions')
  const statusElement = document.getElementById('status')

  let markdownContent = ''
  const turndownService = new TurndownService(turndownConfig)

  // Add custom rules
  Object.entries(turndownRules).forEach(([name, rule]) => {
    turndownService.addRule(name, rule)
  })

  function updateStatus(message, type = '') {
    statusElement.textContent = message
    statusElement.className = 'status' + (type ? ` ${type}` : '')
  }

  scanButton.addEventListener('click', async () => {
    try {
      updateStatus('Scanning page...')

      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      // Execute script to get content
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          function handleCodeElement(element) {
            const wrapper = document.createElement('div')
            wrapper.className = 'code-wrapper'
            const clone = element.cloneNode(true)
            clone.textContent = element.value || element.textContent
            wrapper.appendChild(clone)
            return wrapper
          }

          function getSectionContent(heading) {
            const content = document.createElement('div')

            // Add the heading
            const h2 = document.createElement('h2')
            h2.textContent = heading.textContent.trim()
            content.appendChild(h2)

            // Get all siblings until next h2 or end of parent
            let currentElement = heading.nextElementSibling
            while (currentElement && currentElement.tagName !== 'H2') {
              if (currentElement.tagName === 'TEXTAREA' || currentElement.tagName === 'PRE') {
                content.appendChild(handleCodeElement(currentElement))
              } else {
                content.appendChild(currentElement.cloneNode(true))
              }
              currentElement = currentElement.nextElementSibling
            }

            return content
          }

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

          function extractTaskContent(task) {
            const taskClone = task.cloneNode(true)

            // Remove unwanted elements
            unwantedSelectors.forEach(selector => {
              const elements = taskClone.querySelectorAll(selector)
              elements.forEach(el => el.remove())
            })

            // Get task number and title
            const taskPosition = taskClone.getAttribute('data-position')
            const taskTitle = taskClone.querySelector('.panel-title, .list-group-item-heading')?.textContent?.trim() || ''

            const container = document.createElement('div')

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
                  cleanTask.appendChild(handleCodeElement(node))
                } else {
                  cleanTask.appendChild(node.cloneNode(true))
                }
              })
              container.appendChild(cleanTask)
            }

            // Add spacing between tasks
            container.appendChild(document.createElement('br'))

            return container
          }

          const container = document.createElement('div')

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

          // Get all task elements
          const tasks = document.querySelectorAll('[data-role^="task"]')
          tasks.forEach(task => {
            container.appendChild(extractTaskContent(task))
          })

          return container.innerHTML
        },
      })

      const html = result[0].result
      markdownContent = turndownService.turndown(html)
      markdownContent = cleanupMarkdown(markdownContent)

      resultActions.style.display = 'block'
      updateStatus('Content converted successfully!', 'success')
    } catch (error) {
      updateStatus('Error scanning page: ' + error.message, 'error')
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
      updateStatus('File saved as README.md', 'success')
    } catch (error) {
      updateStatus('Error saving file: ' + error.message, 'error')
    }
  })

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(markdownContent)
      updateStatus('Content copied to clipboard!', 'success')
    } catch (error) {
      updateStatus('Error copying to clipboard: ' + error.message, 'error')
    }
  })
})
