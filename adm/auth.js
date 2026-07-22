document.addEventListener("DOMContentLoaded", async () => {
  const areaLogin = document.getElementById("area-login");
  const painelAdmin = document.getElementById("painel-admin");
  const formLogin = document.getElementById("form-login");
  const btnLogout = document.getElementById("btn-logout");

  // Funções de visibilidade da tela
  window.exibirPainel = function() {
    if (areaLogin) areaLogin.style.display = "none";
    if (painelAdmin) {
      painelAdmin.style.display = "block";
      painelAdmin.classList.remove("escondido");
    }
    // Dispara o evento avisando que o painel abriu para o crud.js carregar os produtos
    window.dispatchEvent(new Event("painelAberto"));
  };

  window.exibirLogin = function() {
    if (painelAdmin) painelAdmin.style.display = "none";
    if (areaLogin) {
      areaLogin.style.display = "block";
      areaLogin.classList.remove("escondido");
    }
  };

  // 1. Checa a sessão
  try {
    if (typeof _supabase !== "undefined") {
      const { data: { session } } = await _supabase.auth.getSession();
      if (session) {
        window.exibirPainel();
      } else {
        window.exibirLogin();
      }
    }
  } catch (err) {
    console.error("Erro ao verificar sessão:", err);
    window.exibirLogin();
  }

  // 2. Evento do Formulário de Login
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const senha = document.getElementById("login-senha").value.trim();
      const btnEntrar = document.getElementById("btn-entrar");

      btnEntrar.disabled = true;
      btnEntrar.textContent = "Verificando...";

      try {
        const { data, error } = await _supabase.auth.signInWithPassword({
          email: email,
          password: senha
        });

        if (error) {
          alert("Erro no login: " + error.message);
        } else {
          window.exibirPainel();
        }
      } catch (err) {
        alert("Erro na conexão: " + err.message);
      } finally {
        btnEntrar.disabled = false;
        btnEntrar.textContent = "Entrar no Painel";
      }
    });
  }

  // 3. Evento de Sair (Logout)
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      if (typeof _supabase !== "undefined") {
        await _supabase.auth.signOut();
      }
      window.location.reload();
    });
  }
});
