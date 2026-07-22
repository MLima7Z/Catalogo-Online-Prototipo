const container = document.querySelector("#render-area");
let categoriaAtual = "destaques";
let timeoutId = null;
let produtosDoBanco = [];

// Guarda as escolhas e o CEP global do cliente
const escolhasProdutos = {};
let cepCliente = "";

// --- 1. BUSCA OS PRODUTOS NO SUPABASE ---
async function carregarProdutosDoSupabase() {
  if (!container) return;

  container.innerHTML = "<p style='padding:2rem; color:#666;'>Carregando produtos...</p>";

  try {
    const { data, error } = await _supabase
      .from('produtos')
      .select('*')
      .eq('loja_id', 'casa-do-corredor');

    if (error) throw error;

    produtosDoBanco = data || [];
    render();

  } catch (err) {
    console.error("Erro ao carregar vitrine:", err);
    container.innerHTML = `<p style='padding:2rem; color:red;'>Erro ao carregar catálogo: ${err.message}</p>`;
  }
}

// --- AUXILIAR GENÉRICA: CALCULA TAMANHOS DISPONÍVEIS ---
function obterTamanhosDisponiveis(stringTamanhos, stringEsgotados) {
  let min = 37, max = 43; 
  
  if (stringTamanhos && typeof stringTamanhos === 'string') {
    const match = stringTamanhos.match(/(\d+)\s*a\s*(\d+)/i);
    if (match) {
      min = parseInt(match[1], 10);
      max = parseInt(match[2], 10);
    }
  }

  let listaEsgotados = [];
  if (Array.isArray(stringEsgotados)) {
    listaEsgotados = stringEsgotados.map(n => parseInt(n, 10));
  } else if (stringEsgotados) {
    listaEsgotados = String(stringEsgotados)
      .split(",")
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n));
  }

  const disponiveis = [];
  for (let i = min; i <= max; i++) {
    if (!listaEsgotados.includes(i)) {
      disponiveis.push(i);
    }
  }

  return disponiveis;
}

// --- 2. RENDERIZA OS CARDS E A BARRA DE CEP ---
function render() {
  if (!container) return;

  // Injeta o campo de CEP fixo no topo da vitrine de produtos
  let htmlTopo = `
    <div style="background: #fff; padding: 15px; margin: 0 15px 20px 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center;">
      <label style="font-size: 0.9rem; font-weight: bold; color: #333; display: block; margin-bottom: 6px;">
        📍 Digite seu CEP para calcular o frete e liberar o pedido:
      </label>
      <input 
        type="text" 
        id="input-cep-cliente" 
        placeholder="Ex: 01001-000" 
        value="${cepCliente}" 
        oninput="atualizarCep(this.value)"
        maxlength="9"
        style="padding: 10px; width: 220px; border-radius: 6px; border: 1px solid #ccc; font-size: 1rem; text-align: center;"
      />
      ${!cepCliente.trim() ? '<p style="color: #d9534f; font-size: 0.75rem; margin-top: 5px;">* Obrigatório informar o CEP antes de prosseguir.</p>' : '<p style="color: #5cb85c; font-size: 0.75rem; margin-top: 5px;">✓ CEP informado!</p>'}
    </div>
  `;

  if (!produtosDoBanco || produtosDoBanco.length === 0) {
    container.innerHTML = htmlTopo + "<p style='padding:2rem; color:#666; text-align:center;'>Nenhum produto cadastrado.</p>";
    return;
  }

  let htmlProdutos = "";
  const linhasExistentes = [...new Set(produtosDoBanco.map(p => p.linha))];
  
  linhasExistentes.forEach(linha => {
    const filtrados = produtosDoBanco.filter(p => {
      let atendeCategoria = false;
      if (categoriaAtual === "todos") {
        atendeCategoria = true;
      } else if (Array.isArray(p.categoria)) {
        atendeCategoria = p.categoria.includes(categoriaAtual);
      } else if (typeof p.categoria === 'string') {
        atendeCategoria = p.categoria.toLowerCase().includes(categoriaAtual.toLowerCase());
      }

      return atendeCategoria && p.linha === linha;
    });
    
    if (filtrados.length === 0) return;
    
    htmlProdutos += `
      <div class="linha-secao">
        <h3 class="titulo-linha">${linha || 'Geral'}</h3>
        <div class="cards">
          ${filtrados.map((p) => {
            const idProd = p.id;
            const numWhatsapp = p.whatsapp || '5513997458616';
            
            const campoEsgotados = p.esgotados ?? p.tamanhos_esgotados ?? p.esgotado ?? "";
            const disponiveis = obterTamanhosDisponiveis(p.tamanhos, campoEsgotados);
            
            if (!escolhasProdutos[idProd]) {
              escolhasProdutos[idProd] = {
                tamanhoIndex: 0,
                pagamento: 'Pix'
              };
            }

            const indexAtual = escolhasProdutos[idProd].tamanhoIndex;
            const temTamanho = disponiveis.length > 0;
            const tamanhoExibido = temTamanho ? disponiveis[indexAtual] : "Esgotado";

            // Condição para travar o botão: Produto esgotado OU CEP vazio
            const cepValido = cepCliente.trim().length > 0;
            const podeComprar = temTamanho && cepValido;

            let textoBotao = "Garantir no WhatsApp";
            let estiloBotao = "";
            if (!temTamanho) {
              textoBotao = "Produto Esgotado";
              estiloBotao = "background:#999; cursor:not-allowed;";
            } else if (!cepValido) {
              textoBotao = "Informe o CEP acima";
              estiloBotao = "background:#d9534f; cursor:not-allowed;";
            }

            return `
              <div class="card">
                <img src="${p.imagem}" loading="lazy" alt="${p.nome}" onerror="this.src='https://placehold.co/260x180?text=Premium+Running'"/>
                <p class="nome-produto">${p.nome || ''}</p>
                <p class="descricao-produto">${p.descricao || ''}</p>
                <p class="preco-produto">R$ ${p.preco || '0'}</p>

                <!-- CONTROLE DE TAMANHO -->
                <div style="width:100%; margin-bottom:12px;">
                  <label style="font-size:0.8rem; font-weight:bold; color:#555; display:block; margin-bottom:4px;">Tamanho:</label>
                  
                  <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                    <button 
                      type="button" 
                      onclick="alterarTamanho('${idProd}', -1)" 
                      style="width:35px; height:35px; font-size:1.2rem; font-weight:bold; border-radius:6px; border:1px solid #ccc; background:#e6e6e6; cursor:pointer;"
                      ${!temTamanho || indexAtual === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>-</button>
                    
                    <span style="font-size:1.1rem; font-weight:bold; width:80px; text-align:center; color:#272835;">
                      ${tamanhoExibido}
                    </span>
                    
                    <button 
                      type="button" 
                      onclick="alterarTamanho('${idProd}', 1)" 
                      style="width:35px; height:35px; font-size:1.2rem; font-weight:bold; border-radius:6px; border:1px solid #ccc; background:#e6e6e6; cursor:pointer;"
                      ${!temTamanho || indexAtual === disponiveis.length - 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>+</button>
                  </div>
                </div>

                <!-- SELEÇÃO DE PAGAMENTO -->
                <div style="width:100%; text-align:left; margin-bottom:12px;">
                  <label style="font-size:0.8rem; font-weight:bold; color:#555;">Pagamento:</label>
                  <select onchange="salvarPagamento('${idProd}', this.value)" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; margin-top:2px;">
                    <option value="Pix" ${escolhasProdutos[idProd].pagamento === 'Pix' ? 'selected' : ''}>Pix</option>
                    <option value="Cartão de Crédito" ${escolhasProdutos[idProd].pagamento === 'Cartão de Crédito' ? 'selected' : ''}>Cartão de Crédito</option>
                  </select>
                </div>

                <button 
                  onclick="enviarPedido('${idProd}', '${p.nome}', '${p.preco || '0'}', '${numWhatsapp}')" 
                  class="btn-whatsapp"
                  style="${estiloBotao}"
                  ${!podeComprar ? 'disabled' : ''}>
                  ${textoBotao}
                </button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  });
  
  if (htmlProdutos === "") {
    htmlProdutos = "<p style='padding:2rem; color:#666; text-align:center;'>Nenhum tênis encontrado nesta categoria.</p>";
  }
  
  container.innerHTML = htmlTopo + htmlProdutos;
}

// --- CAPTURA E ATUALIZAÇÃO DO CEP ---
window.atualizarCep = function(valor) {
  cepCliente = valor;
  // Atualiza dinamicamente os estados dos botões sem re-renderizar tudo do zero (evita perder o foco do input)
  const botoes = document.querySelectorAll('.btn-whatsapp');
  const avisoCep = document.querySelector('#input-cep-cliente').nextElementSibling;
  const temCep = cepCliente.trim().length > 0;

  if (avisoCep) {
    avisoCep.innerHTML = temCep ? '✓ CEP informado!' : '* Obrigatório informar o CEP antes de prosseguir.';
    avisoCep.style.color = temCep ? '#5cb85c' : '#d9534f';
  }

  botoes.forEach(btn => {
    // Se o botão não estiver desativado por estoque esgotado, ajusta conforme o CEP
    if (!btn.innerText.includes("Esgotado")) {
      if (temCep) {
        btn.disabled = false;
        btn.style.background = "";
        btn.style.cursor = "pointer";
        btn.innerText = "Garantir no WhatsApp";
      } else {
        btn.disabled = true;
        btn.style.background = "#d9534f";
        btn.style.cursor = "not-allowed";
        btn.innerText = "Informe o CEP acima";
      }
    }
  });
};

window.alterarTamanho = function(idProduto, direcao) {
  const produto = produtosDoBanco.find(p => String(p.id) === String(idProduto));
  if (!produto) return;

  const campoEsgotados = produto.esgotados ?? produto.tamanhos_esgotados ?? produto.esgotado ?? "";
  const disponiveis = obterTamanhosDisponiveis(produto.tamanhos, campoEsgotados);

  if (disponiveis.length === 0) return;

  let atual = escolhasProdutos[idProduto] ? escolhasProdutos[idProduto].tamanhoIndex : 0;
  let novoIndex = atual + direcao;

  if (novoIndex >= 0 && novoIndex < disponiveis.length) {
    escolhasProdutos[idProduto].tamanhoIndex = novoIndex;
    render();
  }
};

window.salvarPagamento = function(idProduto, valor) {
  if (!escolhasProdutos[idProduto]) {
    escolhasProdutos[idProduto] = { tamanhoIndex: 0, pagamento: 'Pix' };
  }
  escolhasProdutos[idProduto].pagamento = valor;
};

// --- ENVIO DA MENSAGEM COM PREÇO E CEP ---
window.enviarPedido = function(idProduto, nomeProduto, precoProduto, whatsapp) {
  if (!cepCliente.trim()) {
    alert("Por favor, informe o seu CEP no topo da página antes de continuar.");
    return;
  }

  const produto = produtosDoBanco.find(p => String(p.id) === String(idProduto));
  const campoEsgotados = produto ? (produto.esgotados ?? produto.tamanhos_esgotados ?? produto.esgotado ?? "") : "";
  const disponiveis = obterTamanhosDisponiveis(produto ? produto.tamanhos : '', campoEsgotados);
  
  const escolhas = escolhasProdutos[idProduto] || { tamanhoIndex: 0, pagamento: 'Pix' };
  const tamanhoEscolhido = disponiveis[escolhas.tamanhoIndex] || "Não informado";
  
  let mensagem = `Olá! Vim pelo catálogo e quero o produto:\n`;
  mensagem += `👟 *${nomeProduto}*\n`;
  mensagem += `💰 *Preço:* R$ ${precoProduto}\n`;
  mensagem += `📏 *Tamanho:* ${tamanhoEscolhido}\n`;
  mensagem += `💳 *Pagamento:* ${escolhas.pagamento}\n`;
  mensagem += `📍 *CEP de Entrega:* ${cepCliente}`;

  const link = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, '_blank');
};

// --- FILTROS ---
document.querySelectorAll(".categorias button").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".categorias button").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    
    categoriaAtual = e.target.dataset.categoria || e.target.getAttribute("data-categoria");
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => { render(); }, 80);
  });
});

window.addEventListener("DOMContentLoaded", carregarProdutosDoSupabase);
