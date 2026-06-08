import glob

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for pt, en in replacements.items():
        content = content.replace(pt, en)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

common_replacements = {
    '>Início<': '>Home<',
    '>Sobre Mim<': '>About Me<',
    '>Perfil<': '>Profile<',
    '>OSTEOPATIA<': '>OSTEOPATHY<',
    '>AGENDAR<': '>BOOK NOW<',
    '>Agendar<': '>Book Now<',
    'title="Mudar Tema"': 'title="Toggle Theme"',
    'title="Mudar Idioma"': 'title="Change Language"',
    'title="Instalar App"': 'title="Install App"',
    '>Termos e Condições<': '>Terms and Conditions<',
    '>Política de Privacidade<': '>Privacy Policy<',
    '>Livro de Reclamações<': '>Complaints Book<',
    'Treino Personalizado & Osteopatia': 'Personal Training & Osteopathy',
    'Treino personalizado e osteopatia em Lisboa. Paulo Morais oferece uma abordagem integrada para a sua saúde e bem-estar.': 'Personal training and osteopathy in Lisbon. Paulo Morais offers an integrated approach to your health and wellbeing.',
    'O verdadeiro treino personalizado que se adapta mesmo à tua vida!': 'The true personal training that truly adapts to your life!',
    '>Entidades Certificadoras e Parceiros Institucionais<': '>Certifying Entities and Institutional Partners<',
    '>Osteopata e Especialista em Treino Personalizado<': '>Osteopath and Personal Training Specialist<',
    '>Saber Mais<': '>Learn More<',
    '>Especialidade<': '>Speciality<',
    'O Paulo trabalha com pessoas de todas as idades e objetivos: melhorar postura, perder peso, recuperar cirurgias, preparar uma maratona ou simplesmente viver com mais energia. É um dos primeiros em Portugal a desenvolver treino para doentes oncológicos.': 'Paulo works with people of all ages and goals: improving posture, losing weight, recovering from surgery, preparing for a marathon, or simply living with more energy. He is one of the first in Portugal to develop training for oncology patients.',
    '>Os clientes falam pelo Paulo<': '>Clients speak for Paulo<',
    'A experiência dos clientes é a maior prioridade, por isso os seus testemunhos\n                            são motivo de orgulho e dão força para continuar a crescer.': 'The client experience is the highest priority, so their testimonials\n                            are a source of pride and provide the strength to continue growing.',
    'A experiência dos clientes é a maior prioridade, por isso os seus testemunhos são motivo de orgulho e dão força para continuar a crescer.': 'The client experience is the highest priority, so their testimonials are a source of pride and provide the strength to continue growing.',
    '>Desenvolvido por Elysium<': '>Developed by Elysium<',
    'Todos os direitos reservados.': 'All rights reserved.',
    'pt@pmorais.pt?subject=Informação': 'pt@pmorais.pt?subject=Information'
}

for file in glob.glob('en/*.html'):
    replace_in_file(file, common_replacements)

print("Common translations applied.")
