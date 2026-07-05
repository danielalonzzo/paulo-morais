import os
import glob
import re

images_to_replace = [
    ('images/logo/logo_bw_loading.png', 'images/logo/logo_bw_loading.webp'),
    ('images/sobre-mim/paulo-morais.png', 'images/sobre-mim/paulo-morais.webp'),
    ('images/sobre-mim/o-paulo-1.jpg', 'images/sobre-mim/o-paulo-1.webp'),
    ('images/sobre-mim/o-paulo-2.jpg', 'images/sobre-mim/o-paulo-2.webp'),
    ('images/sobre-mim/o-paulo-3.jpg', 'images/sobre-mim/o-paulo-3.webp'),
    ('images/sobre-mim/o-paulo-4.jpg', 'images/sobre-mim/o-paulo-4.webp'),
    ('images/osteopatia/ipad-model.png', 'images/osteopatia/ipad-model.webp'),
    ('../images/logo/logo_bw_loading.png', '../images/logo/logo_bw_loading.webp'),
    ('../images/sobre-mim/paulo-morais.png', '../images/sobre-mim/paulo-morais.webp'),
    ('../images/sobre-mim/o-paulo-1.jpg', '../images/sobre-mim/o-paulo-1.webp'),
    ('../images/sobre-mim/o-paulo-2.jpg', '../images/sobre-mim/o-paulo-2.webp'),
    ('../images/sobre-mim/o-paulo-3.jpg', '../images/sobre-mim/o-paulo-3.webp'),
    ('../images/sobre-mim/o-paulo-4.jpg', '../images/sobre-mim/o-paulo-4.webp'),
    ('../images/osteopatia/ipad-model.png', '../images/osteopatia/ipad-model.webp')
]

html_files = glob.glob('**/*.html', recursive=True)

count = 0
for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = content
    for img_src, webp_src in images_to_replace:
        # Regex to find <img ... src="img_src" ...>
        # We need to capture the whole tag to wrap it.
        # But we must avoid wrapping it twice if we run it multiple times.
        # We'll use a negative lookbehind or just check if it's already inside a <picture>
        
        # Simple string replacement logic:
        # 1. Find all occurrences of <img ... src="img_src" ...>
        pattern = r'<img([^>]+src=[\'"]' + re.escape(img_src) + r'[\'"][^>]*)>'
        
        def replace_img(match):
            img_tag = match.group(0)
            # If the img_tag is already preceded by <source srcset="...webp", skip it
            return f'<picture>\n    <source srcset="{webp_src}" type="image/webp">\n    {img_tag}\n</picture>'
        
        # Check if already wrapped to prevent double wrapping
        if f'srcset="{webp_src}"' not in new_content:
            new_content = re.sub(pattern, replace_img, new_content)

    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += 1

print(f"Updated {count} files with <picture> tags.")
