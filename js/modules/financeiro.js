// js/modules/financeiro.js - Gestão Financeira Completa
// (Antigo js/financeiro.js)

class FinanceiroManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadMovimentacoes();
        this.loadResumoFinanceiro();
    }

    bindEvents() {
        // REMOVIDO: setTimeout
        const btnNovaMovimentacao = document.getElementById('btn-nova-movimentacao');
        const filtroTipo = document.getElementById('filtro-tipo');
        const filtroStatus = document.getElementById('filtro-status');

        if (btnNovaMovimentacao) btnNovaMovimentacao.addEventListener('click', () => this.showFormMovimentacao());
        if (filtroTipo) filtroTipo.addEventListener('change', (e) => this.filtrarMovimentacoes());
        if (filtroStatus) filtroStatus.addEventListener('change', (e) => this.filtrarMovimentacoes());
    }

    async loadMovimentacoes() {
        try {
            // ==================================================================
            // CORREÇÃO APLICADA AQUI:
            // Removida a linha ", clientes(nome)" que estava causando o erro,
            // pois não há relação direta entre 'financeiro_movimentacoes' e 'clientes'.
            // ==================================================================
            const { data: movimentacoes, error } = await this.supabase
                .from('financeiro_movimentacoes')
                .select(`
                    id, descricao, tipo, categoria, valor, data_vencimento, data_pagamento, status,
                    vendas ( numero_venda )
                `) // A linha "clientes(nome)" foi removida daqui.
                .order('data_vencimento', { ascending: true })
                .limit(100);

            if (error) throw error;
            this.renderMovimentacoesTable(movimentacoes);

        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
            showError('Erro ao carregar dados financeiros: ' + error.message); // Usa global
        }
    }

    renderMovimentacoesTable(movimentacoes) {
        const tbody = document.getElementById('financeiro-table-body');
        if (!tbody) return;

        if (movimentacoes && movimentacoes.length > 0) {
            tbody.innerHTML = movimentacoes.map(mov => `
                <tr class="${mov.status === 'vencido' ? 'movimentacao-vencida' : ''}">
                    <td>
                        <div class="movimentacao-descricao">
                            <strong>${mov.descricao}</strong>
                            ${mov.vendas ? `<div class="movimentacao-venda">Venda #${mov.vendas.numero_venda}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="movimentacao-tipo ${mov.tipo}">
                            ${mov.tipo === 'receita' ? '📈 Receita' : '📉 Despesa'}
                        </span>
                    </td>
                    <td>${mov.categoria}</td>
                    <td>
                        <strong class="${mov.tipo === 'receita' ? 'text-success' : 'text-danger'}">
                            R$ ${mov.valor.toFixed(2)}
                        </strong>
                    </td>
                    <td>${mov.data_vencimento ? new Date(mov.data_vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${mov.data_pagamento ? new Date(mov.data_pagamento).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                        <span class="status-badge ${mov.status}">
                            ${this.getStatusText(mov.status)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="financeiroManager.marcarComoPago('${mov.id}')" 
                                ${mov.status === 'pago' ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="financeiroManager.editarMovimentacao('${mov.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">Nenhuma movimentação encontrada</td>
                </tr>
            `;
        }
    }

    async loadResumoFinanceiro() {
        try {
            const hoje = new Date();
            const mesAtual = hoje.getMonth() + 1; // 1-12
            const anoAtual = hoje.getFullYear();
            
            // Pega o último dia do mês atual (ex: 30 para Nov, 31 para Dez)
            const ultimoDiaDoMes = new Date(anoAtual, mesAtual, 0).getDate(); 

            const dataInicioStr = `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`;
            const dataFimStr = `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-${ultimoDiaDoMes.toString().padStart(2, '0')}`;

            // Receitas do mês
            const { data: receitas, error: errorReceitas } = await this.supabase
                .from('financeiro_movimentacoes')
                .select('valor')
                .eq('tipo', 'receita')
                .eq('status', 'pago')
                .gte('data_pagamento', dataInicioStr)
                .lte('data_pagamento', dataFimStr);

            // Despesas do mês
            const { data: despesas, error: errorDespesas } = await this.supabase
                .from('financeiro_movimentacoes')
                .select('valor')
                .eq('tipo', 'despesa')
                .eq('status', 'pago')
                .gte('data_pagamento', dataInicioStr)
                .lte('data_pagamento', dataFimStr);

            // Contas a receber
            const { data: contasReceber, error: errorReceber } = await this.supabase
                .from('financeiro_movimentacoes')
                .select('valor')
                .eq('tipo', 'receita')
                .eq('status', 'pendente')
                .gte('data_vencimento', hoje.toISOString().split('T')[0]);

            // Contas a pagar
            const { data: contasPagar, error: errorPagar } = await this.supabase
                .from('financeiro_movimentacoes')
                .select('valor')
                .eq('tipo', 'despesa')
                .eq('status', 'pendente')
                .gte('data_vencimento', hoje.toISOString().split('T')[0]);

            if (errorReceitas || errorDespesas || errorReceber || errorPagar) {
                 console.error("Erro em uma das consultas do resumo:", { errorReceitas, errorDespesas, errorReceber, errorPagar });
            }

            const totalReceitas = receitas?.reduce((sum, item) => sum + item.valor, 0) || 0;
            const totalDespesas = despesas?.reduce((sum, item) => sum + item.valor, 0) || 0;
            const totalContasReceber = contasReceber?.reduce((sum, item) => sum + item.valor, 0) || 0;
            const totalContasPagar = contasPagar?.reduce((sum, item) => sum + item.valor, 0) || 0;
            const saldoMes = totalReceitas - totalDespesas;

            this.updateResumoFinanceiro({
                totalReceitas,
                totalDespesas,
                saldoMes,
                totalContasReceber,
                totalContasPagar
            });

        } catch (error) {
            console.error('Erro ao carregar resumo financeiro:', error);
        }
    }

    updateResumoFinanceiro(resumo) {
        const elements = {
            'total-receitas': `R$ ${resumo.totalReceitas.toFixed(2)}`,
            'total-despesas': `R$ ${resumo.totalDespesas.toFixed(2)}`,
            'saldo-mes': `R$ ${resumo.saldoMes.toFixed(2)}`,
            'contas-receber': `R$ ${resumo.totalContasReceber.toFixed(2)}`,
            'contas-pagar': `R$ ${resumo.totalContasPagar.toFixed(2)}` // Assumindo que você tenha um id 'contas-pagar'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                
                if (id === 'saldo-mes') {
                    element.className = resumo.saldoMes >= 0 ? 'text-success' : 'text-danger';
                }
            }
        });
    }

    showFormMovimentacao(movimentacao = null) {
        const modalContent = `
            <div class="modal-header">
                <h3>${movimentacao ? 'Editar' : 'Nova'} Movimentação</h3>
                <button class="btn-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="form-movimentacao">
                    <input type="hidden" id="movimentacao-id" value="${movimentacao?.id || ''}">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="movimentacao-tipo">Tipo *</label>
                            <select id="movimentacao-tipo" required>
                                <option value="receita" ${movimentacao?.tipo === 'receita' ? 'selected' : ''}>Receita</option>
                                <option value="despesa" ${movimentacao?.tipo === 'despesa' ? 'selected' : ''}>Despesa</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="movimentacao-categoria">Categoria *</label>
                            <select id="movimentacao-categoria" required>
                                <option value="">Selecione...</option>
                                <option value="venda" ${movimentacao?.categoria === 'venda' ? 'selected' : ''}>Venda</option>
                                <option value="servico" ${movimentacao?.categoria === 'servico' ? 'selected' : ''}>Serviço</option>
                                <option value="aluguel" ${movimentacao?.categoria === 'aluguel' ? 'selected' : ''}>Aluguel</option>
                                <option value="salario" ${movimentacao?.categoria === 'salario' ? 'selected' : ''}>Salário</option>
                                <option value="fornecedor" ${movimentacao?.categoria === 'fornecedor' ? 'selected' : ''}>Fornecedor</option>
                                <option value="outro" ${movimentacao?.categoria === 'outro' ? 'selected' : ''}>Outro</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="movimentacao-descricao">Descrição *</label>
                        <input type="text" id="movimentacao-descricao" value="${movimentacao?.descricao || ''}" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="movimentacao-valor">Valor *</label>
                            <input type="number" id="movimentacao-valor" step="0.01" value="${movimentacao?.valor || 0}" required>
                        </div>
                        <div class="form-group">
                            <label for="movimentacao-vencimento">Data Vencimento</label>
                            <input type="date" id="movimentacao-vencimento" value="${movimentacao?.data_vencimento || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="movimentacao-observacoes">Observações</label>
                        <textarea id="movimentacao-observacoes" rows="3">${movimentacao?.observacoes || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                <button class="btn btn-primary" onclick="financeiroManager.salvarMovimentacao()">Salvar Movimentação</button>
            </div>
        `;

        showModal(modalContent); // Usa global
    }

    async salvarMovimentacao() {
        const form = document.getElementById('form-movimentacao');
        if (!form) return;

        const movimentacaoData = {
            tipo: document.getElementById('movimentacao-tipo').value,
            categoria: document.getElementById('movimentacao-categoria').value,
            descricao: document.getElementById('movimentacao-descricao').value,
            valor: parseFloat(document.getElementById('movimentacao-valor').value) || 0,
            data_vencimento: document.getElementById('movimentacao-vencimento').value || null,
            observacoes: document.getElementById('movimentacao-observacoes').value,
            status: 'pendente'
        };
        
        if (!movimentacaoData.data_vencimento) {
            movimentacaoData.status = 'pago';
            movimentacaoData.data_pagamento = new Date().toISOString().split('T')[0];
            movimentacaoData.data_vencimento = new Date().toISOString().split('T')[0];
        }


        const movimentacaoId = document.getElementById('movimentacao-id').value;

        try {
            let error;
            if (movimentacaoId) {
                const { data, error: updateError } = await this.supabase
                    .from('financeiro_movimentacoes')
                    .update(movimentacaoData)
                    .eq('id', movimentacaoId);
                error = updateError;
            } else {
                const { data, error: insertError } = await this.supabase
                    .from('financeiro_movimentacoes')
                    .insert([movimentacaoData]);
                error = insertError;
            }

            if (error) throw error;

            showSuccess('Movimentação salva com sucesso!'); // Usa global
            document.querySelector('.modal').remove();
            this.loadMovimentacoes();
            this.loadResumoFinanceiro();

        } catch (error) {
            console.error('Erro ao salvar movimentação:', error);
            showError('Erro ao salvar movimentação: ' + error.message); // Usa global
        }
    }

    async marcarComoPago(movimentacaoId) {
        try {
            const { error } = await this.supabase
                .from('financeiro_movimentacoes')
                .update({
                    status: 'pago',
                    data_pagamento: new Date().toISOString().split('T')[0]
                })
                .eq('id', movimentacaoId);

            if (error) throw error;

            showSuccess('Movimentação marcada como paga!'); // Usa global
            this.loadMovimentacoes();
            this.loadResumoFinanceiro();

        } catch (error) {
            console.error('Erro ao marcar como pago:', error);
            showError('Erro ao atualizar movimentação: ' + error.message); // Usa global
        }
    }

    async editarMovimentacao(movimentacaoId) {
        try {
            const { data: movimentacao, error } = await this.supabase
                .from('financeiro_movimentacoes')
                .select('*')
                .eq('id', movimentacaoId)
                .single();

            if (error) throw error;
            this.showFormMovimentacao(movimentacao);

        } catch (error) {
            console.error('Erro ao carregar movimentação:', error);
            showError('Erro ao carregar dados da movimentação'); // Usa global
        }
    }

    filtrarMovimentacoes() {
        const tipo = document.getElementById('filtro-tipo')?.value;
        const status = document.getElementById('filtro-status')?.value;
        
        console.log('Filtrando por:', { tipo, status });
        
        const tbody = document.getElementById('financeiro-table-body');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const rowTipoElement = row.querySelector('.movimentacao-tipo');
            const rowStatusElement = row.querySelector('.status-badge');
            if (!rowTipoElement || !rowStatusElement) return;

            const rowTipo = rowTipoElement.classList.contains('receita') ? 'receita' : 'despesa';
            const rowStatusText = rowStatusElement.textContent.trim().toLowerCase();
            let rowStatus = 'outros'; // default
            if (rowStatusText.includes('pago')) rowStatus = 'pago';
            else if (rowStatusText.includes('pendente')) rowStatus = 'pendente';
            else if (rowStatusText.includes('vencido')) rowStatus = 'vencido';


            const matchTipo = (tipo === 'todos') || (tipo === rowTipo);
            const matchStatus = (status === 'todos') || (status === rowStatus);

            if (matchTipo && matchStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    getStatusText(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'pago': 'Pago',
            'vencido': 'Vencido'
        };
        return statusMap[status] || status;
    }

    // REMOVIDO: showModal, showSuccess, showError
}

// Inicializar quando o módulo for carregado
let financeiroManager = null;

function initFinanceiro() {
    financeiroManager = new FinanceiroManager();
    window.financeiroManager = financeiroManager;
}