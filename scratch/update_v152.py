import os
import glob

def update_version():
    files = glob.glob('**/*.html', recursive=True)
    count = 0
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'V1.5.1' in content:
            new_content = content.replace('V1.5.1', 'V1.5.2')
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f"Updated {file}")
            
    print(f"Total files updated: {count}")

if __name__ == '__main__':
    update_version()
