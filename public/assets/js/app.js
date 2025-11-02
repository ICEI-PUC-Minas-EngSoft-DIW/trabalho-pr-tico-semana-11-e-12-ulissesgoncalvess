// app.js — versão robusta para depuração e fallback de campos
const API_URL = "http://localhost:3000/lugares";

// util: pega campo com fallback entre várias opções
function pick(obj, keys, fallback = "") {
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  return fallback;
}

function showAlert(msg, type = "danger") {
  // tenta mostrar alerta na página se existir um placeholder
  const el = document.querySelector("#alertPlaceholder");
  if (el) el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  console[type === "danger" ? "error" : "log"](msg);
}

// Função para detectar se é Data URL (base64)
function isDataURL(str) {
  return str.startsWith('data:image');
}

// Função para normalizar caminho da imagem
function normalizeImagePath(imagemPath) {
  if (!imagemPath) return 'assets/img/principal.JPG';
  
  // Se for Data URL, retorna direto
  if (isDataURL(imagemPath)) {
    return imagemPath;
  }
  
  // Se for caminho relativo, ajusta
  if (imagemPath && !imagemPath.startsWith("http") && !imagemPath.startsWith("/") && !imagemPath.startsWith("data:")) {
    if (!imagemPath.startsWith("assets/")) {
      return `assets/img/${imagemPath}`;
    }
  }
  
  return imagemPath;
}

// CARREGA LISTA DE LUGARES (INDEX)
async function carregarLugares() {
  const containerIds = ["cards-container", "cards_container", "lugares-container", "cardsContainer"];
  let container = null;
  for (const id of containerIds) {
    container = document.getElementById(id);
    if (container) break;
  }
  if (!container) {
    console.error("Nenhum container de cards encontrado. Procurados:", containerIds);
    return;
  }

  container.innerHTML = "<p>Carregando...</p>";

  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      showAlert(`Erro HTTP ao buscar /lugares: ${res.status}`, "danger");
      container.innerHTML = `<p class="text-danger">Erro ao carregar lugares (status ${res.status}). Veja console.</p>`;
      return;
    }
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Resposta /lugares não é array:", data);
      container.innerHTML = `<p class="text-warning">Resposta inválida do servidor. Verifique db.json.</p>`;
      return;
    }

    if (data.length === 0) {
      container.innerHTML = "<p>Nenhum lugar cadastrado.</p>";
      return;
    }

    // monta os cards (tolerante a campos diferentes)
    container.innerHTML = "";
    data.forEach((item) => {
      // suporta vários nomes possíveis vindo do db.json
      const id = pick(item, ["id", "ID"]);
      const nome = pick(item, ["nome", "titulo", "name"]);
      const descricao = pick(item, ["descricao", "descricao_curta", "description"]);
      // imagem pode ser caminho relativo "assets/img/..." OU Data URL (base64)
      const imagemCampo = pick(item, ["imagem_principal", "imagem", "image", "imagem_path"]);
      
      // normaliza caminho da imagem (agora suporta Data URL também)
      const imagemPath = normalizeImagePath(imagemCampo);

      const card = document.createElement("div");
      card.className = "col-md-4 mb-4";
      card.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${imagemPath}" class="card-img-top" alt="${nome}" 
               style="height: 200px; object-fit: cover;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${nome || "Sem título"}</h5>
            <p class="card-text">${descricao || ""}</p>
            <div class="mt-auto d-flex gap-2">
              <a href="detalhes.html?id=${id}" class="btn btn-primary btn-sm">Ver detalhes</a>
              <a href="cadastro_lugar.html?id=${id}" class="btn btn-outline-secondary btn-sm">Editar</a>
            </div>
          </div>
        </div>`;
      container.appendChild(card);
    });

    console.log(`Renderizados ${data.length} cards a partir de ${API_URL}`);
  } catch (err) {
    console.error("Erro fetch/carregarLugares:", err);
    container.innerHTML = `<p class="text-danger">Erro ao carregar lugares. Ver console (F12).</p>`;
    showAlert("Erro ao buscar os lugares (ver console).", "danger");
  }
}

// DETALHES (detalhes.html)
async function carregarDetalhes() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const container = document.getElementById("detalheMain") || document.getElementById("detalhes-container") || document.getElementById("detalhes");
  if (!container) {
    console.error("Container de detalhes não encontrado (ids esperados: detalheMain, detalhes-container, detalhes)");
    return;
  }
  if (!id) {
    container.innerHTML = `<div class="alert alert-warning">ID não informado na query string.</div>`;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) {
      container.innerHTML = `<div class="alert alert-danger">Erro ${res.status} ao buscar item ${id}</div>`;
      return;
    }
    const item = await res.json();

    // campos com fallback
    const nome = pick(item, ["nome", "titulo", "name"]);
    const conteudo = pick(item, ["conteudo", "content", "description", "descricao"]);
    const imagemCampo = pick(item, ["imagem_principal", "imagem", "image"]);
    
    // normaliza caminho da imagem (suporta Data URL)
    const imagemPath = normalizeImagePath(imagemCampo);

    container.innerHTML = `
      <div class="row">
        <div class="col-lg-7">
          <img src="${imagemPath}" class="img-fluid rounded mb-3" alt="${nome}" style="max-height: 400px; object-fit: cover;">
          <h2>${nome || "Sem título"}</h2>
          <p>${conteudo || ""}</p>
        </div>
        <div class="col-lg-5">
          <h5>Informações</h5>
          <ul class="list-group">
            <li class="list-group-item"><strong>ID:</strong> ${pick(item, ["id", "ID"])}</li>
            ${pick(item, ["pais", "country"]) ? `<li class="list-group-item"><strong>País:</strong> ${pick(item, ["pais", "country"])}</li>` : ""}
            ${pick(item, ["data", "date"]) ? `<li class="list-group-item"><strong>Data:</strong> ${pick(item, ["data", "date"])}</li>` : ""}
          </ul>
        </div>
      </div>
    `;

    // se houver array de atrações, renderiza
    const atracoes = item.atracoes || item.attractions || item.photos || [];
    if (Array.isArray(atracoes) && atracoes.length) {
      const html = atracoes
        .map((a) => {
          const anome = pick(a, ["nome", "title", "name"]);
          const adescr = pick(a, ["descricao", "description"]);
          const aimagem = pick(a, ["imagem", "image"]);
          const caminho = normalizeImagePath(aimagem);
          
          return `
            <div class="col-md-4 mb-3">
              <div class="card">
                <img src="${caminho}" class="card-img-top" alt="${anome}" style="height: 150px; object-fit: cover;">
                <div class="card-body">
                  <h6 class="card-title">${anome}</h6>
                  <p class="card-text">${adescr || ""}</p>
                </div>
              </div>
            </div>`;
        })
        .join("");
      container.insertAdjacentHTML("beforeend", `<h4 class="mt-4">Atrações</h4><div class="row">${html}</div>`);
    }
  } catch (err) {
    console.error("Erro carregarDetalhes:", err);
    container.innerHTML = `<div class="alert alert-danger">Erro ao carregar detalhes. Ver console.</div>`;
  }
}

// ========== SISTEMA DE GERENCIAMENTO DE IMAGENS ==========

function initImageHandler() {
  const fileInput = document.getElementById('imagemFile');
  const imageSelect = document.getElementById('imagemSelect');
  const customUrlContainer = document.getElementById('customUrlContainer');
  const imagemUrl = document.getElementById('imagemUrl');
  const preview = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');
  const previewText = document.getElementById('previewText');
  
  // Evento para upload de arquivo
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Verifica se é uma imagem
        if (!file.type.startsWith('image/')) {
          showAlert('Por favor, selecione apenas arquivos de imagem.', 'warning');
          return;
        }
        
        // Verifica tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showAlert('A imagem deve ter no máximo 5MB.', 'warning');
          return;
        }
        
        // Cria preview
        const reader = new FileReader();
        reader.onload = function(e) {
          previewImage.src = e.target.result;
          preview.style.display = 'block';
          previewText.style.display = 'none';
          
          // Salva como Data URL (base64) - AGORA FUNCIONA!
          document.getElementById('imagem').value = e.target.result;
          
          // Limpa outras seleções
          if (imageSelect) imageSelect.value = '';
          if (imagemUrl) imagemUrl.value = '';
          if (customUrlContainer) customUrlContainer.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Evento para seleção de imagem existente
  if (imageSelect) {
    imageSelect.addEventListener('change', function(e) {
      const value = e.target.value;
      
      if (value === 'custom') {
        if (customUrlContainer) customUrlContainer.style.display = 'block';
        if (preview) preview.style.display = 'none';
        document.getElementById('imagem').value = '';
      } else if (value) {
        if (previewImage) previewImage.src = value;
        if (preview) {
          preview.style.display = 'block';
          previewText.style.display = 'none';
        }
        document.getElementById('imagem').value = value;
        
        // Limpa outros inputs
        if (fileInput) fileInput.value = '';
        if (imagemUrl) imagemUrl.value = '';
        if (customUrlContainer) customUrlContainer.style.display = 'none';
      } else {
        if (preview) preview.style.display = 'none';
        document.getElementById('imagem').value = '';
      }
    });
  }
  
  // Evento para URL personalizada
  if (imagemUrl) {
    imagemUrl.addEventListener('input', function(e) {
      const url = e.target.value;
      if (url) {
        document.getElementById('imagem').value = url;
        
        // Tenta carregar preview se for URL válida
        if (url.startsWith('http') || url.startsWith('assets/')) {
          if (previewImage) previewImage.src = url;
          if (preview) {
            preview.style.display = 'block';
            previewText.style.display = 'none';
          }
        }
      }
    });
  }
}

// ========== FUNÇÕES CRUD PARA CADASTRO ==========

// CADASTRO/EDIÇÃO (cadastro_lugar.html)
function initCadastro() {
  const form = document.getElementById('lugarForm');
  const deleteBtn = document.getElementById('deleteBtn');
  const formTitle = document.getElementById('formTitle');
  
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  
  // Modo edição
  if (id) {
    formTitle.textContent = 'Editar Lugar';
    deleteBtn.classList.remove('d-none');
    carregarLugarParaEdicao(id);
  }
  
  if (form) {
    form.addEventListener('submit', salvarLugar);
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', excluirLugar);
  }
}

async function carregarLugarParaEdicao(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error('Erro ao carregar lugar');
    
    const lugar = await res.json();
    
    // Preenche o formulário
    document.getElementById('lugarId').value = lugar.id;
    document.getElementById('titulo').value = pick(lugar, ['titulo', 'nome']);
    document.getElementById('descricao').value = pick(lugar, ['descricao', 'descricao_curta']);
    document.getElementById('conteudo').value = pick(lugar, ['conteudo', 'content', 'descricao_longa']);
    document.getElementById('categoria').value = pick(lugar, ['categoria', 'category']);
    document.getElementById('local').value = pick(lugar, ['local', 'location']);
    
    // Preenche a imagem
    const imagem = pick(lugar, ['imagem', 'imagem_path']);
    if (imagem) {
      document.getElementById('imagem').value = imagem;
      
      // Atualiza preview
      const preview = document.getElementById('imagePreview');
      const previewImage = document.getElementById('previewImage');
      const previewText = document.getElementById('previewText');
      
      if (preview && previewImage) {
        previewImage.src = imagem;
        preview.style.display = 'block';
        if (previewText) previewText.style.display = 'none';
      }
    }
    
  } catch (err) {
    showAlert('Erro ao carregar dados para edição: ' + err.message);
  }
}

async function salvarLugar(e) {
  e.preventDefault();
  
  const id = document.getElementById('lugarId').value;
  const lugar = {
    titulo: document.getElementById('titulo').value,
    descricao: document.getElementById('descricao').value,
    conteudo: document.getElementById('conteudo').value,
    categoria: document.getElementById('categoria').value,
    local: document.getElementById('local').value,
    imagem: document.getElementById('imagem').value
  };
  
  // Validação básica
  if (!lugar.titulo || !lugar.descricao || !lugar.categoria || !lugar.local || !lugar.imagem) {
    showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  try {
    let response;
    if (id) {
      // PUT para atualizar
      response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lugar, id: parseInt(id) })
      });
    } else {
      // POST para criar
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lugar)
      });
    }
    
    if (!response.ok) throw new Error('Erro HTTP: ' + response.status);
    
    showAlert(`Lugar ${id ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
    
  } catch (err) {
    showAlert('Erro ao salvar: ' + err.message);
  }
}

async function excluirLugar() {
  const id = document.getElementById('lugarId').value;
  
  if (!confirm('Tem certeza que deseja excluir este lugar?')) return;
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Erro HTTP: ' + response.status);
    
    showAlert('Lugar excluído com sucesso!', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
    
  } catch (err) {
    showAlert('Erro ao excluir: ' + err.message);
  }
}

// ========== INICIALIZAÇÃO COMPLETA ==========
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.toLowerCase();
  
  // Página inicial
  if (path.includes("index.html") || path.endsWith("/") || path.includes("/public")) {
    if (document.getElementById("cards-container") || document.getElementById("lugares-container")) {
      carregarLugares();
    }
  }
  
  // Página de detalhes
  if (path.includes("detalhes.html") || path.includes("detalhe.html")) {
    if (document.getElementById("detalheMain") || document.getElementById("detalhes-container") || document.getElementById("detalhes")) {
      carregarDetalhes();
    }
  }
  
  // Página de cadastro
  if (path.includes("cadastro_lugar.html")) {
    if (document.getElementById("lugarForm")) {
      initCadastro();
      initImageHandler();
    }
  }
});