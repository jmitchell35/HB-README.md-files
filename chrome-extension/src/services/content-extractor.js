import { handleCodeElement, unwantedSelectors } from '../utils/content-processor.js'

export class ContentExtractor {
  static getSectionContent(heading) {
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

  static extractTaskContent(task) {
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

  static extractContent() {
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
        container.appendChild(this.getSectionContent(heading))
      } else if ((headingText.includes('learning objectives') || headingText.includes('learning objective')) && !foundObjectives) {
        foundObjectives = true
        container.appendChild(this.getSectionContent(heading))
      } else if (headingText.includes('requirements') && !foundRequirements) {
        foundRequirements = true
        container.appendChild(this.getSectionContent(heading))
      }
    })

    // Add Tasks section
    const tasksHeader = document.createElement('h2')
    tasksHeader.textContent = 'Tasks'
    container.appendChild(tasksHeader)

    // Get all task elements
    const tasks = document.querySelectorAll('[data-role^="task"]')
    tasks.forEach(task => {
      container.appendChild(this.extractTaskContent(task))
    })

    return container.innerHTML
  }
}
