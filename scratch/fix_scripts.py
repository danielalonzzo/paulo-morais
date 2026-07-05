import os

def fix_script(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
    with open(filepath, 'r') as f:
        content = f.read()
    
    old_code = """            } else if (targetLang === 'en' && !isEnPage) {
                localStorage.setItem('pm_lang_pref', 'en');
                // Insert /en/ before the file name or at the end
                let pathParts = currentPath.split('/');
                let lastPart = pathParts.pop();
                let newPath;
                if (!lastPart.includes('.html')) {
                    newPath = currentPath.endsWith('/') ? currentPath + 'en/' : currentPath + '/en/';
                } else {
                    newPath = pathParts.join('/') + '/en/' + lastPart;
                }
                window.location.href = newPath + window.location.search + window.location.hash;
            }"""
            
    new_code = """            } else if (targetLang === 'en' && !isEnPage) {
                localStorage.setItem('pm_lang_pref', 'en');
                let newPath;
                if (currentPath === '/' || currentPath === '') {
                    newPath = '/en/';
                } else {
                    newPath = '/en' + currentPath;
                }
                window.location.href = newPath + window.location.search + window.location.hash;
            }"""
            
    if old_code in content:
        content = content.replace(old_code, new_code)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
    else:
        print(f"Code not found in {filepath}")

fix_script('js/script.js')
fix_script('en/js/script.js')

