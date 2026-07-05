import os
import glob

workspace_dir = "/Users/danielalonzzo/Library/Mobile Documents/com~apple~CloudDocs/Elysium λ/Paulo Morais/pmorais"

def process_file(filepath, is_en):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if file doesn't have footer-links-list
    if 'footer-links-list' not in content:
        return
        
    # Check if it already has the exact proper switcher
    # To keep it simple, let's remove any existing footer-lang-switcher block inside the ul
    import re
    # Find the ul class="footer-links-list" that contains Termos e Condições or Terms and Conditions
    
    # We will replace the closing </ul> of the block that contains Termos e Condições
    # but first let's strip existing footer-lang-switcher blocks
    content = re.sub(r'<li>\s*<div class="footer-lang-switcher">.*?</div>\s*</li>', '', content, flags=re.DOTALL)
    
    # Now we find where Terms and Conditions / Termos e Condições is and add the lang switcher right after it
    if is_en:
        search_str = '<li><a href="termos-e-condicoes.html">Terms and Conditions</a></li>'
        switcher = '''<li>
                        <div class="footer-lang-switcher">
                            <a href="/" title="Português">PT</a>
                            <span class="lang-divider">|</span>
                            <a href="/en/" class="active" title="English">EN</a>
                        </div>
                    </li>'''
    else:
        search_str = '<li><a href="termos-e-condicoes.html">Termos e Condições</a></li>'
        switcher = '''<li>
                        <div class="footer-lang-switcher">
                            <a href="/" class="active" title="Português">PT</a>
                            <span class="lang-divider">|</span>
                            <a href="/en/" title="English">EN</a>
                        </div>
                    </li>'''
    
    if search_str in content:
        # Avoid double inserting
        if 'footer-lang-switcher' not in content:
            replacement = search_str + '\n                    ' + switcher
            content = content.replace(search_str, replacement)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
    else:
        print(f"Could not find terms link in: {filepath}")

# Process PT files
pt_files = glob.glob(os.path.join(workspace_dir, "*.html"))
for f in pt_files:
    process_file(f, is_en=False)

# Process EN files
en_files = glob.glob(os.path.join(workspace_dir, "en", "*.html"))
for f in en_files:
    process_file(f, is_en=True)
