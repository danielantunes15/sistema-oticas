// js/core/app.js - Sistema "Core" de Roteamento e Módulos
// (Antigo js/dashboard.js)

class DashboardManager {
    constructor() {
        this.currentModule = 'dashboard';
        this.supabase = window.supabaseClient;
        this.loadedScripts = new Set(); // Controla scripts já carregados

        // Mapeamento de módulos ATUALIZADO
        this.moduleConfig = {
            'dashboard': { html: 'partials/dashboard.html', js: 'js/modules/dashboard.js', init: 'initDashboardModule' },
            'clientes': { html: 'partials/clientes.html', js: 'js/modules/clientes.js', init: 'initClientes' },
            'vendas': { html: 'partials/vendas.html', js: 'js/modules/vendas.js', init: 'initVendas' },
            'estoque': { html: 'partials/estoque.html', js: 'js/modules/estoque.js', init: 'initEstoque' },
            'financeiro': { html: 'partials/financeiro.html', js: 'js/modules/financeiro.js', init: 'initFinanceiro' },
            'receitas': { html: 'partials/receitas.html', js: 'js/modules/receitas.js', init: 'initReceitas' },
            'laboratorio': { html: 'partials/laboratorio.html', js: 'js/modules/laboratorio.js', init: 'initLaboratorioCompleto' }, // Caminho JS atualizado
            'relatorios': { html: 'partials/relatorios.html', js: 'js/modules/relatorios.js', init: 'initRelatorios' },
            
            'produtos_especializados': { html: 'partials/produtos_especializados.html', js: 'js/modules/produtos.js', init: 'initProdutosEspecializado' }, // Caminho JS atualizado
            'ordens_servico': { html: 'partials/ordens_servico.html', js: 'js/modules/laboratorio.js', init: 'initLaboratorioCompleto' }, // Reutiliza JS
            'etapas_os': { html: 'partials/etapas_os.html', js: 'js/modules/laboratorio.js', init: 'initLaboratorioCompleto' }, // Reutiliza JS
            
            'orcamentos': { html: 'partials/orcamentos.html', js: 'js/modules/orcamentos.js', init: 'initOrcamentos' },
            'cadastros': { html: 'partials/cadastros.html', js: 'js/modules/cadastros.js', init: 'initCadastros' }
            
            // Adicione aqui outros módulos como 'garantias', 'consultorio' se estiverem no menu
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadModule('dashboard'); // Carrega o dashboard inicial
    }

    bindEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        // A lógica do Sidebar (menuToggle) foi movida para js/components/sidebar.js
        // e não é mais necessária aqui.

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleNavigation(e);
            });
        });
    }

    handleNavigation(event) {
        const navItem = event.currentTarget;
        const moduleName = navItem.getAttribute('data-module');
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');
        
        this.loadModule(moduleName);
    }

    async loadModule(moduleName) {
        if (!this.moduleConfig[moduleName]) {
            console.error(`Módulo "${moduleName}" não configurado.`);
            // Use a função de erro global!
            window.showError(`Módulo "${moduleName}" não encontrado.`);
            return;
        }

        this.currentModule = moduleName;
        
        try {
            this.showLoading();
            
            const config = this.moduleConfig[moduleName];

            // 1. Carregar o HTML
            const content = await this.fetchModuleHTML(config.html);
            document.getElementById('module-content').innerHTML = content;
            
            // 2. Carregar o Script (se não foi carregado antes)
            await this.loadModuleScript(config.js);

            // 3. Inicializar o módulo (chama a função init...() específica)
            if (config.init && typeof window[config.init] === 'function') {
                window[config.init]();
            } else if (config.js) {
                console.warn(`Função de inicialização ${config.init} não encontrada para ${moduleName}.`);
            }
            
            this.updatePageTitle(moduleName);
            
        } catch (error) {
            console.error('Erro ao carregar módulo:', error);
            // Use a função de erro global!
            window.showError(`Erro ao carregar módulo ${moduleName}`);
        }
    }

    async fetchModuleHTML(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${path}`);
            }
            return response.text();
        } catch (error) {
            console.error(`Erro ao carregar view HTML:`, error);
            return `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Falha ao carregar a visualização ${path}.</div>`;
        }
    }

    async loadModuleScript(path) {
        if (!path || this.loadedScripts.has(path)) {
            // Se o script não existe (só HTML) ou já foi carregado, não faz nada
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.async = true;
            
            script.onload = () => {
                console.log(`Script ${path} carregado.`);
                this.loadedScripts.add(path);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`Falha ao carregar script: ${path}`);
                reject(new Error(`Falha ao carregar script: ${path}`));
            };
            
            document.body.appendChild(script);
        });
    }

    showLoading() {
        const moduleContent = document.getElementById('module-content');
        if (moduleContent) {
            moduleContent.innerHTML = '<div class="loading">Carregando...</div>';
        }
    }
    
    showError(message) {
        // Esta função agora usa a global
        window.showError(message); 
        
        const moduleContent = document.getElementById('module-content');
        if (moduleContent) {
            moduleContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${message}</span>
                    <button class="btn btn-primary" onclick="dashboard.loadModule('dashboard')">
                        Voltar ao Dashboard
                    </button>
                </div>
            `;
        }
    }

    // REMOVIDO: toggleSidebar() - agora está em js/components/sidebar.js

    updatePageTitle(moduleName) {
        // Títulos para o <title> da página
        const titles = {
            'dashboard': 'Dashboard',
            'clientes': 'Clientes',
            'vendas': 'Vendas',
            'estoque': 'Estoque',
            'financeiro': 'Financeiro',
            'receitas': 'Receitas',
            'laboratorio': 'Laboratório',
            'produtos_especializados': 'Produtos',
            'ordens_servico': 'Ordens de Serviço',
            'etapas_os': 'Etapas O.S.',
            'orcamentos': 'Orçamentos',
            'cadastros': 'Cadastros',
            'relatorios': 'Relatórios'
        };
        const title = titles[moduleName] || moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
        document.title = `${title} - Óticas Avelar`;
    }
}

// Inicialização segura do dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar para garantir que o Supabase está carregado
    setTimeout(() => {
        if (!window.supabaseClient) {
            console.error("Falha ao inicializar o Supabase!");
            return;
        }
        window.dashboard = new DashboardManager();
    }, 100);
});

// REMOVIDO: Funções globais (showSuccess, showError, showModal)
// Elas agora estão centralizadas em js/components/modal.js