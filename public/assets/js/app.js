// Estrutura JSON simulando os dados do projeto 
const dados = [
  {
    id: 1,
    titulo: "Cânions de Furnas",
    descricao: "Paisagens incríveis e passeios de lancha inesquecíveis.",
    conteudo: "Os Cânions de Furnas são um dos principais atrativos de Capitólio, com águas verdes e paredões impressionantes. É possível realizar passeios de lancha e conhecer diversas cachoeiras durante o trajeto.",
    categoria: "Natureza",
    local: "Capitólio - MG",
  imagem: "assets/img/canions.jpg"
  },
  {
    id: 2,
    titulo: "Mirante dos Cânions",
    descricao: "Um dos melhores pontos de observação da região.",
    conteudo: "O Mirante dos Cânions é o local ideal para apreciar o pôr do sol e as paisagens de tirar o fôlego. De fácil acesso, o mirante é parada obrigatória para quem visita Capitólio.",
    categoria: "Turismo",
    local: "Capitólio - MG",
  imagem: "assets/img/principal.JPG"
  },
  {
    id: 3,
    titulo: "Cachoeira Lagoa Azul",
    descricao: "Águas cristalinas e ambiente perfeito para relaxar.",
    conteudo: "A Lagoa Azul é uma das cachoeiras mais conhecidas de Capitólio. Suas águas azuis e calmas formam um cenário perfeito para fotos e banhos refrescantes.",
    categoria: "Cachoeiras",
    local: "Capitólio - MG",
  imagem: "assets/img/lagoa.JPG"
  }
];

function carregarHome() {
  const container = document.getElementById("cards-container");
  console.log("Container encontrado:", container); // Debug
  if (!container) return;

  container.innerHTML = dados.map(item => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <img src="${item.imagem}" class="card-img-top" alt="${item.titulo}">
        <div class="card-body">
          <h5 class="card-title">${item.titulo}</h5>
          <p class="card-text">${item.descricao}</p>
          <a href="detalhes.html?id=${item.id}" class="btn btn-info btn-sm">Ver detalhes</a>
        </div>
      </div>
    </div>
  `).join('');
}

function carregarDetalhes() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  console.log("ID buscado:", id);
  
  const item = dados.find(d => d.id === id);
  console.log("Item encontrado:", item);

  const container = document.getElementById("detalhes");
  if (!container) return;

  if (!item) {
    container.innerHTML = "<p>Item não encontrado.</p>";
    return;
  }

  container.innerHTML = `
    <div class="card mb-4 shadow">
      <img src="${item.imagem}" class="card-img-top" alt="${item.titulo}">
      <div class="card-body">
        <h2 class="card-title">${item.titulo}</h2>
        <p class="text-muted">${item.categoria} | ${item.local}</p>
        <p class="lead">${item.descricao}</p>
        <p>${item.conteudo}</p>
        <a href="index.html" class="btn btn-secondary mt-3">Voltar</a>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado - executando funções"); // Debug
  carregarHome();
  carregarDetalhes();
});