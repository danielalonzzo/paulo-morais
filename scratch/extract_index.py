import re
from bs4 import BeautifulSoup

def extract_text(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    soup = BeautifulSoup(html, 'html.parser')
    texts = set()
    for text in soup.stripped_strings:
        if len(text) > 2 and not re.match(r'^[\W_]+$', text):
            texts.add(text)
    return texts

texts = extract_text('en/index.html')
for t in sorted(list(texts)):
    print(t)
