import os
import glob
import shutil

BASE_DIR = "/Users/danielalonzzo/Library/Mobile Documents/com~apple~CloudDocs/Elysium λ/Paulo Morais/pmorais"

# 1. Rename images
img_dir = os.path.join(BASE_DIR, "images")
img_main_old = os.path.join(img_dir, "O-EXERCiCIO-FiSICO-PODE-FAZER-A-DIFERENcA-NA ONCOLoGIA.JPG")
img_main_new = os.path.join(img_dir, "oncologia-main.jpg")

img_scroll_old = os.path.join(img_dir, "ATIVIDADE-FiSICA-E-CANCRO.JPG")
img_scroll_new = os.path.join(img_dir, "oncologia-scroll.jpg")

if os.path.exists(img_main_old):
    os.rename(img_main_old, img_main_new)
if os.path.exists(img_scroll_old):
    os.rename(img_scroll_old, img_scroll_new)

# Update HTML files with new image names
for html_file in [os.path.join(BASE_DIR, "index.html"), os.path.join(BASE_DIR, "en/index.html")]:
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Also fix any bad preload links in en/index.html
        if 'en/index.html' in html_file:
            content = content.replace('href="css/style.css', 'href="../css/style.css')
            
        content = content.replace('O-EXERCiCIO-FiSICO-PODE-FAZER-A-DIFERENcA-NA%20ONCOLoGIA.JPG', 'oncologia-main.jpg')
        content = content.replace('ATIVIDADE-FiSICA-E-CANCRO.JPG', 'oncologia-scroll.jpg')
        content = content.replace('O-EXERCiCIO-FiSICO-PODE-FAZER-A-DIFERENcA-NA ONCOLoGIA.JPG', 'oncologia-main.jpg')
        content = content.replace('ATIVIDADE-FiSICA-E-CANCRO.JPG', 'oncologia-scroll.jpg')
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)

# 2. Add Blog to English nav menus
en_dir = os.path.join(BASE_DIR, "en")
html_files = glob.glob(os.path.join(en_dir, "*.html"))

for html_file in html_files:
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if we need to add the blog menu item
    if 'href="blog.html"' not in content and '<li><a href="perfil.html?booking=true" class="btn-header-premium"' in content:
        # Add before the booking button
        content = content.replace(
            '<li><a href="perfil.html?booking=true" class="btn-header-premium"',
            '<li><a href="blog.html">Blog</a></li>\n                    <li><a href="perfil.html?booking=true" class="btn-header-premium"'
        )
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)

# 3. Create en/blog.html and en/artigo.html
for file_name in ['blog.html', 'artigo.html']:
    src = os.path.join(BASE_DIR, file_name)
    dst = os.path.join(en_dir, file_name)
    if os.path.exists(src) and not os.path.exists(dst):
        with open(src, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Basic translations for the English files
        # Update CSS/JS paths
        content = content.replace('href="css/', 'href="../css/')
        content = content.replace('src="js/', 'src="../js/')
        content = content.replace('href="images/', 'href="../images/')
        content = content.replace('src="images/', 'src="../images/')
        
        # Basic UI translations
        content = content.replace('data-i18n="nav.home">Início<', 'data-i18n="nav.home">Home<')
        content = content.replace('data-i18n="nav.about">Sobre Mim<', 'data-i18n="nav.about">About Me<')
        content = content.replace('data-i18n="nav.profile">Perfil<', 'data-i18n="nav.profile">Profile<')
        content = content.replace('>Osteopatia<', '>Osteopathy<')
        content = content.replace('data-i18n="nav.book">AGENDAR<', 'data-i18n="nav.book">BOOK NOW<')
        
        content = content.replace('Ler mais', 'Read more')
        content = content.replace('Categoria:', 'Category:')
        content = content.replace('Publicado em', 'Published on')
        content = content.replace('Partilhar:', 'Share:')
        content = content.replace('Voltar para o Blog', 'Back to Blog')
        content = content.replace('Artigos Recentes', 'Recent Articles')
        content = content.replace('O nosso blog', 'Our blog')
        content = content.replace('Pesquisar artigos...', 'Search articles...')
        
        # Link translations for internal navigation
        content = content.replace('href="index.html"', 'href="index.html"')
        
        # Nav adjustment, ensure active state on blog
        if file_name == 'blog.html':
            if 'class="active" data-i18n="nav.blog">Blog</a>' not in content:
                content = content.replace('data-i18n="nav.blog">Blog</a>', 'class="active" data-i18n="nav.blog">Blog</a>')
                
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(content)

print("Done updates.")
