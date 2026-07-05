import os
from bs4 import BeautifulSoup

def check_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
        
    print(f"Checking {path}")
    for a in soup.find_all('a'):
        href = a.get('href')
        text = a.get_text(strip=True)
        aria_label = a.get('aria-label')
        title = a.get('title')
        
        # Check if crawlable
        if not href or href.startswith('javascript:'):
            print(f"  Uncrawlable: {a}")
            
        # Check descriptive text
        if not text and not aria_label and not title:
            # Maybe it has an img with alt?
            img = a.find('img')
            if not img or not img.get('alt'):
                print(f"  No descriptive text: {a}")

for root, _, files in os.walk('.'):
    for file in files:
        if file.endswith('.html') and 'node_modules' not in root:
            check_file(os.path.join(root, file))
