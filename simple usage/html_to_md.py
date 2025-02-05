from bs4 import BeautifulSoup # type: ignore
import re
"""This program was built to make quick, easy README.md files.
Just inspect the page of the project, copy the 'project row container-max'
element, and paste it to a file of your choice.

DO NOT FORGET TO ADJUST THE FILEPATH USED IN THIS PROGRAM

Returns:
    `_type_`: _description_
"""

class HtmlToMarkdown:
    def __init__(self):
        self.list_depth = 0
    
    def convert(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        return self.process_node(soup).strip()
    
    def process_node(self, node):
        if node.name is None:
            return node.string or ''
        
        content = ''.join(self.process_node(child) for child in node.children)
        
        handlers = {
            'h1': lambda x: f'\n# {x}\n\n',
            'h2': lambda x: f'\n## {x}\n\n',
            'h3': lambda x: f'\n### {x}\n\n',
            'h4': lambda x: f'\n#### {x}\n\n',
            'h5': lambda x: f'\n##### {x}\n\n',
            'h6': lambda x: f'\n###### {x}\n\n',
            'p': lambda x: f'\n{x}\n\n',
            'strong': lambda x: f'**{x}**',
            'b': lambda x: f'**{x}**',
            'em': lambda x: f'*{x}*',
            'i': lambda x: f'*{x}*',
            'code': lambda x: f'`{x}`',
            'pre': lambda x: f'\n```\n{x}\n```\n\n',
            'blockquote': lambda x: f'\n> {x}\n\n',
            'hr': lambda x: '\n---\n\n',
            'br': lambda x: '\n',
        }
        
        if node.name in handlers:
            return handlers[node.name](content)
        
        if node.name == 'a':
            href = node.get('href', '')
            return f'[{content}]({href})'
        
        if node.name == 'img':
            src = node.get('src', '')
            alt = node.get('alt', '')
            return f'![{alt}]({src})'
        
        if node.name in ('ul', 'ol'):
            self.list_depth += 1
            marker = '1.' if node.name == 'ol' else '*'
            result = self.process_list(node, marker)
            self.list_depth -= 1
            return result
        
        if node.name == 'table':
            return self.process_table(node)
        
        return content
    
    def process_list(self, node, marker):
        result = '\n'
        for item in node.find_all('li', recursive=False):
            indent = '  ' * (self.list_depth - 1)
            item_content = self.process_node(item).strip()
            result += f'{indent}{marker} {item_content}\n'
        return result + '\n'
    
    def process_table(self, table):
        result = '\n'
        rows = table.find_all('tr')
        
        if not rows:
            return result
        
        # Process header
        header_cells = rows[0].find_all(['th', 'td'])
        header = ' | '.join(self.process_node(cell).strip() 
                            for cell in header_cells)
        result += f'| {header} |\n'
        
        # Add separator
        separator = ' | '.join(['---'] * len(header_cells))
        result += f'| {separator} |\n'
        
        # Process body
        for row in rows[1:]:
            cells = row.find_all('td')
            row_content = ' | '.join(self.process_node(cell).strip() 
                                     for cell in cells)
            result += f'| {row_content} |\n'
        
        return result + '\n'

def replace_between_markers(markdown_string, patterns):
    """
    Replace content between markers in a file, handling both literal and regex 
    patterns. Also escapes tilde characters for markdown.
    """
    try:
        # Handle regex patterns
        for pattern, replacement in patterns:
            markdown_string = re.sub(
                pattern, replacement, markdown_string, flags=re.DOTALL)
        
        # Clean up any remaining whitespace
        markdown_string = re.sub(r'\n{3,}', '\n\n', markdown_string)
   
        return markdown_string
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

patterns = [
    (r"(\!\[Project badge\].*?\n)", ""),  # project picture
    (r"(\# .*?\n).*?(\#\# Requirements)", r"\1\2"),  # conceptor
    (r"(\*\*Great!\*\*).*?(\#\# Tasks)", r"\2"),  # Quiz completion
    (r"(\#\#\# )\s*(\d{1,2}\. .*?)", r"\1\2"),  # Extra whitespaces in task
    (r"(\n Task URLs).*?(?=(?<!\#)\#\#\# \d{1,2}\.)", r""),  # End of tasks
    (r"\[Tips\].*?\n", r""),  # Tips with broken urls
    (r"```\n`(.*?)`\n```", r"```\n\1\n```"),  # Extra backticks
    (r"(\#\#\# \d+\. .*?)\s+mandatory.*?Task Body\s+", r"\1\n"),  # Task info
    (r"(\#\#\# \d+\. .*?)\s+\#advanced.*?Task Body\s+", r"\1\n"),  # also
    (r"(\n Task URLs).*", r""),  # From end of last task to end of file
    (r"\(/rltoken.*?\)\n", r"")  # /rltoken = dead links
]

# Apply to file
if __name__ == '__main__':
    file_path = "C:\\Users\\julia\\Desktop\\readme.txt"
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            html_str = file.read()
    except Exception as e:
        print(f"An error occurred: {e}")
    
    converter = HtmlToMarkdown()
    markdown = converter.convert(html_str)
    
    markdown = replace_between_markers(markdown, patterns)
    try:
        if markdown != None:
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(markdown)
    except Exception as e:
        print(f"An error occurred: {e}")