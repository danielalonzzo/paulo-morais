import glob

# Case sensitive replacements to avoid messing up variables/IDs like "osteopatia" (lowercase)
replacements = {
    'AS SUAS PRÓXIMAS SESSÕES': 'YOUR UPCOMING SESSIONS',
    'As Suas Próximas Sessões': 'Your Upcoming Sessions',
    'Sem sessões agendadas para breve.': 'No sessions scheduled soon.',
    'QUE TIPO DE SERVIÇO PROCURA HOJE?': 'WHAT TYPE OF SERVICE ARE YOU LOOKING FOR TODAY?',
    'Que tipo de serviço procura hoje?': 'What type of service are you looking for today?',
    'OSTEOPATIA': 'OSTEOPATHY',
    '>Osteopatia<': '>Osteopathy<',
    "'Osteopatia'": "'Osteopathy'",
    '"Osteopatia"': '"Osteopathy"',
    'Tratamento clínico e reabilitação física.': 'Clinical treatment and physical rehabilitation.',
    'TREINO': 'TRAINING',
    '>Treino<': '>Training<',
    "'Treino'": "'Training'",
    '"Treino"': '"Training"',
    'Condicionamento, força e saúde preventiva.': 'Conditioning, strength, and preventive health.',
    'SELECIONE A DATA E HORA': 'SELECT THE DATE AND TIME',
    'Selecione a Data e Hora': 'Select the Date and Time',
    'OLÁ,': 'HELLO,',
    'Olá,': 'Hello,',
    'Olá!': 'Hello!',
    'PRÓXIMOS CLIENTES': 'UPCOMING CLIENTS',
    'Próximos Clientes': 'Upcoming Clients',
    'GESTÃO DA AGENDA': 'AGENDA MANAGEMENT',
    'Gestão da Agenda': 'Agenda Management',
    '>Perfis<': '>Profiles<',
    "'Perfis'": "'Profiles'",
    '"Perfis"': '"Profiles"',
    '>Formulários<': '>Forms<',
    "'Formulários'": "'Forms'",
    '"Formulários"': '"Forms"',
    '>Terminar Sessão<': '>Log Out<',
    "'Terminar Sessão'": "'Log Out'",
    '"Terminar Sessão"': '"Log Out"',
    '>Editar Perfil<': '>Edit Profile<',
    "'Editar Perfil'": "'Edit Profile'",
    '"Editar Perfil"': '"Edit Profile"',
    '>Histórico<': '>History<',
    "'Histórico'": "'History'",
    '"Histórico"': '"History"',
    'Resumo da Agenda': 'Agenda Summary',
    'A carregar dados...': 'Loading data...',
    'Voltar ao Lobby': 'Back to Lobby',
    'Voltar': 'Back',
    'Continuar': 'Continue',
    'Confirme a Reserva': 'Confirm Booking',
    'Notas adicionais (Opcional)': 'Additional notes (Optional)',
    'Confirmar Marcação': 'Confirm Booking',
    'Marcação Confirmada!': 'Booking Confirmed!',
    'Adicionámos esta sessão ao teu History.': 'We added this session to your History.',
    'Agenda Global': 'Global Agenda',
    'O seu Perfil de Saúde': 'Your Health Profile',
    'Data de Nascimento': 'Date of Birth',
    'Telemóvel': 'Phone',
    'Peso (kg)': 'Weight (kg)',
    'Altura (cm)': 'Height (cm)',
    'Massa Gorda (%)': 'Body Fat (%)',
    'Massa Muscular (kg)': 'Muscle Mass (kg)',
    'Problemas de Saúde': 'Health Issues',
    'Limitações físicas': 'Physical Limitations',
    'Selecionar...': 'Select...',
    '>Não<': '>No<',
    '>Sim<': '>Yes<',
    'Guardar Alterações': 'Save Changes',
    'Cancelar': 'Cancel',
    'Desativar Conta': 'Deactivate Account',
    'Saltar': 'Skip',
    'Seguinte': 'Next',
    'Fechar': 'Close',
    'Passo 1': 'Step 1',
    'Passo 2': 'Step 2',
    'Passo 3': 'Step 3',
    'Passo 4': 'Step 4',
    'Passo 5': 'Step 5',
    'Painel': 'Dashboard',
    'Gerir as suas Reservas': 'Manage your Bookings',
    'O Paulo é notificado automaticamente sobre todas as marcações e cancelamentos.': 'Paulo is automatically notified about all bookings and cancellations.'
}

def replace_in_files(file_pattern):
    files = glob.glob(file_pattern)
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for pt, en in replacements.items():
            content = content.replace(pt, en)
            
        # specifically fix "OLÁ, " due to JS interpolation which might be uppercase CSS, but text is "Olá, "
        # the CSS uppercase is "text-transform: uppercase" usually, or it's JS .toUpperCase()
        # "Olá, ${name}" was translated, but maybe we need "HELLO, " in case of uppercase.
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")

replace_in_files('en/*.html')
replace_in_files('en/js/*.js')

print("Remaining translations applied.")
