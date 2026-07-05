import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

count = 0
for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Add nonce to <script ...> and <style ...> if not present
    # We will match <script> and <script ...> 
    # Same for <style>
    
    def add_nonce(match):
        tag = match.group(0)
        if 'nonce=' in tag:
            return tag
        
        # Insert nonce after the tag name
        if tag.startswith('<script'):
            return tag.replace('<script', '<script nonce="pmorais-2026"', 1)
        elif tag.startswith('<style'):
            return tag.replace('<style', '<style nonce="pmorais-2026"', 1)
        return tag

    new_content = re.sub(r'<(script|style)[^>]*>', add_nonce, content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += 1

print(f"Added nonce to {count} HTML files.")
