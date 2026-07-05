import os
import glob
import re

def fix_html_button(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()
    
    old_btn = '<button type="submit" class="btn btn-primary btn-premium-metallic">Confirmar Marcação</button>'
    new_btn = '<button type="submit" id="btn-submit-booking" class="btn btn-primary btn-premium-metallic">Confirmar Marcação</button>'
    
    if old_btn in content:
        content = content.replace(old_btn, new_btn)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed button in {filepath}")

def fix_auth_js(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()
        
    old_code = """        await setDoc(bookingDocRef, {
            uid: user.uid,
            name: realName,
            email: user.email,
            bookings: existingBookings
        }, { merge: true });"""
        
    new_code = """        const safePayload = JSON.parse(JSON.stringify({
            uid: user.uid,
            name: realName || "Utilizador",
            email: user.email || "",
            bookings: existingBookings
        }));
        await setDoc(bookingDocRef, safePayload, { merge: true });"""
        
    if old_code in content:
        content = content.replace(old_code, new_code)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed setDoc in {filepath}")

fix_html_button('perfil.html')
fix_html_button('en/perfil.html')
fix_auth_js('js/auth.js')
fix_auth_js('en/js/auth.js')

