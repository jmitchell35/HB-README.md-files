export const cleanupMarkdown = markdown => {
  return markdown
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
}

export const unwantedSelectors = [
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

export const handleCodeElement = element => {
  const wrapper = document.createElement('div')
  wrapper.className = 'code-wrapper'
  const clone = element.cloneNode(true)
  clone.textContent = element.value || element.textContent
  wrapper.appendChild(clone)
  return wrapper
}
