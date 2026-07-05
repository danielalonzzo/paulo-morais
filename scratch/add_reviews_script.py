import os
import glob

def add_script(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if "js/reviews.js" in content:
        return

    # Find where to insert
    target = '<script src="js/script.js" defer></script>'
    new_script = '<script type="module" src="js/reviews.js" defer></script>\n    ' + target
    
    # Need to also call loadPublicReviews depending on the page
    # Actually, we can just call it inline or at the end of body
    service = 'osteopatia' if 'osteopatia' in filepath else 'treino'
    inline_call = f'''
    <script type="module">
        import './js/reviews.js';
        document.addEventListener('DOMContentLoaded', () => {{
            setTimeout(() => {{
                if (window.loadPublicReviews) window.loadPublicReviews('{service}');
            }}, 500);
        }});
    </script>
'''

    content = content.replace(target, new_script + inline_call)
    
    with open(filepath, 'w') as f:
        f.write(content)

for file in ["index.html", "osteopatia.html", "en/index.html", "en/osteopatia.html"]:
    add_script(file)
