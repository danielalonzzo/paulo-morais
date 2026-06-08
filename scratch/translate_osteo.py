import glob

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for pt, en in replacements.items():
        content = content.replace(pt, en)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

osteopatia_replacements = {
    'Está a precisar de um Treino Personalizado?': 'Are you in need of Personal Training?',
    'A osteopatia ajuda a aliviar tensões, melhorar a mobilidade e dar\n                        leveza ao corpo.': 'Osteopathy helps relieve tension, improve mobility, and bring lightness to the body.',
    'Porquê escolher o Paulo Morais?': 'Why choose Paulo Morais?',
    'Especialista qualificado': 'Qualified Specialist',
    'O Paulo é um profissional altamente e rigorosamente qualificado, mantendo uma formação\n                            clínica\n                            segura, eficaz e baseada nas melhores práticas.': 'Paulo is a highly and rigorously qualified professional, maintaining safe, effective clinical training based on best practices.',
    'Abordagem personalizada ao paciente': 'Personalised patient approach',
    'Cada paciente é avaliado de forma individual, permitindo a definição de planos de tratamento\n                            ajustados às suas necessidades específicas.': 'Each patient is evaluated individually, allowing treatment plans to be tailored to their specific needs.',
    'Excelência e qualidade nos cuidados de saúde': 'Excellence and quality in healthcare',
    'O Paulo compromete-se com elevados padrões de qualidade, proporcionando resultados clínicos\n                            eficazes\n                            e centrados no bem-estar do paciente.': 'Paulo is committed to high quality standards, providing effective clinical results focused on patient wellbeing.',
    'Ambiente profissional, ético e acolhedor': 'Professional, ethical, and welcoming environment',
    'Trabalha num espaço confortável e seguro, criando um ambiente ideal para recuperação e\n                            bem-estar de cada paciente.': 'He works in a comfortable and safe space, creating an ideal environment for the recovery and wellbeing of each patient.',
    '+ 15 anos de': '+ 15 years of',
    'experiência': 'experience',
    '+ 100 pacientes': '+ 100 patients',
    'acompanhados': 'accompanied',
    '+ 250 tratamentos': '+ 250 treatments',
    'personalizados': 'personalised',
    'Entre em contacto connosco': 'Get in touch with us',
    'Nome próprio': 'First Name',
    'Apelido': 'Surname',
    'Descrição': 'Description',
    'Li e aceito a': 'I have read and accept the',
    'e autorizo o tratamento dos meus\n                                        dados.': 'and authorise the processing of my data.',
    'Enviar Mensagem': 'Send Message',
    'A enviar...': 'Sending...',
    'Por favor, aceite a Política de Privacidade.': 'Please accept the Privacy Policy.',
    'Mensagem enviada com sucesso! Entraremos em contacto em breve.': 'Message sent successfully! We will get in touch shortly.',
    'Erro ao enviar mensagem. Por favor, tente novamente.': 'Error sending message. Please try again.',
    'O Paulo é especialista em Osteopatia, possuindo um sólido\n                            conjunto de\n                            competências clínicas que lhe permite exercer a prática osteopática, promovendo a integração\n                            e a prestação de serviços de saúde de excelência.': 'Paulo is a specialist in Osteopathy, possessing a solid set of clinical skills that allow him to practice osteopathy, promoting integration and providing excellent healthcare services.',
    'PACIENTE DESDE': 'PATIENT SINCE',
    'CLIENTE DESDE': 'CLIENT SINCE',
    'Depois de quase um ano a tentar resolver as minhas dores\n                                        nas costas sem grandes melhorias, encontrei o Paulo... e em poucos meses\n                                        conseguiu resultados que nunca tinha alcançado antes. Nunca me senti tão\n                                        confiante no meu corpo e na minha recuperação! Hoje em dia já nem imagino o meu\n                                        quotidiano sem as sessões de osteopatia. A minha qualidade de vida melhorou\n                                        imenso desde que comecei o acompanhamento, deixei de ter dores constantes na\n                                        coluna (escoliose), sinto-me mais equilibrada, mais resistente e com muito mais\n                                        mobilidade.': 'After almost a year trying to resolve my back pain with little improvement, I found Paulo... and in a few months he achieved results I had never reached before. I have never felt so confident in my body and my recovery! Nowadays I cannot imagine my daily life without osteopathy sessions. My quality of life has improved immensely since I started the follow-up, I no longer have constant spinal pain (scoliosis), I feel more balanced, more resistant, and with much more mobility.',
    'Faço acompanhamento com o Paulo há menos de um ano, mas\n                                        parece que já nos conhecemos há muito mais tempo. Para além de ser extremamente\n                                        exigente e rigoroso no tratamento, dedica tempo a conhecer-nos, a ouvir-nos e a\n                                        assumir como seus os nossos desafios físicos e emocionais. Quero agradecer-lhe\n                                        por me ter ajudado a manter o equilibrio físico e mental durante um período de\n                                        recuperação muito exigente, e por me explicar sempre com clareza como a\n                                        osteopatia podia apoiar o meu corpo nesse processo.': 'I have been seeing Paulo for less than a year, but it feels like we have known each other for much longer. Besides being extremely demanding and rigorous in the treatment, he takes the time to know us, to listen to us, and to take our physical and emotional challenges as his own. I want to thank him for helping me maintain physical and mental balance during a very demanding recovery period, and for always explaining clearly how osteopathy could support my body in that process.',
    'O Paulo começou por ser apenas o profissional que me\n                                        ajudava a aliviar dores físicas e hoje é alguém essencial no meu bem-estar,\n                                        terapeuta manual e um verdadeiro apoio nos momentos mais difíceis. Não conheço\n                                        muitos profissionais tão completos. Pode não ter resposta imediata para tudo,\n                                        mas encontra sempre uma solução. Com o seu acompanhamento, consegui transformar\n                                        o meu corpo e a minha condição fisica, num processo exigente mas profundamente\n                                        recompensador.': 'Paulo started as just the professional who helped relieve physical pain and today he is essential to my wellbeing, a manual therapist and true support in the most difficult moments. I do not know many professionals so complete. He may not have an immediate answer for everything, but he always finds a solution. With his guidance, I managed to transform my body and physical condition, in a demanding but profoundly rewarding process.',
    'É impossível resumir toda a mais-valia que representa o\n                                        acompanhamento feito pelo Paulo. No Paulo encontramos um nível de excelência e\n                                        de cuidado que me ajudou a libertar de dores persistentes provocadas por uma\n                                        escoliose complicada, aquela presença física que parecia não me largar. As\n                                        sessões são sempre variadas, exigentes, bem-dispostas e, acima de tudo,\n                                        eficazes, e os resultados estão à vista.': 'It is impossible to summarize all the added value that Paulo\'s accompaniment represents. In Paulo we find a level of excellence and care that helped me break free from persistent pain caused by complicated scoliosis, that physical presence that seemed unwilling to let me go. The sessions are always varied, demanding, cheerful and, above all, effective, and the results are clear.'
}

replace_in_file('en/osteopatia.html', osteopatia_replacements)
replace_in_file('en/index.html', osteopatia_replacements) # Share some keys
print("Osteopatia translated.")
