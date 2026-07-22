// 1. Configuração e Conexão com o Supabase
const SUPABASE_URL = 'https://bjndixsymeiiusnzfksq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5nkKk61RhaOjTizPddNS_w_3r3FUFi4';

// Cria o cliente de conexão
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Declara a variável global que o mt.js vai usar
let produtos = [];

// 2. Função para buscar os produtos dinâmicos da loja no BDD
async function buscarProdutosDoBanco() {
  const { data, error } = await _supabase
    .from('produtos')
    .select('*')
    .eq('loja_id', 'casa-do-corredor');

  if (error) {
    console.error('Erro ao conectar com o Supabase:', error.message);
    return [];
  }

  return data;
}

// 3. Inicializa o App
async function iniciarApp() {
  // Atualiza a variável global com o que veio da nuvem
  produtos = await buscarProdutosDoBanco();
  
  console.log('Produtos recebidos do banco:', produtos);

  // Se a função render já existir no mt.js, desenha a tela
  if (typeof render === 'function') {
    render();
  }
}

// Executa assim que a página carregar
document.addEventListener('DOMContentLoaded', iniciarApp);
