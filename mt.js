const container = document.querySelector("#render-area");
let categoriaAtual = "destaques";
let timeoutId = null;

function render() {
  if (!produtos || produtos.length === 0) {
    container.innerHTML = "<p style='padding:2rem; color:#666;'>Carregando produtos...</p>";
    return;
  }

  let htmlFinal = "";
  const linhasExistentes = [...new Set(produtos.map(p => p.linha))];
  
  linhasExistentes.forEach(linha => {
    const filtrados = produtos.filter(p => {
      const atendeCategoria = categoriaAtual === "todos" || (Array.isArray(p.categoria) && p.categoria.includes(categoriaAtual));
      const atendeLinha = p.linha === linha;
      return atendeCategoria && atendeLinha;
    });
    
    if (filtrados.length === 0) return;
    
    htmlFinal += `
      <div class="linha-secao">
        <h3 class="titulo-linha">${linha}</h3>
        <div class="cards">
          ${filtrados.map(p => {
            const mensagem = `Olá, vim pelo catálogo e queria saber se vocês ainda têm o ${p.nome}, quais tamanhos vocês têm?`;
            const linkWhatsapp = `https://wa.me/${p.whatsapp}?text=${encodeURIComponent(mensagem)}`;

            return `
              <div class="card">
                <img src="${p.imagem}" loading="lazy" alt="${p.nome}" onerror="this.src='https://placehold.co/260x180?text=Premium+Running'"/>
                <p class="nome-produto">${p.nome}</p>
                <p class="descricao-produto">${p.descricao}</p>
                <p class="tamanhos-produto">Tam: ${p.tamanhos}</p>
                <p class="preco-produto">R$ ${p.preco}</p>
                <a href="${linkWhatsapp}" target="_blank" class="btn-whatsapp">Garantir no WhatsApp</a>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  });
  
  if (htmlFinal === "") {
    htmlFinal = "<p style='padding:2rem; color:#666;'>Nenhum tênis encontrado nesta categoria.</p>";
  }
  
  container.innerHTML = htmlFinal;
}

document.querySelectorAll(".categorias button").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".categorias button").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    
    categoriaAtual = e.target.dataset.categoria;
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      render();
    }, 80);
  });
});
