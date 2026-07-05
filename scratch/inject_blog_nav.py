import os
import glob
import re

BASE_DIR = "/Users/danielalonzzo/Library/Mobile Documents/com~apple~CloudDocs/Elysium λ/Paulo Morais/pmorais/en"

html_files = glob.glob(os.path.join(BASE_DIR, "*.html"))

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'href="blog.html"' not in content:
        # We need to inject the Blog link in the nav menu and the footer.
        
        # 1. Nav Menu Injection
        # Find the last li in the nav menu
        nav_pattern = r'(<nav class="nav-menu">.*?)<ul>(.*?)</ul>'
        match = re.search(nav_pattern, content, re.DOTALL)
        if match:
            ul_content = match.group(2)
            # if booking button exists, we would have matched earlier, but let's check
            if 'perfil.html?booking=true' in ul_content:
                # Add before booking button
                new_ul = ul_content.replace(
                    '<li><a href="perfil.html?booking=true"',
                    '<li><a href="blog.html">Blog</a></li>\n                    <li><a href="perfil.html?booking=true"'
                )
            else:
                # Add at the end
                # find the last </li>
                last_li_pos = ul_content.rfind('</li>')
                if last_li_pos != -1:
                    new_ul = ul_content[:last_li_pos+5] + '\n                    <li><a href="blog.html">Blog</a></li>' + ul_content[last_li_pos+5:]
                else:
                    new_ul = ul_content
                    
            content = content.replace(ul_content, new_ul)
            
        # 2. Footer Injection
        footer_pattern = r'(<ul class="footer-links-list">.*?<li><a href="osteopatia.html".*?</a></li>)'
        match = re.search(footer_pattern, content, re.IGNORECASE | re.DOTALL)
        if match:
            matched_str = match.group(1)
            new_footer = matched_str + '\n                    <li><a href="blog.html">Blog</a></li>'
            content = content.replace(matched_str, new_footer)
            
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Navigation injected.")
