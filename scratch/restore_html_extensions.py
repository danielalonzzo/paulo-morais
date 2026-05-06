import os
import re

files_to_process = [
    "index.html",
    "sobre-mim.html",
    "perfil.html",
    "osteopatia.html",
    "politica-privacidade.html",
    "termos-e-condicoes.html",
    "formulario.html",
    "perfis.html",
    "historico.html",
    "js/auth.js",
    "js/script.js",
    "js/admin-perfis.js",
    "js/admin-historico.js",
    "js/admin-formularios.js"
]

base_path = "/Users/danielalonzzo/Library/Mobile Documents/com~apple~CloudDocs/Elysium λ/Paulo Morais/paulo-morais"

# Mapping of what to put back
replacements = {
    r'sobre-mim': 'sobre-mim.html',
    r'perfil': 'perfil.html',
    r'osteopatia': 'osteopatia.html',
    r'politica-privacidade': 'politica-privacidade.html',
    r'termos-e-condicoes': 'termos-e-condicoes.html',
    r'formulario': 'formulario.html',
    r'perfis': 'perfis.html',
    r'historico': 'historico.html'
}

for filename in files_to_process:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content
    
    # Fix the root link
    new_content = new_content.replace('href="/"', 'href="index.html"')
    
    for pattern, replacement in replacements.items():
        # Avoid double .html if it somehow happened
        # Replace only if followed by ", ', ?, or # and NOT followed by .html
        new_content = re.sub(pattern + r'(?=["\'?#])(?!\.html)', replacement, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Restored {filename}")
    else:
        print(f"No changes for {filename}")
