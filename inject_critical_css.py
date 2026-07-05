import os
import glob
import re

def extract_css(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        css = f.read()

    def get_block(regex_pattern):
        # We need a robust brace matching for CSS blocks, but regex can work for simple ones
        # This regex matches `selector { ... }` assuming no nested braces except for @keyframes
        if '@keyframes' in regex_pattern:
            # Special case for @keyframes because it has nested braces
            # We assume it looks like `@keyframes name { from {...} to {...} }`
            match = re.search(regex_pattern + r'\s*\{[^{}]*\{[^{}]*\}[^{}]*\{[^{}]*\}[^{}]*\}', css)
            if not match:
                # simpler fallback
                match = re.search(regex_pattern + r'\s*\{(?:[^{}]*\{[^{}]*\}[^{}]*)*\}', css)
            return match.group(0) if match else ''
        else:
            match = re.search(regex_pattern + r'\s*\{[^}]*\}', css)
            return match.group(0) if match else ''

    root = get_block(r':root')
    body = get_block(r'body')
    preloader = get_block(r'#preloader')
    loader_content = get_block(r'\.loader-content')
    loader_logo = get_block(r'\.loader-logo')
    shimmer = get_block(r'\.shimmer-effect')
    # Use a simpler regex for keyframes shimmer
    shimmer_anim_match = re.search(r'@keyframes shimmer\s*\{[^}]*\{[^}]*\}[^}]*\{[^}]*\}[^}]*\}', css)
    shimmer_anim = shimmer_anim_match.group(0) if shimmer_anim_match else ''

    critical = '\n'.join(filter(None, [root, body, preloader, loader_content, loader_logo, shimmer, shimmer_anim]))
    return critical

critical_css = extract_css('css/style.css')
critical_css = f'<style id="critical-css">\n{critical_css}\n</style>'

html_files = glob.glob('**/*.html', recursive=True)

count = 0
for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '<style id="critical-css">' in content:
        continue # Already injected

    # Insert after <head>
    new_content = re.sub(r'(<head[^>]*>)', r'\1\n    ' + critical_css.replace('\n', '\n    '), content, count=1)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += 1

print(f"Injected critical CSS into {count} files.")
