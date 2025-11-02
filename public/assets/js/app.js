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
      // imagem pode ser caminho relativo "assets/img/..." OU apenas nome "principal.JPG"
      const imagemCampo = pick(item, ["imagem_principal", "imagem", "image", "imagem_path"]);
      // normaliza caminho da imagem:
      let imagemPath = imagemCampo || "";
      if (imagemPath && !imagemPath.startsWith("http") && !imagemPath.startsWith("/")) {
        // tenta já ser relativo à pasta assets/img, mas não sobrescreve se já tiver assets/
        if (!imagemPath.startsWith("assets/")) imagemPath = `assets/img/${imagemPath}`;
      }

      const card = document.createElement("div");
      card.className = "col-md-4 mb-4";
      card.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${imagemPath || 'assets/img/principal.JPG'}" class="card-img-top" alt="${nome}">
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
    let imagemPath = imagemCampo || "";
    if (imagemPath && !imagemPath.startsWith("http") && !imagemPath.startsWith("/")) {
      if (!imagemPath.startsWith("assets/")) imagemPath = `assets/img/${imagemPath}`;
    }

    container.innerHTML = `
      <div class="row">
        <div class="col-lg-7">
          <img src="${imagemPath || 'assets/img/principal.JPG'}" class="img-fluid rounded mb-3" alt="${nome}">
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
          let caminho = aimagem || "";
          if (caminho && !caminho.startsWith("http") && !caminho.startsWith("/")) {
            if (!caminho.startsWith("assets/")) caminho = `assets/img/${caminho}`;
          }
          return `
            <div class="col-md-4 mb-3">
              <div class="card">
                <img src="${caminho || 'assets/img/principal.JPG'}" class="card-img-top" alt="${anome}">
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

// INICIALIZAÇÃO conforme página
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.toLowerCase();
  // tenta suportar acessos via /public/index.html ou /index.html
  if (path.includes("index.html") || path.endsWith("/") || path.includes("/public")) {
    // se existir o container de cards chamamos
    if (document.getElementById("cards-container") || document.getElementById("lugares-container") || document.getElementById("cardsContainer")) {
      carregarLugares();
    }
  }
  if (path.includes("detalhes.html") || path.includes("detalhe.html")) {
    if (document.getElementById("detalheMain") || document.getElementById("detalhes-container") || document.getElementById("detalhes")) {
      carregarDetalhes();
    }
  }
});
