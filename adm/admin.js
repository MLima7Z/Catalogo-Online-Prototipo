// Elementos da Tela
const areaLogin = document.getElementById("area-login");
const painelAdmin = document.getElementById("painel-admin");
const formLogin = document.getElementById("form-login");

// Checa se o usuário já está logado ao abrir a página
window.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await _supabase.auth.getSession();
  
  if (session) {
    exibirPainel();
  }
});

// Evento do Formulário de Login
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value.trim();
  const btnEntrar = document.getElementById("btn-entrar");

  btnEntrar.disabled = true;
  btnEntrar.textContent = "Verificando...";

  const { data, error } = await _supabase.auth.signInWithPassword({
    email: email,
    password: senha
  });

  btnEntrar.disabled = false;
  btnEntrar.textContent = "Entrar no Painel";

  if (error) {
    alert("Erro ao entrar: " + error.message);
  } else {
    exibirPainel();
  }
});

// Exibe o painel e esconde o login
function exibirPainel() {
  areaLogin.style.display = "none";
  painelAdmin.style.display = "block";
  if (typeof render === "function") render();
}

// Função de Sair
async function fazerLogout() {
  await _supabase.auth.signOut();
  painelAdmin.style.display = "none";
  areaLogin.style.display = "block";
}
