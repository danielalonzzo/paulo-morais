import os
import re
import unicodedata

def normalize(path):
    # Normalize unicode characters
    path = unicodedata.normalize('NFKD', path).encode('ASCII', 'ignore').decode('utf-8')
    # Convert to lower case and remove non-alphanumeric chars
    return re.sub(r'[^a-z0-9.]', '', path.lower())

image_dir = "Images"
actual_images = {}
for root, dirs, files in os.walk(image_dir):
    for f in files:
        if f == ".DS_Store": continue
        full_path = os.path.join(root, f)
        # We need to normalize just the path part after Images/ or the whole thing
        # Let's normalize the whole path to avoid collisions
        actual_images[normalize(full_path)] = full_path

print(f"Found {len(actual_images)} actual images")

files_to_check = []
for f in os.listdir("."):
    if f.endswith(".html"):
        files_to_check.append(f)

for f in os.listdir("CSS"):
    if f.endswith(".css"):
        files_to_check.append(os.path.join("CSS", f))

for f in files_to_check:
    with open(f, 'r') as file:
        content = file.read()
    
    # We want to find references to Images/...
    # They can be in href="Images/...", src="Images/...", url('Images/...'), url("Images/..."), content=".../Images/..."
    # The simplest is to find the substring Images/ and extract until ", ', or )
    
    def replace_match(match):
        prefix = match.group(1) # quotes or whatever
        img_path = match.group(2)
        
        # In CSS, paths might be ../Images/...
        clean_img_path = img_path
        if "Images/" in clean_img_path:
            clean_img_path = "Images/" + clean_img_path.split("Images/")[1]
            
        norm_path = normalize(clean_img_path)
        
        if norm_path in actual_images:
            actual_path = actual_images[norm_path]
            # preserve original prefix like ../ if it was there
            if img_path.startswith("../"):
                new_path = "../" + actual_path
            elif "https://pmorais.pt/Images/" in img_path:
                new_path = "https://pmorais.pt/" + actual_path
            else:
                new_path = actual_path
                
            if new_path != img_path:
                print(f"Replacing {img_path} with {new_path} in {f}")
                return prefix + new_path
        else:
            print(f"NOT FOUND: {img_path} (normalized: {norm_path}) in {f}")
        return match.group(0)

    # find src="...", href="...", content="...", url('...'), url("...")
    # match quotes or parentheses
    new_content = re.sub(r'([\'"\(])((?:\.\./|https?://pmorais\.pt/)?Images/[^\'"\)]+)', replace_match, content)

    if new_content != content:
        with open(f, 'w') as file:
            file.write(new_content)

print("Done.")

