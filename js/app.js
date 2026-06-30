/**
 * SISTEMA DE ESTACIONAMENTO - APLICAÇÃO PRINCIPAL
 * HTML5 + CSS3 + JavaScript Puro
 * 
 * TODO: Integrar com API de autenticação real
 * TODO: Integrar com API de vagas
 * TODO: Integrar com API de registros
 * TODO: Integrar com API de relatórios
 */

// ============================================
// ESTADO GLOBAL DA APLICAÇÃO
// ============================================

const AppState = {
  currentUser: null,
  selectedRole: 'funcionario',
  selectedSpot: null,
  records: [],
  spots: [],
  
  init() {
    this.generateMockSpots();
    this.generateMockRecords();
  },
  
  generateMockSpots() {
    this.spots = [];
    for (let i = 1; i <= 50; i++) {
      const statuses = ['available', 'occupied', 'pcd'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      this.spots.push({
        id: `spot-${i}`,
        spotNumber: `${String.fromCharCode(65 + Math.floor((i - 1) / 10))}${((i - 1) % 10) + 1}`,
        status: randomStatus,
        vehicle: randomStatus === 'occupied' ? {
          plate: this.generateRandomPlate(),
          entryTime: new Date(Date.now() - Math.random() * 3600000)
        } : null
      });
    }
  },
  
  generateMockRecords() {
    this.records = [];
    const types = ['entrada', 'saida'];
    const employees = ['Clara Maria', 'Carol Andrade', 'João Silva', 'Maria Santos'];
    const paymentMethods = ['dinheiro', 'cartao', 'pix'];
    
    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const record = {
        id: `record-${i}`,
        type: type,
        plate: this.generateRandomPlate(),
        spotNumber: this.spots[Math.floor(Math.random() * this.spots.length)].spotNumber,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        employee: employees[Math.floor(Math.random() * employees.length)],
        amount: type === 'saida' ? Math.random() * 50 + 10 : null,
        paymentMethod: type === 'saida' ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : null,
        duration: type === 'saida' ? Math.floor(Math.random() * 480) + 30 : null
      };
      this.records.push(record);
    }
  },
  
  generateRandomPlate() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let plate = '';
    for (let i = 0; i < 3; i++) plate += letters[Math.floor(Math.random() * letters.length)];
    plate += '-';
    for (let i = 0; i < 4; i++) plate += numbers[Math.floor(Math.random() * numbers.length)];
    return plate;
  },
  
  getStats() {
    return {
      availableSpots: this.spots.filter(s => s.status === 'available').length,
      occupiedSpots: this.spots.filter(s => s.status === 'occupied').length,
      pcdSpots: this.spots.filter(s => s.status === 'pcd').length,
      totalSpots: this.spots.length,
      dailyRevenue: this.records
        .filter(r => r.type === 'saida' && r.amount)
        .reduce((sum, r) => sum + (r.amount || 0), 0),
      totalRecords: this.records.length
    };
  },
  
  addRecord(type, plate, spotNumber, employee, amount = null, paymentMethod = null) {
    const record = {
      id: `record-${Date.now()}`,
      type: type,
      plate: plate,
      spotNumber: spotNumber,
      timestamp: new Date(),
      employee: employee,
      amount: amount,
      paymentMethod: paymentMethod,
      duration: type === 'saida' ? Math.floor(Math.random() * 480) + 30 : null
    };
    this.records.unshift(record);
    return record;
  },
  
  updateSpotStatus(spotNumber, status) {
    const spot = this.spots.find(s => s.spotNumber === spotNumber);
    if (spot) {
      spot.status = status;
      if (status === 'available') {
        spot.vehicle = null;
      } else if (status === 'occupied') {
        spot.vehicle = {
          plate: this.generateRandomPlate(),
          entryTime: new Date()
        };
      }
    }
  },
  
  findVehicleByPlate(plate) {
    const record = this.records.find(r => r.type === 'entrada' && r.plate === plate.toUpperCase());
    if (!record) return null;
    
    const spot = this.spots.find(s => s.spotNumber === record.spotNumber);
    const entryTime = record.timestamp;
    const durationMinutes = Math.floor((Date.now() - entryTime.getTime()) / 60000);
    const amount = durationMinutes * 0.5; // R$ 0.50 por minuto
    
    return {
      plate: record.plate,
      spotNumber: record.spotNumber,
      entryTime: entryTime,
      durationMinutes: durationMinutes,
      amount: Math.max(amount, 10) // Mínimo R$ 10
    };
  }
};

// ============================================
// GERENCIAMENTO DE UI
// ============================================

const UI = {
  showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    
    // Show selected page
    const page = document.getElementById(pageName + 'Page');
    if (page) {
      page.classList.add('active');
    }
    
    // Update header title
    const titles = {
      dashboard: 'Dashboard',
      entrada: 'Registrar Entrada',
      saida: 'Registrar Saída',
      vagas: 'Controle de Vagas',
      relatorios: 'Relatórios'
    };
    document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';
    
    // Update active nav link
    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // Render page content
    this.renderPage(pageName);
  },
  
  renderPage(pageName) {
    switch(pageName) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'entrada':
        this.renderEntrada();
        break;
      case 'saida':
        this.renderSaida();
        break;
      case 'vagas':
        this.renderVagas();
        break;
      case 'relatorios':
        this.renderRelatorios();
        break;
    }
  },
  
  renderDashboard() {
    const stats = AppState.getStats();
    
    // Update stats
    document.getElementById('availableSpots').textContent = stats.availableSpots;
    document.getElementById('occupiedSpots').textContent = stats.occupiedSpots;
    document.getElementById('pcdSpots').textContent = stats.pcdSpots;
    document.getElementById('dashboardUserName').textContent = AppState.currentUser.name;
    
    // Show revenue card only for gerente
    const revenueCard = document.getElementById('revenueCard');
    const revenueHeader = document.getElementById('revenueHeader');
    if (AppState.currentUser.role === 'gerente') {
      revenueCard.style.display = 'block';
      revenueHeader.style.display = 'table-cell';
      document.getElementById('dailyRevenue').textContent = 'R$ ' + stats.dailyRevenue.toFixed(2);
    } else {
      revenueCard.style.display = 'none';
      revenueHeader.style.display = 'none';
    }
    
    // Render recent records
    this.renderRecentRecords();
  },
  
  renderRecentRecords() {
    const tbody = document.getElementById('recentRecords');
    const records = AppState.records.slice(0, 5);
    
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum registro</td></tr>';
      return;
    }
    
    tbody.innerHTML = records.map(record => `
      <tr>
        <td>
          <span class="badge ${record.type === 'entrada' ? 'badge-success' : 'badge-danger'}">
            ${record.type === 'entrada' ? 'Entrada' : 'Saída'}
          </span>
        </td>
        <td class="font-mono font-bold">${record.plate}</td>
        <td>${record.spotNumber}</td>
        <td>${this.formatDateTime(record.timestamp)}</td>
        <td>${record.employee}</td>
        ${AppState.currentUser.role === 'gerente' ? `<td class="text-success font-bold">${record.amount ? 'R$ ' + record.amount.toFixed(2) : '-'}</td>` : ''}
      </tr>
    `).join('');
  },
  
  renderEntrada() {
    const stats = AppState.getStats();
    document.getElementById('entradaAvailable').textContent = stats.availableSpots;
    document.getElementById('entradaOccupied').textContent = stats.occupiedSpots;
    document.getElementById('entradaPcd').textContent = stats.pcdSpots;
    
    this.renderSpotsGrid('entradaSpotsGrid', 'entrada');
  },
  
  renderSaida() {
    // Reset form
    document.getElementById('saidaBuscaForm').reset();
    document.getElementById('saidaVehicleInfo').style.display = 'none';
    document.getElementById('saidaPagamentoCard').style.display = 'none';
    document.getElementById('saidaTrocoGroup').style.display = 'none';
    document.getElementById('saidaRecebido').value = '';
  },
  
  renderVagas() {
    const stats = AppState.getStats();
    document.getElementById('vagasAvailable').textContent = stats.availableSpots;
    document.getElementById('vagasOccupied').textContent = stats.occupiedSpots;
    document.getElementById('vagasPcd').textContent = stats.pcdSpots;
    
    this.renderSpotsGrid('vagasGrid', 'vagas');
    this.renderOccupiedVehicles();
  },
  
  renderOccupiedVehicles() {
    const occupied = AppState.spots.filter(s => s.status === 'occupied' && s.vehicle);
    const container = document.getElementById('occupiedVehiclesList');
    const card = document.getElementById('vagasOccupiedList');
    
    if (occupied.length === 0) {
      card.style.display = 'none';
      return;
    }
    
    card.style.display = 'block';
    container.innerHTML = occupied.map(spot => `
      <div class="card-parking">
        <div class="flex-between mb-lg">
          <div>
            <p class="text-muted text-sm">Vaga</p>
            <p class="text-2xl font-bold">${spot.spotNumber}</p>
          </div>
          <span style="font-size: 2rem;">🚗</span>
        </div>
        <div style="border-top: 1px solid var(--gray-200); padding-top: var(--spacing-md);">
          <div class="mb-md">
            <p class="text-xs text-muted">Placa</p>
            <p class="font-mono font-bold">${spot.vehicle.plate}</p>
          </div>
          <div class="mb-md">
            <p class="text-xs text-muted">Entrada</p>
            <p class="text-sm">${this.formatDateTime(spot.vehicle.entryTime)}</p>
          </div>
          <div>
            <p class="text-xs text-muted">Tempo estacionado</p>
            <p class="text-sm font-bold text-danger">${this.calculateDuration(spot.vehicle.entryTime)}</p>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  renderRelatorios() {
    const stats = AppState.getStats();
    document.getElementById('relTotalRecords').textContent = stats.totalRecords;
    document.getElementById('relEntradas').textContent = AppState.records.filter(r => r.type === 'entrada').length;
    document.getElementById('relSaidas').textContent = AppState.records.filter(r => r.type === 'saida').length;
    
    if (AppState.currentUser.role === 'gerente') {
      document.getElementById('relRevenueCard').style.display = 'block';
      document.getElementById('relValorHeader').style.display = 'table-cell';
      document.getElementById('relMetodoHeader').style.display = 'table-cell';
      document.getElementById('relRevenue').textContent = 'R$ ' + stats.dailyRevenue.toFixed(2);
    } else {
      document.getElementById('relRevenueCard').style.display = 'none';
      document.getElementById('relValorHeader').style.display = 'none';
      document.getElementById('relMetodoHeader').style.display = 'none';
    }
    
    this.updateRelatoriosTable();
  },
  
  updateRelatoriosTable() {
    const filtro = document.getElementById('relFiltro').value;
    let records = AppState.records;
    
    if (filtro !== 'all') {
      records = records.filter(r => r.type === filtro);
    }
    
    const tbody = document.getElementById('relatoriosTable');
    
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum registro</td></tr>';
      return;
    }
    
    tbody.innerHTML = records.map(record => `
      <tr>
        <td>
          <span class="badge ${record.type === 'entrada' ? 'badge-success' : 'badge-danger'}">
            ${record.type === 'entrada' ? 'Entrada' : 'Saída'}
          </span>
        </td>
        <td class="font-mono font-bold">${record.plate}</td>
        <td>${record.spotNumber}</td>
        <td>${this.formatDateTime(record.timestamp)}</td>
        <td>${record.employee}</td>
        ${AppState.currentUser.role === 'gerente' ? `<td class="text-success font-bold">${record.amount ? 'R$ ' + record.amount.toFixed(2) : '-'}</td>` : ''}
        ${AppState.currentUser.role === 'gerente' ? `<td class="text-sm capitalize">${record.paymentMethod || '-'}</td>` : ''}
      </tr>
    `).join('');
  },
  
  renderSpotsGrid(containerId, mode) {
    const container = document.getElementById(containerId);
    container.innerHTML = AppState.spots.map(spot => {
      let className = 'parking-spot ';
      if (spot.status === 'available') className += 'parking-spot-available';
      else if (spot.status === 'occupied') className += 'parking-spot-occupied';
      else className += 'parking-spot-pcd';
      
      if (mode === 'entrada' && AppState.selectedSpot === spot.spotNumber) {
        className += ' parking-spot-selected';
      }
      
      return `
        <button 
          class="${className}" 
          ${spot.status !== 'available' && mode === 'entrada' ? 'disabled' : ''}
          onclick="UI.selectSpot('${spot.spotNumber}', '${mode}')"
          title="${spot.vehicle ? 'Placa: ' + spot.vehicle.plate : 'Vaga disponível'}"
        >
          ${spot.spotNumber}
        </button>
      `;
    }).join('');
  },
  
  selectSpot(spotNumber, mode) {
    if (mode === 'entrada') {
      AppState.selectedSpot = spotNumber;
      document.getElementById('entradaVagaSelecionada').textContent = spotNumber;
      this.renderSpotsGrid('entradaSpotsGrid', 'entrada');
    }
  },
  
  formatDateTime(date) {
    return new Date(date).toLocaleString('pt-BR');
  },
  
  calculateDuration(entryTime) {
    const minutes = Math.floor((Date.now() - new Date(entryTime).getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  },
  
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background-color: ${type === 'success' ? '#10B981' : '#EF4444'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
};

// ============================================
// EVENT LISTENERS
// ============================================

function initEventListeners() {
  // Login
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Role selection
  document.querySelectorAll('.role-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.role-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.selectedRole = btn.dataset.role;
    });
  });
  
  // Navigation
  document.querySelectorAll('.sidebar-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page) {
        // Verificar permissoes baseado no perfil
        if (AppState.currentUser.role === 'gerente' && ['entrada', 'saida', 'vagas'].includes(page)) {
          UI.showNotification('Acesso restrito para gerentes', 'error');
          return;
        }
        UI.showPage(page);
      }
    });
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
  });
  
  // Entrada form
  document.getElementById('entradaForm').addEventListener('submit', handleEntrada);
  
  // Saída search
  document.getElementById('saidaBuscaForm').addEventListener('submit', handleSaidaBusca);
  document.getElementById('saidaMetodo').addEventListener('change', (e) => {
    const recebidoGroup = document.getElementById('saidaRecebidoGroup');
    if (e.target.value === 'dinheiro') {
      recebidoGroup.style.display = 'block';
    } else {
      recebidoGroup.style.display = 'none';
      document.getElementById('saidaTrocoGroup').style.display = 'none';
    }
  });
  document.getElementById('saidaRecebido').addEventListener('input', updateTroco);
  
  // Saída form
  document.getElementById('saidaPagamentoForm').addEventListener('submit', handleSaida);
  
  // Vagas
  document.getElementById('refreshVagasBtn').addEventListener('click', () => {
    AppState.generateMockSpots();
    UI.renderVagas();
    UI.showNotification('Vagas atualizadas!');
  });
  
  // Relatórios
  document.getElementById('relFiltro').addEventListener('change', () => {
    UI.updateRelatoriosTable();
  });
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
}

// ============================================
// HANDLERS
// ============================================

function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    UI.showNotification('Preencha todos os campos', 'error');
    return;
  }
  
  // Simulate login
  const displayName = username || (AppState.selectedRole === 'gerente' ? 'Carol Andrade' : 'Clara Maria');
  
  AppState.currentUser = {
    id: `user-${Date.now()}`,
    name: displayName,
    role: AppState.selectedRole,
    email: `${username}@estacionamento.com`
  };
  
  // Update UI
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('appContainer').classList.remove('hidden');
  document.body.classList.add('app-loaded');
  
  // Update header
  document.getElementById('userName').textContent = AppState.currentUser.name;
  document.getElementById('userAvatar').textContent = AppState.currentUser.name.charAt(0).toUpperCase();
  
  // Configurar navegacao baseado no perfil
  updateNavigation();
  
  // Show dashboard or relatorios based on role
  const initialPage = AppState.currentUser.role === 'gerente' ? 'relatorios' : 'dashboard';
  UI.showPage(initialPage);
  
  UI.showNotification(`Bem-vindo, ${AppState.currentUser.name}!`);
}

function handleLogout() {
  if (confirm('Deseja realmente sair?')) {
    AppState.currentUser = null;
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('loginPage').classList.add('active');
    document.body.classList.remove('app-loaded');
    document.getElementById('loginForm').reset();
    UI.showNotification('Desconectado com sucesso!');
  }
}

function handleEntrada(e) {
  e.preventDefault();
  
  const plate = document.getElementById('entradaPlaca').value.toUpperCase();
  const spot = AppState.selectedSpot;
  const observacao = document.getElementById('entradaObservacao').value;
  
  if (!plate || !spot) {
    UI.showNotification('Preencha todos os campos obrigatórios', 'error');
    return;
  }
  
  // Add record
  AppState.addRecord('entrada', plate, spot, AppState.currentUser.name);
  
  // Update spot status
  AppState.updateSpotStatus(spot, 'occupied');
  
  // Reset form
  document.getElementById('entradaForm').reset();
  AppState.selectedSpot = null;
  
  UI.renderEntrada();
  UI.showNotification('Entrada registrada com sucesso!');
  
  // Redirect to dashboard after 1s
  setTimeout(() => UI.showPage('dashboard'), 1000);
}

function handleSaidaBusca(e) {
  e.preventDefault();
  
  const plate = document.getElementById('saidaPlaca').value.toUpperCase();
  const vehicle = AppState.findVehicleByPlate(plate);
  
  if (!vehicle) {
    UI.showNotification('Veículo não encontrado', 'error');
    document.getElementById('saidaVehicleInfo').style.display = 'none';
    document.getElementById('saidaPagamentoCard').style.display = 'none';
    return;
  }
  
  // Show vehicle info
  document.getElementById('saidaPlacaInfo').textContent = vehicle.plate;
  document.getElementById('saidaVagaInfo').textContent = vehicle.spotNumber;
  document.getElementById('saidaEntradaInfo').textContent = UI.formatDateTime(vehicle.entryTime);
  document.getElementById('saidaDurationInfo').textContent = UI.calculateDuration(vehicle.entryTime);
  document.getElementById('saidaValor').textContent = vehicle.amount.toFixed(2);
  
  document.getElementById('saidaVehicleInfo').style.display = 'block';
  document.getElementById('saidaPagamentoCard').style.display = 'block';
  
  // Store vehicle info for later
  window.currentVehicle = vehicle;
}

function updateTroco() {
  const metodo = document.getElementById('saidaMetodo').value;
  if (metodo !== 'dinheiro') return;
  
  const valor = parseFloat(document.getElementById('saidaValor').textContent);
  const recebido = parseFloat(document.getElementById('saidaRecebido').value) || 0;
  const troco = recebido - valor;
  
  if (recebido > 0) {
    document.getElementById('saidaTrocoGroup').style.display = 'block';
    document.getElementById('saidaTroco').textContent = troco.toFixed(2);
    document.getElementById('saidaTroco').className = 'text-2xl font-bold ' + (troco >= 0 ? 'text-success' : 'text-danger');
  } else {
    document.getElementById('saidaTrocoGroup').style.display = 'none';
  }
}

function handleSaida(e) {
  e.preventDefault();
  
  if (!window.currentVehicle) {
    UI.showNotification('Busque um veículo primeiro', 'error');
    return;
  }
  
  const metodo = document.getElementById('saidaMetodo').value;
  const recebido = parseFloat(document.getElementById('saidaRecebido').value) || 0;
  const valor = window.currentVehicle.amount;
  
  if (metodo === 'dinheiro' && recebido < valor) {
    UI.showNotification('Valor recebido insuficiente', 'error');
    return;
  }
  
  // Add record
  AppState.addRecord('saida', window.currentVehicle.plate, window.currentVehicle.spotNumber, AppState.currentUser.name, valor, metodo);
  
  // Update spot status
  AppState.updateSpotStatus(window.currentVehicle.spotNumber, 'available');
  
  // Reset form
  document.getElementById('saidaBuscaForm').reset();
  document.getElementById('saidaPagamentoForm').reset();
  document.getElementById('saidaVehicleInfo').style.display = 'none';
  document.getElementById('saidaPagamentoCard').style.display = 'none';
  document.getElementById('saidaTrocoGroup').style.display = 'none';
  window.currentVehicle = null;
  
  UI.showNotification('Saída registrada com sucesso!');
  
  // Redirect to dashboard after 1s
  setTimeout(() => UI.showPage('dashboard'), 1000);
}

function exportCsv() {
  const filtro = document.getElementById('relFiltro').value;
  let records = AppState.records;
  
  if (filtro !== 'all') {
    records = records.filter(r => r.type === filtro);
  }
  
  let csv = 'Tipo,Placa,Vaga,Data/Hora,Funcionário';
  if (AppState.currentUser.role === 'gerente') {
    csv += ',Valor,Método';
  }
  csv += '\n';
  
  records.forEach(record => {
    csv += `${record.type},${record.plate},${record.spotNumber},${UI.formatDateTime(record.timestamp)},${record.employee}`;
    if (AppState.currentUser.role === 'gerente') {
      csv += `,${record.amount ? 'R$ ' + record.amount.toFixed(2) : '-'},${record.paymentMethod || '-'}`;
    }
    csv += '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  UI.showNotification('Relatório exportado!');
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
  initEventListeners();
});

function updateNavigation() {
  const isGerente = AppState.currentUser.role === 'gerente';
  
  document.querySelectorAll('.sidebar-nav-link').forEach(link => {
    const page = link.dataset.page;
    
    if (isGerente) {
      if (['entrada', 'saida', 'vagas'].includes(page)) {
        link.parentElement.style.display = 'none';
      } else {
        link.parentElement.style.display = 'block';
      }
    } else {
      link.parentElement.style.display = 'block';
    }
  });
}
