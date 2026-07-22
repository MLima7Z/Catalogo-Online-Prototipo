document.addEventListener("DOMContentLoaded", () => {
  const renderArea = document.getElementById("render-area");
  const modalProduto = document.getElementById("modal-produto");
  const btnNovoProduto = document.getElementById("btn-novo-produto");
  const btnFecharModal = document.getElementById("btn-fechar-modal");
  const formProdutoModal = document.getElementById("form-produto-modal");

  let categoriaAtual = "destaques";
  let produtoEditandoId = null; // Armazena ID para quando estiver editando

  // Quando o auth.js avisar que o painel abriu, carrega os produtos
  window.addEventListener("painelAberto", () => {
    carregarEExibirProdutos();
  });

  // --- CARREGAR E RENDERIZAR PRODUTOS (ESTRUTURA IGUAL A DO CLIENTE) ---
  async function carregarEExibirProdutos() {
    if (!renderArea) return;
    renderArea.innerHTML = "<p style='padding:2rem; color:#666;'>Buscando produtos...</p>";

    try {
      const { data: produtos, error } = await _supabase
        .from('produtos')
        .select('*')
        .eq('loja_id', 'casa-do-corredor');

      if (error) throw error;

      if (!produtos || produtos.length === 0) {
        renderArea.innerHTML = "<p style='padding:2rem; color:#666;'>Nenhum produto cadastrado no banco.</p>";
        return;
      }

      let htmlFinal = "";
      const linhasExistentes = [...new Set(produtos.map(p => p.linha))];

      linhasExistentes.forEach(linha => {
        const filtrados = produtos.filter(p => {
          let atendeCategoria = false;
          if (categoriaAtual === "todos") {
            atendeCategoria = true;
          } else if (Array.isArray(p.categoria)) {
            atendeCategoria = p.categoria.includes(categoriaAtual);
          } else if (typeof p.categoria === 'string') {
            atendeCategoria = p.categoria.toLowerCase().includes(categoriaAtual.toLowerCase());
          }

          const atendeLinha = p.linha === linha;
          return atendeCategoria && atendeLinha;
        });

        if (filtrados.length === 0) return;

        htmlFinal += `
          <div class="linha-secao">
            <h3 class="titulo-linha">${linha || 'Geral'}</h3>
            <div class="cards">
              ${filtrados.map(p => `
                <div class="card">
                  <img src="${p.imagem}" loading="lazy" alt="${p.nome}" onerror="this.src='https://placehold.co/260x180?text=Sem+Imagem'"/>
                  <p class="nome-produto">${p.nome || ''}</p>
                  <p class="descricao-produto">${p.descricao || ''}</p>
                  <p class="tamanhos-produto">Tam: ${p.tamanhos || ''}</p>
                  <p class="preco-produto">R$ ${p.preco || '0'}</p>
                  
                  <div style="display:flex; gap:8px; width:100%; margin-top:10px;">
                    <button onclick='prepararEdicao(${JSON.stringify(p)})' style="flex:1; background:#007bff; color:#fff; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">Modificar</button>
                    <button onclick="deletarProduto('${p.id}')" style="flex:1; background:#d9534f; color:#fff; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">Excluir</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      });

      if (htmlFinal === "") {
        htmlFinal = "<p style='padding:2rem; color:#666;'>Nenhum tênis encontrado nesta categoria.</p>";
      }

      renderArea.innerHTML = htmlFinal;

    } catch (err) {
      console.error("Erro no CRUD:", err);
      renderArea.innerHTML = `<p style='color:red; padding:1rem;'>Erro ao carregar lista: ${err.message}</p>`;
    }
  }

  // --- FILTRO DE CATEGORIAS ---
  const botoesCategoria = document.querySelectorAll(".categorias button");
  botoesCategoria.forEach(btn => {
    btn.addEventListener("click", (e) => {
      botoesCategoria.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      categoriaAtual = e.target.getAttribute("data-categoria") || e.target.dataset.categoria || "destaques";
      carregarEExibirProdutos();
    });
  });

  // --- ABRIR / FECHAR MODAL ---
  if (btnNovoProduto) {
    btnNovoProduto.addEventListener("click", () => {
      produtoEditandoId = null; // Reseta modo de edição para cadastro
      if (formProdutoModal) formProdutoModal.reset();
      if (modalProduto) {
        modalProduto.style.display = "flex";
        modalProduto.classList.remove("escondido");
      }
    });
  }

  if (btnFecharModal) {
    btnFecharModal.addEventListener("click", () => {
      if (modalProduto) {
        modalProduto.style.display = "none";
        modalProduto.classList.add("escondido");
      }
    });
  }

  // --- PREPARAR EDIÇÃO (PREENCHE O MODAL COM DADOS EXISTENTES) ---
  window.prepararEdicao = function(produto) {
    produtoEditandoId = produto.id;
    
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || "";
    };

    setVal("nome", produto.nome);
    setVal("preco", produto.preco);
    setVal("linha", produto.linha);
    setVal("whatsapp", produto.whatsapp);
    setVal("categoria", Array.isArray(produto.categoria) ? produto.categoria.join(", ") : produto.categoria);
    setVal("tamanhos", produto.tamanhos);
    setVal("tamanhos_esgotados", produto.tamanhos_esgotados);
    setVal("imagem", produto.imagem);
    setVal("descricao", produto.descricao);

    if (modalProduto) {
      modalProduto.style.display = "flex";
      modalProduto.classList.remove("escondido");
    }
  };

  // --- CADASTRAR OU ATUALIZAR PRODUTO ---
  if (formProdutoModal) {
    formProdutoModal.addEventListener("submit", async (e) => {
      e.preventDefault();

      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      const categoriasArray = getVal("categoria")
        .split(",")
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);

      const dadosProduto = {
        nome: getVal("nome"),
        preco: getVal("preco"),
        linha: getVal("linha"),
        whatsapp: getVal("whatsapp"),
        categoria: categoriasArray,
        tamanhos: getVal("tamanhos"),
        tamanhos_esgotados: getVal("tamanhos_esgotados"),
        imagem: getVal("imagem"),
        descricao: getVal("descricao"),
        loja_id: "casa-do-corredor"
      };

      try {
        if (produtoEditandoId) {
          // MODO UPDATE
          const { error } = await _supabase
            .from("produtos")
            .update(dadosProduto)
            .eq("id", produtoEditandoId);

          if (error) throw error;
          alert("Produto modificado com sucesso!");
        } else {
          // MODO INSERT
          const { error } = await _supabase
            .from("produtos")
            .insert([dadosProduto]);

          if (error) throw error;
          alert("Produto cadastrado com sucesso!");
        }

        formProdutoModal.reset();
        produtoEditandoId = null;
        if (modalProduto) modalProduto.style.display = "none";
        carregarEExibirProdutos();

      } catch (err) {
        alert("Erro ao salvar produto: " + err.message);
      }
    });
  }

  // --- EXCLUIR PRODUTO ---
  window.deletarProduto = async function(id) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      const { error } = await _supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
      carregarEExibirProdutos();
    } catch (err) {
      alert("Erro ao deletar: " + err.message);
    }
  };
});
