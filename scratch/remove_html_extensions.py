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

base_path = "/Users/danielalonzzo/Library/Mobile Documents/com~apple~CloudDocs/Elysium λ/Paulo Morais/pmorais"

for filename in files_to_process:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Fix the mistake from previous run (index.html became "")
    # specifically for href="" or location.href = '' etc.
    new_content = content
    new_content = re.sub(r'href=["\']["\']', 'href="/"', new_content)
    
    # Standard replacements (in case some were missed or for fresh files)
    replacements = {
        r'index\.html': '/',
        r'sobre-mim\.html': 'sobre-mim',
        r'perfil\.html': 'perfil',
        r'osteopatia\.html': 'osteopatia',
        r'politica-privacidade\.html': 'politica-privacidade',
        r'termos-e-condicoes\.html': 'termos-e-condicoes',
        r'formulario\.html': 'formulario',
        r'perfis\.html': 'perfis',
        r'historico\.html': 'historico'
    }
    
    for pattern, replacement in replacements.items():
        new_content = re.sub(pattern + r'(?=["\'?#])', replacement, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filename}")
    else:
        print(f"No changes for {filename}")
