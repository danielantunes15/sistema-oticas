// js/components/modal.js - Gerenciador de Modais e Alertas

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    
    document.body.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remover o toast após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        // Remover do DOM após a animação de saída
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

// Funções globais para uso nos módulos
window.showSuccess = function(message) {
    showToast(message || "Operação realizada com sucesso!", 'success');
};

window.showError = function(message) {
    showToast(message || "Ocorreu um erro.", 'error');
};

window.showModal = function(content) {
    // Remove qualquer modal antigo
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
    
    // Fechar modal ao clicar no fundo escuro
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Adiciona funcionalidade ao btn-close
    const btnClose = modal.querySelector('.btn-close');
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            modal.remove();
        });
    }
    
    return modal;
};