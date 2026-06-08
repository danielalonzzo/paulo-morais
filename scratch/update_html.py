import os
import re

html_files = [
    'index.html', 'osteopatia.html', 'perfil.html', 'sobre-mim.html',
    'auth-action.html', 'formulario.html', 'historico.html', 'perfis.html',
    'politica-privacidade.html', 'termos-e-condicoes.html', 'desinscrever.html'
]

lang_script = '<script src="js/lang.js"></script>'
lang_button = '''<a href="javascript:void(0)" id="lang-toggle" class="fab-action-btn lang-toggle" title="Mudar Idioma" onclick="event.preventDefault(); event.stopPropagation(); window.toggleLanguage();">
                <i data-lucide="globe"></i>
            </a>'''

for file in html_files:
    if not os.path.exists(file):
        continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Inject script in head
    if 'js/lang.js' not in content:
        # Insert before </head> or js/theme.js
        if '<script src="js/theme.js"></script>' in content:
            content = content.replace('<script src="js/theme.js"></script>', lang_script + '\n    <script src="js/theme.js"></script>')
        else:
            content = content.replace('</head>', '    ' + lang_script + '\n</head>')

    # Inject lang button in fab-options
    if 'id="lang-toggle"' not in content:
        # Find theme-toggle and insert before it
        # Try to find the exact theme-toggle block to insert before
        pattern = r'(<a[^>]*id="theme-toggle"[^>]*>.*?</a>)'
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, lang_button + '\n            \\1', content, flags=re.DOTALL)
        else:
            print(f"Could not find theme-toggle in {file}")

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file}")
