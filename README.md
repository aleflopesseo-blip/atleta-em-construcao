# Meus Treinos

App web dos seus treinos: programas **Pubalgia** e **Personal**, com rotinas, treinos, exercícios combinados (A, B, C…), vídeos, cronômetro de treino, descanso e histórico. Tem também uma **área admin** (`/admin.html`) para criar programas, rotinas, treinos e exercícios e para subir vídeos.

O site é só HTML, CSS e JavaScript, sem etapa de build. Funciona direto no Netlify.

---

## Senha e logotipo

- **Senha de acesso:** `treinos2026@`. Ela é pedida na primeira tela e fica lembrada no aparelho depois de digitada. Para trocar, edite `senha` em `js/config.js`; ao trocar, todos precisam digitar a nova.
  Atenção: é um bloqueio simples, feito no próprio navegador. Ele impede o acesso casual, mas quem souber olhar o código do site consegue ver a senha e os treinos. Não guarde nada sigiloso no app.
- **Logotipo:** substitua o arquivo `assets/logo.svg` pelo seu logo (mesmo nome). Se o seu logo for PNG, coloque o arquivo em `assets/` e mude `logo` em `js/config.js` (ex.: `'assets/logo.png'`). O espaço reservado é quadrado; use uma imagem quadrada (ex.: 480 × 480 px) com fundo transparente.

## 1. Subir no GitHub

1. Crie um repositório novo em https://github.com/new (pode ser privado).
2. Na página do repositório, clique em **Add file → Upload files**.
3. Arraste **todo o conteúdo** desta pasta (não a pasta em si): `index.html`, `admin.html`, `netlify.toml`, `manifest.webmanifest` e as pastas `css`, `js`, `assets` e `supabase`.
4. Clique em **Commit changes**.

## 2. Publicar no Netlify

1. Em https://app.netlify.com clique em **Add new site → Import an existing project → GitHub**.
2. Escolha o repositório.
3. Deixe **Build command** vazio e **Publish directory** como `.` (o `netlify.toml` já define isso).
4. Clique em **Deploy**.

Pronto: o app já funciona com todos os treinos importados. A cada novo commit no GitHub, o Netlify publica de novo sozinho.

> Dica: no celular, abra o site e use **Adicionar à tela de início** para ele abrir como um app.

---

## 3. Área admin (subir vídeos e novos treinos)

Abra `https://SEU-SITE.netlify.app/admin.html`.

**Sem o Supabase** a área admin funciona em *modo local*: o que você editar fica só naquele navegador. Serve para testar, e o botão **Exportar JSON** gera um arquivo com tudo.

**Com o Supabase** (gratuito) as alterações aparecem no app para qualquer aparelho, e você consegue **enviar arquivos de vídeo**. Configuração (uns 10 minutos):

1. Crie uma conta e um projeto em https://supabase.com (plano Free).
2. No projeto, abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/setup.sql` e clique em **Run**.
3. Em **Authentication → Users → Add user → Create new user**, crie o seu usuário admin (e-mail e senha). Marque *Auto Confirm User*.
4. Em **Authentication → Sign In / Providers**, **desligue** *Allow new users to sign up*. Assim só você consegue editar.
5. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
6. Abra `js/config.js` (no GitHub: clique no arquivo → ícone de lápis) e preencha:

   ```js
   supabaseUrl: 'https://xxxx.supabase.co',
   supabaseAnonKey: 'eyJhbGciOi...',
   ```

   Salve (**Commit changes**). O Netlify publica sozinho em cerca de 1 minuto.
7. Abra `/admin.html`, entre com o e-mail e a senha do passo 3 e clique em **Salvar alterações** uma vez para enviar os treinos atuais ao banco.

### Como usar o admin

- **Programas**: cada um aparece no app como um "professor" na tela inicial (ex.: Pubalgia, Personal). Use **Novo programa** para criar outro tipo de treino.
- **Rotinas**: nome, datas, categoria, nível e orientações gerais.
- **Treinos**: rótulo (Treino 1, Segunda…) e nome. Adicione **Exercício** (individual) ou **Bloco combinado** (exercícios A, B, C feitos em sequência).
- **Exercício**: séries, carga, intervalo (use `60s` ou `1 min` para ativar o cronômetro de descanso), instruções e vídeo.
- **Vídeo**: aba **Enviar arquivo** (MP4/MOV até 50 MB no plano gratuito), aba **Link** (YouTube ou endereço .mp4) ou aba **Biblioteca** (vídeos já enviados).
- Nada vai para o app até você clicar em **Salvar alterações** (barra no rodapé).

---

## Sobre os vídeos importados

Os vídeos dos exercícios importados continuam hospedados nos servidores do MFIT e do YouTube; o app só aponta para eles. Se algum deixar de abrir (por exemplo, se o professor apagar o vídeo no MFIT), troque pelo admin: envie o seu próprio arquivo ou cole um link do YouTube.

## Estrutura

```
index.html            app do aluno
admin.html            área admin
css/style.css         visual do app
css/admin.css         visual do admin
js/config.js          chaves do Supabase (opcional)
js/data.js            treinos importados (dados iniciais)
js/store.js           leitura/gravação de dados e vídeos
js/app.js             telas do app
js/admin.js           telas do admin
supabase/setup.sql    tabelas, bucket e permissões do Supabase
assets/               ícones
```

O histórico de treinos feitos (tela **Meu Progresso**) fica salvo no próprio aparelho.
