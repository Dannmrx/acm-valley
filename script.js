document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const botToken = document.getElementById('botToken');
    const channelId = document.getElementById('channelId');
    const dataInicio = document.getElementById('dataInicio');
    const dataFim = document.getElementById('dataFim');
    const btnConnect = document.getElementById('btnConnect');
    const spinnerConnect = document.getElementById('spinnerConnect');
    const resultCard = document.getElementById('resultCard');
    const totalRegistros = document.getElementById('totalRegistros');
    const totalHoras = document.getElementById('totalHoras');
    const periodo = document.getElementById('periodo');
    const registrosImportados = document.getElementById('registrosImportados');
    const btnSave = document.getElementById('btnSave');
    const registrosSalvos = document.getElementById('registrosSalvos');
    const alertBox = document.getElementById('alertBox');
    
    // Definir datas padrão (últimos 7 dias)
    const hoje = new Date();
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(hoje.getDate() - 7);
    
    dataInicio.value = umaSemanaAtras.toISOString().split('T')[0];
    dataFim.value = hoje.toISOString().split('T')[0];
    
    // Conectar ao Discord e importar registros
    btnConnect.addEventListener('click', async function() {
        if (!botToken.value) {
            showAlert('Por favor, insira o token do bot do Discord.', 'error');
            return;
        }
        
        if (!channelId.value) {
            showAlert('Por favor, insira o ID do canal do Discord.', 'error');
            return;
        }
        
        // Mostrar loading
        spinnerConnect.style.display = 'inline-block';
        btnConnect.disabled = true;
        
        try {
            // Simular a importação de registros do Discord
            // EM UM SISTEMA REAL, aqui você faria uma requisição para sua API
            // que se conectaria à API do Discord para buscar as mensagens
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
            
            // Gerar alguns registros de exemplo baseados nas datas selecionadas
            const registros = gerarRegistrosExemplo(dataInicio.value, dataFim.value);
            
            // Exibir resultados
            exibirResultados(registros, dataInicio.value, dataFim.value);
            
            // Mostrar card de resultados
            resultCard.style.display = 'block';
            
            showAlert('Registros importados com sucesso do Discord!', 'success');
            
        } catch (error) {
            console.error('Erro ao importar do Discord:', error);
            showAlert('Erro ao conectar com o Discord. Verifique o token и o ID do canal.', 'error');
        } finally {
            // Esconder loading
            spinnerConnect.style.display = 'none';
            btnConnect.disabled = false;
        }
    });
    
    // Salvar registros no sistema
    btnSave.addEventListener('click', function() {
        // Obter registros importados
        const registros = JSON.parse(localStorage.getItem('registrosImportados') || '[]');
        
        if (registros.length === 0) {
            showAlert('Nenhum registro para salvar.', 'info');
            return;
        }
        
        // Salvar no localStorage (simulando um banco de dados)
        const registrosExistentes = JSON.parse(localStorage.getItem('registrosPonto') || '[]');
        const novosRegistros = [...registrosExistentes, ...registros];
        
        localStorage.setItem('registrosPonto', JSON.stringify(novosRegistros));
        
        // Atualizar exibição
        exibirRegistrosSalvos();
        
        showAlert('Registros salvos com sucesso no sistema!', 'success');
    });
    
    // Gerar registros de exemplo (simulação)
    function gerarRegistrosExemplo(dataInicio, dataFim) {
        const registros = [];
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        // Funcionários de exemplo
        const funcionarios = [
            { nome: 'João Silva', matricula: 'ACM2023001', cargo: 'Enfermeiro' },
            { nome: 'Maria Santos', matricula: 'ACM2023002', cargo: 'Médica' },
            { nome: 'Pedro Alves', matricula: 'ACM2023003', cargo: 'Recepcionista' }
        ];
        
        // Para cada dia no período
        for (let data = new Date(inicio); data <= fim; data.setDate(data.getDate() + 1)) {
            // Pular finais de semana (apenas exemplo)
            if (data.getDay() === 0 || data.getDay() === 6) continue;
            
            // Para cada funcionário
            for (const func of funcionarios) {
                // Gerar horários de entrada e saída
                const horaEntrada = 8 + Math.floor(Math.random() * 2); // Entre 8h e 9h
                const minutoEntrada = Math.floor(Math.random() * 60);
                
                const horaSaida = horaEntrada + 8 + Math.floor(Math.random() * 2); // 8-9 horas depois
                const minutoSaida = Math.floor(Math.random() * 60);
                
                // Registrar entrada
                registros.push({
                    id: Date.now() + Math.random(),
                    usuario: func.nome,
                    matricula: func.matricula,
                    tipo: 'ENTRADA',
                    timestamp: new Date(data.getFullYear(), data.getMonth(), data.getDate(), horaEntrada, minutoEntrada).toISOString(),
                    data: data.toDateString(),
                    horas: `${horaEntrada.toString().padStart(2, '0')}:${minutoEntrada.toString().padStart(2, '0')}`,
                    cargo: func.cargo
                });
                
                // Registrar saída
                registros.push({
                    id: Date.now() + Math.random(),
                    usuario: func.nome,
                    matricula: func.matricula,
                    tipo: 'SAIDA',
                    timestamp: new Date(data.getFullYear(), data.getMonth(), data.getDate(), horaSaida, minutoSaida).toISOString(),
                    data: data.toDateString(),
                    horas: `${horaSaida.toString().padStart(2, '0')}:${minutoSaida.toString().padStart(2, '0')}`,
                    cargo: func.cargo
                });
            }
        }
        
        // Ordenar por timestamp
        registros.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Salvar registros importados no localStorage
        localStorage.setItem('registrosImportados', JSON.stringify(registros));
        
        return registros;
    }
    
    // Exibir resultados da importação
    function exibirResultados(registros, dataInicio, dataFim) {
        // Atualizar contadores
        totalRegistros.textContent = registros.length;
        
        // Calcular horas totais
        const horasTotais = calcularHorasTrabalhadas(registros);
        totalHoras.textContent = formatarHoras(horasTotais);
        
        // Definir período
        periodo.textContent = `${formatarData(dataInicio)} à ${formatarData(dataFim)}`;
        
        // Exibir registros na tabela
        registrosImportados.innerHTML = '';
        
        if (registros.length === 0) {
            registrosImportados.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum registro encontrado</td></tr>';
            return;
        }
        
        registros.forEach(registro => {
            const tr = document.createElement('tr');
            const data = new Date(registro.timestamp);
            
            tr.innerHTML = `
                <td>${registro.usuario} (${registro.matricula})</td>
                <td>${data.toLocaleDateString('pt-BR')}</td>
                <td>${data.toLocaleTimeString('pt-BR')}</td>
                <td class="${registro.tipo === 'ENTRADA' ? 'registro-entrada' : 'registro-saida'}">
                    ${registro.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                </td>
                <td>${registro.cargo}</td>
            `;
            
            registrosImportados.appendChild(tr);
        });
    }
    
    // Exibir registros salvos
    function exibirRegistrosSalvos() {
        const registros = JSON.parse(localStorage.getItem('registrosPonto') || '[]');
        
        registrosSalvos.innerHTML = '';
        
        if (registros.length === 0) {
            registrosSalvos.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum registro salvo</td></tr>';
            return;
        }
        
        // Ordenar por timestamp (mais recente primeiro)
        registros.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Limitar a 10 registros mais recentes
        const registrosRecentes = registros.slice(0, 10);
        
        registrosRecentes.forEach(registro => {
            const tr = document.createElement('tr');
            const data = new Date(registro.timestamp);
            
            tr.innerHTML = `
                <td>${registro.usuario} (${registro.matricula})</td>
                <td>${data.toLocaleDateString('pt-BR')}</td>
                <td>${data.toLocaleTimeString('pt-BR')}</td>
                <td class="${registro.tipo === 'ENTRADA' ? 'registro-entrada' : 'registro-saida'}">
                    ${registro.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                </td>
                <td>${registro.cargo}</td>
            `;
            
            registrosSalvos.appendChild(tr);
        });
    }
    
    // Calcular horas trabalhadas com base nos registros
    function calcularHorasTrabalhadas(registros) {
        if (registros.length === 0) return 0;
        
        // Ordenar registros por timestamp
        registros.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        let totalMinutos = 0;
        let entrada = null;
        
        for (const registro of registros) {
            if (registro.tipo === 'ENTRADA') {
                entrada = new Date(registro.timestamp);
            } else if (registro.tipo === 'SAIDA' && entrada) {
                const saida = new Date(registro.timestamp);
                const diffMs = saida - entrada;
                totalMinutos += diffMs / 1000 / 60;
                entrada = null;
            }
        }
        
        return totalMinutos;
    }
    
    // Formatar minutos no formato HH:MM
    function formatarHoras(minutos) {
        const horas = Math.floor(minutos / 60);
        const mins = Math.floor(minutos % 60);
        return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    // Formatar data para exibição
    function formatarData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    }
    
    // Mostrar alerta
    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.className = 'alert';
        
        if (type === 'success') {
            alertBox.classList.add('alert-success');
        } else if (type === 'error') {
            alertBox.classList.add('alert-error');
        } else if (type === 'info') {
            alertBox.classList.add('alert-info');
        }
        
        alertBox.style.display = 'block';
        
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
    
    // Inicializar a exibição de registros salvos
    exibirRegistrosSalvos();
});