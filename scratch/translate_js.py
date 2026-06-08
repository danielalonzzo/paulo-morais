import os
import glob
import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for pt, en in replacements.items():
        # Literal string replacement since JS doesn't have wild HTML formatting usually
        content = content.replace(pt, en)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

js_replacements = {
    'Observações *': 'Notes *',
    'Gestão da Agenda': 'Agenda Management',
    'Erro ao carregar dados da agenda. Tente recarregar a página.': 'Error loading agenda data. Try reloading the page.',
    'Editar Perfil': 'Edit Profile',
    'Olá, ': 'Hello, ',
    'Erro de conexão à base de dados. Tente recarregar.': 'Database connection error. Try reloading.',
    'Semana publicada com sucesso no sistema!': 'Week published successfully in the system!',
    'Erro ao publicar: ': 'Error publishing: ',
    'Tem a certeza que pretende desmarcar esta sessão?': 'Are you sure you want to cancel this session?',
    'Sessão desmarcada com sucesso.': 'Session cancelled successfully.',
    'Erro ao desmarcar sessão: ': 'Error cancelling session: ',
    'A carregar dados...': 'Loading data...',
    'As Suas Próximas Sessões': 'Your Upcoming Sessions',
    'Próximos Clientes': 'Upcoming Clients',
    'Sem clientes agendados para breve.': 'No clients scheduled soon.',
    'Erro ao carregar lista.': 'Error loading list.',
    ' reserva<': ' booking<',
    ' reservas<': ' bookings<',
    'Deseja eliminar a reserva de ': 'Do you wish to delete the booking of ',
    'CANCELAR': 'CANCEL',
    'Treino Online': 'Online Training',
    ' às ': ' at ',
    'Nenhum utilizador reservado.': 'No users booked.',
    'Deseja remover "': 'Do you wish to remove "',
    '" deste treino grupal?': '" from this group training?',
    'Utilizador removido com sucesso!': 'User removed successfully!',
    'Erro ao remover utilizador: ': 'Error removing user: ',
    'A publicar...': 'Publishing...',
    'Semana publicada com sucesso!': 'Week published successfully!',
    ' Publicar Semana': ' Publish Week',
    'Tem certeza que deseja remover todos os horários disponíveis (não reservados)? Reservas de clientes não serão afetadas.': 'Are you sure you want to remove all available (unbooked) time slots? Client bookings will not be affected.',
    'Confirmar Reserva': 'Confirm Booking',
    'Novas Reservas': 'New Bookings',
    'Cancelamentos': 'Cancellations',
    'Confirmar Alterações (': 'Confirm Changes (',
    'A processar...': 'Processing...',
    'Operação concluída com sucesso!': 'Operation completed successfully!',
    'Erro ao processar as alterações.': 'Error processing changes.',
    'Reserva removida com sucesso!': 'Booking removed successfully!',
    'Erro ao remover reserva: ': 'Error removing booking: ',
    'Não há horários disponíveis para limpar.': 'There are no available time slots to clear.',
    ' horários disponíveis foram removidos.': ' available time slots were removed.',
    'Erro ao limpar horários.': 'Error clearing time slots.',
    'Instalação Direta': 'Direct Installation',
    'Clique no botão abaixo para instalar a aplicação diretamente no seu telemóvel de forma automática.': 'Click the button below to install the application directly to your phone automatically.',
    'Adicionar Manualmente': 'Add Manually',
    'A instalação direta automática não está disponível no seu navegador atual.': 'Automatic direct installation is not available in your current browser.',
    'Por favor, utilize o menu do navegador para instalar manualmente.': 'Please use the browser menu to install manually.',
    'Toque em <strong>"Adicionar"</strong> no canto superior direito para confirmar. O ícone aparecerá no seu telemóvel e estará pronto a usar.': 'Tap <strong>"Add"</strong> in the top right corner to confirm. The icon will appear on your phone and will be ready to use.',
    'Após confirmar a instalação, o ícone da App do Paulo Morais aparecerá no ecrã do seu dispositivo. Aceda quando quiser com um único toque!': 'After confirming the installation, the Paulo Morais App icon will appear on your device\'s screen. Access it anytime with a single tap!',
    'O Paulo trabalhou maravilhas com as minhas pernas!': 'Paulo worked wonders with my legs!'
}

for file in glob.glob('en/js/*.js'):
    replace_in_file(file, js_replacements)

print("Translated JS strings successfully.")
