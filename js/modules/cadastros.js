// js/modules/cadastros.js - Hub Central de Cadastros
// (Antigo js/cadastros.js)

class CadastrosManager {
    constructor() {
        this.dashboard = window.dashboard; // Acessa o dashboard principal
        this.init();
    }

    async init() {
        // Pré-carrega os scripts necessários para os modais
        try {
            await this.dashboard.loadModuleScript('js/modules/clientes.js');
            await this.dashboard.loadModuleScript('js/modules/produtos.js'); // Atualizado
            await this.dashboard.loadModuleScript('js/modules/fornecedores.js');
            await this.dashboard.loadModuleScript('js/modules/receitas.js'); 
            await this.dashboard.loadModuleScript('js/modules/laboratorio.js'); // Atualizado
        } catch (error) {
            console.error("Falha ao pré-carregar scripts de cadastro:", error);
            showError("Erro ao preparar formulários de cadastro.");
        }
        
        this.bindEvents();
    }

    bindEvents() {
        // REMOVIDO: setTimeout
        document.getElementById('btn-cadastro-cliente')?.addEventListener('click', () => this.showCadastroCliente());
        document.getElementById('btn-cadastro-produto')?.addEventListener('click', () => this.showCadastroProduto());
        document.getElementById('btn-cadastro-fornecedor')?.addEventListener('click', () => this.showCadastroFornecedor());
        document.getElementById('btn-cadastro-receita')?.addEventListener('click', () => this.showCadastroReceita());
        document.getElementById('btn-cadastro-os')?.addEventListener('click', () => this.showCadastroOS());
    }

    // --- CLIENTE ---
    showCadastroCliente() {
        if (!window.initClientes) {
            showError("Módulo de Clientes não carregado.");
            return;
        }
        if (!window.clientesManager) {
            window.initClientes();
        }
        window.clientesManager.showFormCliente();
    }

    // --- PRODUTO ---
    showCadastroProduto() {
        if (!window.initProdutosEspecializado) {
            showError("Módulo de Produtos não carregado.");
            return;
        }
        if (!window.produtosEspecializadoManager) {
            window.initProdutosEspecializado();
        }
        window.produtosEspecializadoManager.showFormProduto();
    }

    // --- FORNECEDOR ---
    showCadastroFornecedor() {
        if (!window.initFornecedores) {
            showError("Módulo de Fornecedores não carregado.");
            return;
        }
        if (!window.fornecedoresManager) {
            window.initFornecedores();
        }
        window.fornecedoresManager.showFormFornecedor();
    }

    // --- RECEITA ---
    showCadastroReceita() {
        if (!window.initReceitas) { 
            showError("Módulo de Receitas não carregado.");
            return;
        }
        if (!window.receitasManager) {
            window.initReceitas();
        }
        window.receitasManager.showFormReceita();
    }

    // --- ORDEM DE SERVIÇO ---
    showCadastroOS() {
        if (!window.initLaboratorioCompleto) {
            showError("Módulo de Laboratório não carregado.");
            return;
        }
        if (!window.laboratorioCompletoManager) {
            window.initLaboratorioCompleto();
        }
        window.laboratorioCompletoManager.showFormOrdemServico();
    }
}

// Inicializador
function initCadastros() {
    window.cadastrosManager = new CadastrosManager();
}