import os
import glob

# Files in en/ directory
files = glob.glob('en/*.html')

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update relative paths
    content = content.replace('href="css/', 'href="../css/')
    content = content.replace('src="js/', 'src="../js/')
    content = content.replace('src="images/', 'src="../images/')
    content = content.replace('href="images/', 'href="../images/')
    
    # Update lang attribute
    content = content.replace('<html lang="pt">', '<html lang="en-GB">')
    
    # There might be some other occurrences like background-image in inline styles,
    # but looking at the project, mostly src/href are used.
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Paths and lang updated.")
