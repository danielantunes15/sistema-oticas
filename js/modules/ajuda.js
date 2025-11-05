// js/modules/ajuda.js - Módulo da Central de Ajuda
class AjudaManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.form = document.getElementById('form-chamado-suporte');
        this.submitButton = document.getElementById('btn-enviar-chamado');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.salvarChamado(e));
        }
    }

    async salvarChamado(event) {
        event.preventDefault();
        if (this.submitButton) this.submitButton.disabled = true;

        const chamadoData = {
            nome_solicitante: document.getElementById('chamado-nome').value,
            email_contato: document.getElementById('chamado-email').value,
            modulo_afetado: document.getElementById('chamado-modulo').value,
            prioridade: document.getElementById('chamado-prioridade').value,
            descricao: document.getElementById('chamado-descricao').value,
            status: 'aberto'
        };
        
        try {
            const { error } = await this.supabase
                .from('chamados_suporte')
                .insert([chamadoData]);

            if (error) throw error;

            showSuccess('Chamado enviado com sucesso! Entraremos em contato em breve.');
            this.form.reset();
        } catch (error) {
            console.error('Erro ao salvar chamado:', error);
            showError('Erro ao enviar chamado: ' + error.message);
        } finally {
            if (this.submitButton) this.submitButton.disabled = false;
        }
    }
}

// Inicializador
function initAjuda() {
    // Verifica se já existe uma instância para não duplicar
    if (!window.ajudaManager) {
        window.ajudaManager = new AjudaManager();
    }
}