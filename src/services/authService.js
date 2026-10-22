// Acesso de demonstração, sem autenticação externa ou credenciais reais.
export async function login(username) {
  return { logged:true, token:'demo-local-only', role:'admin', user:'Teste local', demo:true };
}
export async function logout(){ return true; }
export async function validateSession(){ return null; }
export const authService = { login, logout, validateSession };
