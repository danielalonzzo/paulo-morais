import re
import unicodedata

def normalize(path):
    path = unicodedata.normalize('NFKD', path).encode('ASCII', 'ignore').decode('utf-8')
    return re.sub(r'[^a-zA-Z0-9.]', '', path.lower())

content = '  <img src="Images/Sobre Mim/O Paulo 1.jpg" alt="O Paulo 1"> '
print("content:", content)

def repl(m):
    full_match = m.group(0)
    path_in = m.group(1)
    
    idx = path_in.find("Images/")
    if idx == -1: return full_match
    
    core_path = path_in[idx:]
    norm_core = normalize(core_path)
    
    print("Match:", full_match)
    print("path_in:", path_in)
    print("norm_core:", norm_core)
    return full_match

new_content = re.sub(r'["\']([^"\']*Images/[^"\']+)["\']', repl, content)
