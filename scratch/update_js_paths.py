import os
import glob
import re

files = glob.glob('en/*.html')
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the JS paths
    content = content.replace('src="../js/', 'src="js/')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated HTML to use local JS in en/js/")
