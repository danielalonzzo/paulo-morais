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
        # We replace the matched content with the English string
        # But we want to maintain the leading whitespace or tags if possible
        # Actually just substituting the text is fine
        content = re.sub(pattern, en, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

testi_replacements = {
    'Ao fim de 1 ano de PT e sem ver resultados, apareceu o Paulo... e em 9 meses conseguiu que atingisse resultados que nunca tinha atingido antes. Nunca estive tão motivada para ficar mais forte, mais segura e melhor! De facto, já nem imagino o meu dia-a-dia sem os treinos do Paulo e a minha qualidade de vida melhorou substancialmente desde que comecei os treinos.': 'After 1 year of PT with no results, Paulo appeared... and in 9 months he managed to get me results I had never reached before. I have never been so motivated to get stronger, safer, and better! In fact, I can no longer imagine my day-to-day life without Paulo\'s training, and my quality of life has improved substantially since I started training.',
    
    'Treino com o Paulo há menos de 1 ano, mas parece que treino com ele há uma eternidade. Porque para além de exigir sempre mais de cada um de nós, também dedica tempo durante o treino a conhecer-nos, a "gostar" de nós e a tomar como seus os nossos desafios.<br><br> Obrigada Paulo por me ter mantido sã de cabeça e espírito durante o meu percurso de quimioterapia e radioterapia. E por todos os artigos em que explicava que o HIT era óptimo para quem estava neste percurso.': 'I have been training with Paulo for less than a year, but it feels like an eternity. Because besides always demanding more from each of us, he also takes the time during training to know us, to "like" us, and to take our challenges as his own.<br><br>Thank you Paulo for keeping my mind and spirit sane during my chemotherapy and radiotherapy journey. And for all the articles explaining that HIIT was great for those on this path.',
    
    'O Paulo começou por ser um PT do ginásio e hoje é o meu psicólogo desportivo, fisio/massagista/osteo e o que for preciso. Não conheço PT mais completo. Não sabe tudo, mas arranja solução para tudo. Com ele passei de uma calça 32/34 a uma 40/42, foi duro, mas valeu a pena.<br><br> Durante a minha lesão prévia à quarentena, o Paulo esteve presente todos os dias em que quis desistir, levou com a minha frustração e fez tudo para não desistir da luta pelo que mais gosto.': 'Paulo started as a gym PT and today he is my sports psychologist, physio/masseur/osteo, and whatever is needed. I don\'t know a more complete PT. He doesn\'t know everything, but he finds a solution for everything. With him, I went from size 32/34 trousers to 40/42, it was hard, but worth it.<br><br>During my pre-quarantine injury, Paulo was present every day I wanted to give up, put up with my frustration, and did everything so I wouldn\'t give up the fight for what I love most.',
    
    'Finalmente encontrei o treino que procurava: personalizado com foco na pessoa! Personalizado, focado nos meus objectivos e com "bora lá, acaba lá isso" quando refilo. O Paulo foca-se todos os dias em fazer com que eu me supere.': 'I finally found the training I was looking for: personalized with a focus on the person! Personalized, focused on my goals, and with a "come on, finish that" when I complain. Paulo focuses every day on making me surpass myself.',
    
    'Conhecemo-nos há mais de 20 anos e só depois de bastante tempo parada, uma cirurgia à zona lombar e muitas calcificações nos ombros, é que decidi treinar contigo. E arrependo-me ... arrependo-me por só ter começado há pouco mais de 1 e meio. A tua paciência em motivar, adaptar os treinos conforme a condição física e a tua exigência fazem de ti um profissional de excelência.<br><br> Hoje sinto-me mais forte, com mais resistência e mais flexibilidade graças a ti.': 'We have known each other for over 20 years and only after a long time stopped, a surgery in the lumbar area and many calcifications in the shoulders, did I decide to train with you. And I regret it... I regret only starting a little over a year and a half ago. Your patience in motivating, adapting workouts according to physical condition, and your high standards make you an excellent professional.<br><br>Today I feel stronger, with more endurance and flexibility thanks to you.',
    
    'Comecei a treinar muito a medo, porque nunca fui muito desportista. Fez-me descobrir uma vontade de treinar que não conhecia e o meu corpo modificou-se ao longo do tempo. Abraçou-me quando achei que não conseguia mais, acreditou quando nem eu acreditava e levou-me a um limite que eu não sabia que existia. Os nossos caminhos separaram-se comigo a abraçar um desafio internacional.<br><br> Mais do que perder peso, treinar com o Paulo é terapêutico, é conhecer-me melhor e gostar mais de mim.': 'I started training very afraid, because I was never very sporty. He made me discover a desire to train that I didn\'t know I had, and my body changed over time. He embraced me when I thought I couldn\'t do it anymore, believed when not even I believed, and pushed me to a limit I didn\'t know existed. Our paths parted with me embracing an international challenge.<br><br>More than losing weight, training with Paulo is therapeutic; it is knowing myself better and liking myself more.',
    
    'No último ano aconteceu tudo. O pior e o mejor. Perdi a minha boa forma. Engordei quase 10kg, comecei a comer de tudo, como compensação. Mas decidi que no podia continuar a destruir-me, que tinha que fazer alguma coisa por mim. Quase a fazer 50 anos e com muita vida que espero viver com muita intensidade. Então conheci o Paulo e comecei a treinar com ele. Em casa. No jardim do Campo Grande. No Estádio Universitário. E agora por WhatsApp.<br><br> O Paulo não desistiu de mim, mesmo quando eu própria desisti.': 'In the last year, everything happened. The worst and the best. I lost my good shape. I gained almost 10kg, started eating everything, as compensation. But I decided I couldn\'t continue destroying myself, that I had to do something for me. Almost turning 50 and with a lot of life I hope to live with great intensity. Then I met Paulo and started training with him. At home. In the Campo Grande garden. At the University Stadium. And now via WhatsApp.<br><br>Paulo did not give up on me, even when I gave up on myself.',
    
    'Começámos a treinar juntos, porque depois de descobrir que estava grávida, e apesar de ter um bom ritmo de treino, sabia que era um caminho que não conseguia fazer sozinha. O meu último treino foi 5 dias antes do baby nascer. Não podia ter sido mais desafiante, mas foi sem dúvida cheio de conquistas. Hoje, mais de 1 ano depois, conseguimos consolidar objectivos, eliminar a pança pós-parto e atingir a minha melhor forma física de sempre.<br><br> Não há um treino igual, não há um único treino fácil, não há um único dia em que não te rogue mil pragas ... mas os resultados estão à vista!': 'We started training together because after finding out I was pregnant, and despite having a good training pace, I knew it was a journey I couldn\'t do alone. My last workout was 5 days before the baby was born. It couldn\'t have been more challenging, but it was undoubtedly full of achievements. Today, over 1 year later, we managed to consolidate goals, eliminate the postpartum belly, and achieve my best physical shape ever.<br><br>No two workouts are the same, there is not a single easy workout, not a single day I don\'t curse you a thousand times... but the results are clear!',
    
    'O Paulo tem uma excelência e cuidado que me tem libertado das dores de uma escoliose péssima. Os treinos são diferentes, desafiantes e engraçados. Frias faz parte da família e continuas com o nível de sempre!': 'Paulo has an excellence and care that has freed me from the pain of a terrible scoliosis. The workouts are different, challenging, and fun. You are part of the family and continue with the usual high standards!',

    # Buttons
    'Saber Mais': 'Learn More',
    '>Agendar <': '>Book Now <',
    '>Agendar<': '>Book Now<',
    'Explorar': 'Explore',
    'Ler Mais': 'Read More'
}

for file in glob.glob('en/*.html'):
    replace_in_file(file, testi_replacements)

print("Testimonials and buttons translated robustly.")
