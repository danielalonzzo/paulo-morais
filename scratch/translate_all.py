import os
import glob
import re

def normalize_whitespace(text):
    return r'\s+'.join(re.escape(word) for word in text.split())

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for pt, en in replacements.items():
        pattern = normalize_whitespace(pt)
        # re.IGNORECASE might be dangerous for some short words, but we'll use exact case
        # For those we know are uppercase in CSS but mixed in HTML, we will add both
        content = re.sub(pattern, en, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replacements = {
    # sobre-mim.html / index.html sentences
    'Descubra a paixão e a experience por trás do método Your Own Workout.': 'Discover the passion and experience behind the Your Own Workout method.',
    'Alívio de tensões e melhoria da mobilidade para uma vida sem limites.': 'Tension relief and improved mobility for a life without limits.',
    
    'O Paulo trabalha com pessoas de todas as idades e objetivos: melhorar postura, perder peso, recuperar cirurgias, preparar uma maratona ou simplesmente viver com mais energia. É um dos primeiros em Portugal a desenvolver treino para doentes oncológicos.': 'Paulo works with people of all ages and goals: improving posture, losing weight, recovering from surgery, preparing for a marathon, or simply living with more energy. He is one of the first in Portugal to develop training for oncology patients.',
    
    'Adora o mar, a família e a adrenalina de um novo desafio. Ama viajar, seja um trilho a pé, um passeio de jipe ou uma viagem de mota.': 'He loves the sea, his family, and the adrenaline of a new challenge. He loves to travel, whether it\'s hiking, a jeep tour, or a motorcycle trip.',
    
    '"O Paulo é uma pessoa de pessoas, sempre pronto para uma boa conversa."': '"Paulo is a people person, always ready for a good chat."',
    
    'Paulo Morais é técnico de osteopatia, mantendo o mindset de tratar cada cliente como único, com um acompanhamento integrado e personalizado. Além da atenção à patologia e faixa etária, tem o cuidado de cruzar com o estilo de vida de cada um, para que as sessões sejam eficazes.': 'Paulo Morais is an osteopathy technician, maintaining the mindset of treating each client as unique, with integrated and personalised follow-up. In addition to paying attention to pathology and age group, he is careful to align with each person\'s lifestyle, so that the sessions are effective.',
    
    'Paulo Morais é especialista em treino personalizado, com mais de 20 anos de experiência. Depois de um percurso profissional em ginásios, escolas, clubes desportivos e clínicas de fisioterapia, desenvolveu a sua metodologia única, num processo de um para um. Hoje, acompanha cada cliente com um plano exclusivo e adaptado às suas necessidades, patologias e estilo de vida.': 'Paulo Morais is a specialist in personal training, with over 20 years of experience. After a professional journey in gyms, schools, sports clubs, and physiotherapy clinics, he developed his unique methodology in a one-on-one process. Today, he guides each client with an exclusive plan tailored to their needs, pathologies, and lifestyle.',
    
    'Seja o objetivo melhoria de postura, perda de peso, recuperação de cirurgia ou correr uma maratona, por exemplo. É um dos pioneiros em Portugal em treino especializado para doentes oncológicos, uma área de conhecimento onde continua a investir. Outra característica que o destaca enquanto personal trainer é o facto de ser osteopata, o que amplia muito as estratégias que pode aplicar em cada sessão de treino.': 'Whether the goal is to improve posture, lose weight, recover from surgery, or run a marathon, for example. He is one of the pioneers in Portugal in specialised training for oncology patients, a knowledge area where he continues to invest. Another feature that sets him apart as a personal trainer is the fact that he is an osteopath, which greatly expands the strategies he can apply in each training session.',
    
    'Está a precisar de um osteopata?': 'Do you need an osteopath?',
    'ESTÁ A PRECISAR DE UM OSTEOPATA?': 'DO YOU NEED AN OSTEOPATH?',
    
    'O Paulo:': 'Paulo:',
    'O PAULO:': 'PAULO:',
    
    # auth-action.html / auth forms
    'BEM-VINDO': 'WELCOME',
    'Bem-vindo': 'Welcome',
    'Aceda à sua área pessoal de treino.': 'Access your personal training area.',
    '>Iniciar Sessão<': '>Log In<',
    'Iniciar Sessão': 'Log In',
    'Criar Conta': 'Create Account',
    'Palavra-passe': 'Password',
    'Lembrar-me': 'Remember me',
    'Esqueci-me da palavra-passe': 'Forgot password?',
    '>Entrar<': '>Enter<',
    '>Registar<': '>Register<',
    
    # perfil.html
    'OLÁ,': 'HELLO,',
    '>Olá,<': '>Hello,<',
    'AS SUAS PRÓXIMAS SESSÕES': 'YOUR UPCOMING SESSIONS',
    'As suas próximas sessões': 'Your upcoming sessions',
    'Sem sessões agendadas para breve.': 'No sessions scheduled soon.',
    'Editar Perfil': 'Edit Profile',
    'Histórico': 'History',
    'NOVA MARCAÇÃO': 'NEW BOOKING',
    'Nova Marcação': 'New Booking',
    'Terminar Sessão': 'Log Out',
    
    # Footer and random
    'O verdadeiro treino personalizado que se adapta à tua vida.': 'The true personal training that adapts to your life.',
    'Entre em contacto connosco': 'Get in touch with us',
    'Ainda não tem conta?': 'Don\'t have an account yet?',
    'Já tem conta?': 'Already have an account?'
}

for file in glob.glob('en/*.html'):
    replace_in_file(file, replacements)

print("Additional texts translated robustly.")
