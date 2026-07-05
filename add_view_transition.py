import glob
import re

html_files = glob.glob('**/*.html', recursive=True)
count = 0

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '<meta name="view-transition"' not in content:
        # Insert after <head>
        new_content = re.sub(r'(<head[^>]*>)', r'\1\n    <meta name="view-transition" content="same-origin" />', content, count=1)
        
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            count += 1

print(f"Added view-transition meta tag to {count} HTML files.")
