// Configuração do Supabase
const SUPABASE_URL = 'https://bjndixsymeiiusnzfksq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5nkKk61RhaOjTizPddNS_w_3r3FUFi4';

// Cria o cliente
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variável global para armazenar a lista
let produtos = [];

// Busca produtos no banco de dados
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

// Inicializa a busca assim que o HTML carregar
async function iniciarApp() {
  produtos = await buscarProdutosDoBanco();
  console.log('Produtos recebidos do banco:', produtos);

  // Chama a renderização global do mt.js
  if (typeof render === 'function') {
    render();
  }
}

document.addEventListener('DOMContentLoaded', iniciarApp);
