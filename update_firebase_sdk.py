import os
import glob

files = glob.glob('**/*.html', recursive=True) + glob.glob('**/*.js', recursive=True)

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '10.7.1' in content:
        new_content = content.replace('10.7.1', '10.8.0')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += 1

print(f"Updated {count} files to use Firebase SDK 10.8.0")
