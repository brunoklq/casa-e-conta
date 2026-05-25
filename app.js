// ============================================================
// Casa & Conta — versão Firebase
// Autenticação: Google Sign-In
// Banco: Firestore (sincronização em tempo real)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { firebaseConfig } from "./config.js";

// ===== Inicializa Firebase =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Coleção compartilhada: todos os usuários autenticados leem/escrevem aqui
const COLECAO = "lancamentos";

const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const mesesLongos = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const catConfig = {
  'Casa':            { icon: '🏠', cor: '#4a6b3a' },
  'Transporte':      { icon: '🚗', cor: '#c89b3c' },
  'Lazer':           { icon: '🎉', cor: '#c1542c' },
  'Saúde/Educação':  { icon: '🏥', cor: '#5b3a5a' },
  'Cartão':          { icon: '💳', cor: '#3d4f54' },
  'Investimentos':   { icon: '📈', cor: '#6b8a5a' },
};

let state = {
  user: null,
  lancamentos: [],
  tipo: 'saida',
  filtro: 'todos',
  mesFiltro: 'all',
  unsubscribe: null, // para desconectar o listener do Firestore ao sair
};

// ============================================================
// AUTENTICAÇÃO
// ============================================================
function setupAuth() {
  document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        errEl.textContent = 'Login cancelado.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errEl.textContent = 'Este domínio não está autorizado no Firebase. Adicione-o em Authentication → Settings → Authorized domains.';
      } else {
        errEl.textContent = 'Erro ao entrar: ' + (err.message || err.code);
      }
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      state.user = user;
      mostrarApp();
      conectarFirestore();
    } else {
      state.user = null;
      desconectarFirestore();
      mostrarLogin();
    }
  });
}

function mostrarLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'none';
}

function mostrarApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('loadingScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';

  // Atualiza info do usuário no header
  const photo = document.getElementById('userPhoto');
  const name = document.getElementById('userName');
  if (state.user.photoURL) {
    photo.src = state.user.photoURL;
    photo.style.display = 'block';
  } else {
    photo.style.display = 'none';
  }
  name.textContent = (state.user.displayName || state.user.email || '').split(' ')[0];
}

async function logout() {
  if (!confirm('Sair da conta?')) return;
  try {
    await signOut(auth);
    toast('Você saiu da conta');
  } catch (err) {
    console.error(err);
  }
}

// ============================================================
// FIRESTORE (banco em tempo real)
// ============================================================
function conectarFirestore() {
  setSync('Conectando...');
  const q = query(collection(db, COLECAO), orderBy('data', 'desc'));

  state.unsubscribe = onSnapshot(q, (snapshot) => {
    state.lancamentos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Primeira vez: mostra o app
    if (document.getElementById('appScreen').style.display === 'none') {
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('appScreen').style.display = 'block';
    }

    populateMonthFilter();
    render();
    setSync('Sincronizado');
  }, (err) => {
    console.error('Erro Firestore:', err);
    setSync('Erro ao sincronizar');
    if (err.code === 'permission-denied') {
      alert('Permissão negada. Verifique as regras do Firestore.');
    }
  });
}

function desconectarFirestore() {
  if (state.unsubscribe) {
    state.unsubscribe();
    state.unsubscribe = null;
  }
  state.lancamentos = [];
}

async function adicionarLancamento(lanc) {
  try {
    setSync('Salvando...');
    await addDoc(collection(db, COLECAO), {
      ...lanc,
      criadoEm: serverTimestamp(),
      criadoPor: state.user.uid,
      criadoPorNome: state.user.displayName || state.user.email,
    });
    // O onSnapshot vai atualizar a tela automaticamente
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar: ' + err.message);
    setSync('Erro ao salvar');
  }
}

async function removerLancamento(id) {
  try {
    await deleteDoc(doc(db, COLECAO, id));
  } catch (err) {
    console.error(err);
    alert('Erro ao remover: ' + err.message);
  }
}

// ============================================================
// HELPERS
// ============================================================
const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBR = v => 'R$ ' + fmt(v);

function setSync(text) {
  const el = document.getElementById('syncText');
  if (el) el.textContent = text;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function getMesAno(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function getLancsFiltrados() {
  let arr = state.lancamentos;
  if (state.mesFiltro !== 'all') {
    arr = arr.filter(l => getMesAno(l.data) === state.mesFiltro);
  }
  return arr;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============================================================
// RENDER
// ============================================================
function render() {
  const lancs = getLancsFiltrados();
  const entradas = lancs.filter(l => l.tipo === 'entrada');
  const saidas = lancs.filter(l => l.tipo === 'saida');

  const totalE = entradas.reduce((s, l) => s + l.valor, 0);
  const totalS = saidas.reduce((s, l) => s + l.valor, 0);
  const saldo = totalE - totalS;

  document.getElementById('totalEntradas').textContent = fmt(totalE);
  document.getElementById('totalSaidas').textContent = fmt(totalS);
  document.getElementById('totalSaldo').textContent = fmt(Math.abs(saldo));
  document.getElementById('countEntradas').textContent = `${entradas.length} ${entradas.length === 1 ? 'lançamento' : 'lançamentos'}`;
  document.getElementById('countSaidas').textContent = `${saidas.length} ${saidas.length === 1 ? 'lançamento' : 'lançamentos'}`;

  const cardSaldo = document.getElementById('cardSaldo');
  cardSaldo.classList.toggle('negativo', saldo < 0);
  const saldoMsg = document.getElementById('saldoMsg');
  if (state.lancamentos.length === 0) {
    saldoMsg.textContent = 'Comecem registrando uma entrada';
  } else if (saldo > 0) {
    saldoMsg.textContent = `Sobraram ${fmtBR(saldo)} — bom trabalho!`;
  } else if (saldo < 0) {
    saldoMsg.textContent = `Faltaram ${fmtBR(Math.abs(saldo))} — atenção`;
  } else {
    saldoMsg.textContent = 'Equilibrado, exato';
  }

  const brandMonth = document.getElementById('brandMonth');
  if (state.mesFiltro === 'all') {
    brandMonth.textContent = 'histórico completo';
  } else {
    const [ano, mes] = state.mesFiltro.split('-');
    brandMonth.textContent = `${mesesLongos[parseInt(mes)-1].toLowerCase()} ${ano}`;
  }

  // Categorias
  const catTotal = {};
  Object.keys(catConfig).forEach(c => catTotal[c] = 0);
  saidas.forEach(l => { catTotal[l.categoria] = (catTotal[l.categoria] || 0) + l.valor; });

  const catList = document.getElementById('catList');
  catList.innerHTML = '';
  const cats = Object.entries(catTotal).sort((a, b) => b[1] - a[1]);
  cats.forEach(([nome, valor]) => {
    const pct = totalS > 0 ? (valor / totalS) * 100 : 0;
    const cfg = catConfig[nome];
    catList.innerHTML += `
      <div class="cat-item">
        <div class="cat-head">
          <div class="cat-name"><span class="cat-icon" style="background:${cfg.cor}22">${cfg.icon}</span>${nome}</div>
          <div class="cat-amount">${fmtBR(valor)}</div>
        </div>
        <div class="cat-bar">
          <div class="cat-bar-fill" style="width:${pct}%; background:${cfg.cor}"></div>
        </div>
        <div class="cat-pct">${pct.toFixed(1)}% do total</div>
      </div>
    `;
  });

  // Lançamentos
  const transList = document.getElementById('transList');
  let listaFiltrada = lancs;
  if (state.filtro !== 'todos') {
    listaFiltrada = lancs.filter(l => l.tipo === state.filtro);
  }
  listaFiltrada.sort((a, b) => b.data.localeCompare(a.data));

  if (listaFiltrada.length === 0) {
    transList.innerHTML = `
      <div class="empty">
        <div class="empty-icon">∅</div>
        <div class="empty-text">Nenhum lançamento ainda neste filtro.</div>
      </div>
    `;
  } else {
    transList.innerHTML = listaFiltrada.map(l => {
      const d = new Date(l.data + 'T00:00:00');
      const cfg = l.tipo === 'saida' ? catConfig[l.categoria] : { icon: '💰', cor: '#4a6b3a' };
      const tag = l.tipo === 'saida'
        ? `<span class="trans-tag" style="background:${cfg.cor}22;color:${cfg.cor}">${cfg.icon} ${l.categoria}</span>`
        : `<span class="trans-tag" style="background:#4a6b3a22;color:#4a6b3a">${cfg.icon} ${l.origem || 'Entrada'}</span>`;
      const quem = l.criadoPorNome ? l.criadoPorNome.split(' ')[0] : (l.quem || '');
      const sub = l.tipo === 'saida'
        ? `${l.forma} · pago por ${l.quem} · lançado por ${quem}`
        : `${l.recebido === 'Não' ? 'A receber' : 'Recebido'} · lançado por ${quem}`;
      return `
        <div class="trans-row">
          <div class="trans-date">
            <div class="trans-day">${d.getDate()}</div>
            <div class="trans-month">${meses[d.getMonth()]}</div>
          </div>
          <div class="trans-info">
            <div class="trans-desc">${escapeHtml(l.descricao)}</div>
            <div class="trans-meta">${tag} · ${escapeHtml(sub)}</div>
          </div>
          <div class="trans-amount ${l.tipo}">${fmtBR(l.valor)}</div>
          <button class="trans-delete" data-id="${l.id}" title="Remover">×</button>
        </div>
      `;
    }).join('');
  }

  // Insights
  const maiorCat = cats.find(([, v]) => v > 0);
  if (maiorCat) {
    document.getElementById('maiorCat').textContent = maiorCat[0];
    const pctMaior = totalS > 0 ? ((maiorCat[1] / totalS) * 100).toFixed(0) : 0;
    document.getElementById('maiorCatDesc').textContent = `${fmtBR(maiorCat[1])} · ${pctMaior}% das saídas`;
  } else {
    document.getElementById('maiorCat').textContent = '—';
    document.getElementById('maiorCatDesc').textContent = 'Adicione gastos para ver';
  }

  const ticket = saidas.length > 0 ? totalS / saidas.length : 0;
  document.getElementById('ticketMedio').textContent = fmtBR(ticket);

  const taxa = totalE > 0 ? ((saldo / totalE) * 100) : 0;
  document.getElementById('taxaPoupanca').textContent = `${taxa.toFixed(0)}%`;
}

function populateMonthFilter() {
  const sel = document.getElementById('monthFilter');
  const mesesSet = new Set(state.lancamentos.map(l => getMesAno(l.data)));
  const current = state.mesFiltro;
  sel.innerHTML = '<option value="all">Todos os meses</option>';
  [...mesesSet].sort().reverse().forEach(m => {
    const [ano, mes] = m.split('-');
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = `${mesesLongos[parseInt(mes)-1]} ${ano}`;
    sel.appendChild(opt);
  });
  sel.value = mesesSet.has(current) || current === 'all' ? current : 'all';
}

// ============================================================
// EXPORTAÇÃO
// ============================================================
function exportarJSON() {
  if (state.lancamentos.length === 0) { toast('Nada para exportar ainda'); return; }
  const data = {
    versao: 2,
    fonte: 'firebase',
    exportadoEm: new Date().toISOString(),
    lancamentos: state.lancamentos,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `casa-e-conta_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('✓ Backup exportado');
}

function exportarCSV() {
  if (state.lancamentos.length === 0) { toast('Nada para exportar ainda'); return; }
  const headers = ['Data','Tipo','Categoria/Origem','Descrição','Valor','Forma/Status','Quem pagou','Lançado por'];
  const rows = state.lancamentos
    .slice()
    .sort((a, b) => b.data.localeCompare(a.data))
    .map(l => [
      l.data,
      l.tipo,
      l.tipo === 'saida' ? l.categoria : l.origem,
      l.descricao,
      l.valor.toFixed(2).replace('.', ','),
      l.tipo === 'saida' ? l.forma : l.recebido,
      l.quem,
      l.criadoPorNome || '',
    ]);
  const csv = [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `casa-e-conta_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('✓ CSV exportado');
}

// ============================================================
// UI SETUP
// ============================================================
function setupForm() {
  document.getElementById('data').valueAsDate = new Date();

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.tipo = tab.dataset.tipo;
      const btn = document.getElementById('submitBtn');
      if (state.tipo === 'saida') {
        btn.textContent = 'Adicionar saída';
        btn.className = 'btn saida';
        document.getElementById('rowCategoria').style.display = 'grid';
        document.getElementById('rowOrigem').style.display = 'none';
      } else {
        btn.textContent = 'Adicionar entrada';
        btn.className = 'btn entrada';
        document.getElementById('rowCategoria').style.display = 'none';
        document.getElementById('rowOrigem').style.display = 'grid';
      }
    });
  });

  document.getElementById('lancForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const valor = parseFloat(document.getElementById('valor').value);
    if (!valor || valor <= 0) return;

    const lanc = {
      tipo: state.tipo,
      data: document.getElementById('data').value,
      descricao: document.getElementById('descricao').value,
      valor: valor,
      quem: document.getElementById('quem').value,
    };
    if (state.tipo === 'saida') {
      lanc.categoria = document.getElementById('categoria').value;
      lanc.forma = document.getElementById('forma').value;
    } else {
      lanc.origem = document.getElementById('origem').value;
      lanc.recebido = document.getElementById('recebido').value;
    }

    document.getElementById('valor').value = '';
    document.getElementById('descricao').value = '';
    document.getElementById('descricao').focus();

    await adicionarLancamento(lanc);
    toast(state.tipo === 'saida' ? '✓ Saída registrada' : '✓ Entrada registrada');
  });

  document.querySelectorAll('.pill').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      state.filtro = p.dataset.filter;
      render();
    });
  });

  document.getElementById('monthFilter').addEventListener('change', (e) => {
    state.mesFiltro = e.target.value;
    render();
  });

  document.getElementById('transList').addEventListener('click', async (e) => {
    const btn = e.target.closest('.trans-delete');
    if (!btn) return;
    if (!confirm('Remover este lançamento?')) return;
    await removerLancamento(btn.dataset.id);
    toast('✓ Lançamento removido');
  });

  // Dropdown menu
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('dropdownMenu');
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
  menu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    menu.classList.remove('open');
    if (action === 'export') exportarJSON();
    if (action === 'exportCsv') exportarCSV();
    if (action === 'logout') logout();
  });
}

// ============================================================
// INIT
// ============================================================
setupAuth();
setupForm();
