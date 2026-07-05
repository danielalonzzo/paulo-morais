import os
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    pt_text = '<div class="crafted-text"><a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">Desenvolvido por Elysium λ Development & Research.</a></div>'
    pt_new = '<div class="crafted-text"><a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">Desenvolvido por Elysium λ Development & Research.</a><br><span style="font-size: 0.8rem; opacity: 0.7; color: #a0a0a0;">v1.2.0</span></div>'
    
    en_text = '<div class="crafted-text"><a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">Developed by Elysium λ Development & Research.</a></div>'
    en_new = '<div class="crafted-text"><a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">Developed by Elysium λ Development & Research.</a><br><span style="font-size: 0.8rem; opacity: 0.7; color: #a0a0a0;">v1.2.0</span></div>'

    updated = False
    if pt_text in content:
        content = content.replace(pt_text, pt_new)
        updated = True
        
    if en_text in content:
        content = content.replace(en_text, en_new)
        updated = True
        
    if updated:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

# Find all html files
for file in glob.glob("**/*.html", recursive=True):
    if "scratch/" not in file:
        process_file(file)

