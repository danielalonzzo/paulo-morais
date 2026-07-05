import os
import re

def fix_html_seo(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # 1. Fix href="javascript:void(0)" for lang-toggle and theme-toggle
    # We will just change them to <button type="button" ...> and </button>
    content = re.sub(
        r'<a href="javascript:void\(0\)"([^>]*?class="[^"]*?lang-toggle[^"]*"[^>]*?)>', 
        r'<button type="button"\1>', 
        content
    )
    content = re.sub(
        r'<a href="javascript:void\(0\)"([^>]*?class="[^"]*?theme-toggle[^"]*"[^>]*?)>', 
        r'<button type="button"\1>', 
        content
    )
    
    # We need to replace the specific closing </a> for these toggles.
    # A simple regex won't know which </a> to replace. 
    # But since they just contain an <i> tag:
    # <a ...><i ...></i></a>
    # Let's replace the whole block using regex
    content = re.sub(
        r'<button type="button"([^>]*?lang-toggle[^>]*?)>\s*(<i[^>]*></i>|<svg[^>]*>.*?</svg>)\s*</a>',
        r'<button type="button"\1>\n                \2\n            </button>',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'<button type="button"([^>]*?theme-toggle[^>]*?)>\s*(<i[^>]*></i>|<svg[^>]*>.*?</svg>)\s*</a>',
        r'<button type="button"\1>\n                \2\n            </button>',
        content,
        flags=re.DOTALL
    )

    # 2. Add aria-label to ig-feed-item
    content = re.sub(
        r'(<a[^>]*?class="[^"]*?ig-feed-item[^"]*"[^>]*?)>',
        lambda m: m.group(1) + ' aria-label="Instagram Post">' if 'aria-label' not in m.group(1) else m.group(0),
        content
    )
    
    # 3. Add aria-label to fab-action-btn whatsapp
    content = re.sub(
        r'(<a[^>]*?class="[^"]*?whatsapp[^"]*"[^>]*?)>',
        lambda m: m.group(1) + ' aria-label="WhatsApp">' if 'aria-label' not in m.group(1) else m.group(0),
        content
    )
    
    # 4. Add aria-label to fab-action-btn social-ig
    content = re.sub(
        r'(<a[^>]*?class="[^"]*?social-ig[^"]*"[^>]*?)>',
        lambda m: m.group(1) + ' aria-label="Instagram">' if 'aria-label' not in m.group(1) else m.group(0),
        content
    )
    
    # 5. Add aria-label to fab-action-btn email
    content = re.sub(
        r'(<a[^>]*?class="[^"]*?email[^"]*"[^>]*?)>',
        lambda m: m.group(1) + ' aria-label="Email">' if 'aria-label' not in m.group(1) else m.group(0),
        content
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root: continue
    for file in files:
        if file.endswith('.html'):
            fix_html_seo(os.path.join(root, file))
