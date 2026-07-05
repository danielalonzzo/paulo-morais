import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace v1.4.0 with v1.4.1 in footer
    new_content = re.sub(r'(class="crafted-text".*?)v1\.4\.0', r'\g<1>v1.4.1', content, flags=re.DOTALL)
    
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for file in glob.glob("**/*.html", recursive=True):
    if "scratch/" not in file and "functions/" not in file and "node_modules/" not in file:
        process_file(file)
