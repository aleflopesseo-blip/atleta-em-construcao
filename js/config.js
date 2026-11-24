/*
 * Configuração do Supabase (banco de dados + armazenamento de vídeos).
 *
 * Deixe em branco para usar o app apenas com os dados que vieram no arquivo js/data.js.
 * Para a área admin salvar treinos e vídeos online, crie um projeto gratuito em
 * https://supabase.com, rode o arquivo supabase/setup.sql e cole aqui:
 *   - Project URL         (Settings → API → Project URL)
 *   - anon public key     (Settings → API → Project API keys → anon public)
 *
 * A chave "anon" é pública por natureza: quem protege os dados são as regras (RLS)
 * criadas pelo setup.sql. Nunca cole aqui a chave "service_role".
 */
window.APP_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  bucket: 'videos',
  nomeAluno: 'Alef',

  // Logotipo exibido na tela de senha e na tela de programas.
  // Troque o arquivo assets/logo.svg pelo seu (ou aponte para outro, ex.: 'assets/logo.png').
  logo: 'assets/logo.svg',

  // Senha de acesso ao app. Ao trocar, todos os aparelhos precisam digitar a nova senha.
  senha: 'treinos2026@'
};
