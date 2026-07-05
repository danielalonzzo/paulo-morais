import os
import glob
import re

BASE_DIR = "/Users/danielalonzzo/Library/Mobile Documents/com~apple~CloudDocs/Elysium λ/Paulo Morais/pmorais"

def update_files_in_dir(directory, is_en):
    html_files = glob.glob(os.path.join(directory, "*.html"))
    
    for file in html_files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 1. Update Version V1.5.0 to V1.5.1
        content = re.sub(r'V1\.5\.0', 'V1.5.1', content)
        
        # Also, check if they don't have a version at all but have the crafted-text link
        crafted_text_pattern = r'(<div class="crafted-text"><a href="https://elysiumdr.eu"[^>]*>.*?</a>)</div>'
        if 'V1.5.1' not in content:
            # Inject version span if missing
            replacement = r'\1<br><span style="font-size: 0.8rem; opacity: 0.7; color: #a0a0a0;">V1.5.1</span></div>'
            content = re.sub(crafted_text_pattern, replacement, content)
            
        # Update V1.5.0 in style link if it exists
        content = content.replace('v=202607011112', 'v=1.5.1') # Update cache busting for CSS just in case
        
        # 2. Fix logo loading page paths
        if is_en:
            # en directory files
            # srcset should have ../
            content = content.replace('srcset="images/logo/', 'srcset="../images/logo/')
            # mask-image should have ../ (it already does, but let's be sure)
            content = content.replace('mask-image: url(\'images/logo/', 'mask-image: url(\'../images/logo/')
            content = content.replace('mask-image: url("images/logo/', 'mask-image: url("../images/logo/')
        else:
            # Root directory files
            # mask-image should NOT have ../
            content = content.replace('url(\'../images/logo/logo_bw_loading.png\')', 'url(\'images/logo/logo_bw_loading.png\')')
            content = content.replace('url("../images/logo/logo_bw_loading.png")', 'url("images/logo/logo_bw_loading.png")')
            
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)

# Update root
update_files_in_dir(BASE_DIR, is_en=False)
# Update en
update_files_in_dir(os.path.join(BASE_DIR, "en"), is_en=True)

print("Updates completed: Version V1.5.1 and Preloader fixes.")
