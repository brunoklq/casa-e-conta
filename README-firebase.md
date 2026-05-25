# 💰 Casa & Conta · versão Firebase

Controle financeiro do casal com **login Google** e **sincronização em tempo real** entre celular, tablet e computador. Quando você lança um gasto no seu celular, aparece no celular do seu par instantaneamente.

## ✨ Funcionalidades

- 🔐 **Login com Google** — entre com o e-mail @gmail de vocês, sem criar senha
- ☁️ **Sincronização em tempo real** — celular do esposo + celular da esposa + computador, tudo conectado
- 📊 Dashboard com totais, saldo, gráfico de categorias e insights
- 👫 Registra **quem pagou** e **quem lançou** cada movimento
- 🗓️ Filtro por mês
- 💾 Exportar backup JSON / CSV (Excel)
- 📱 100% responsivo
- 🆓 **Gratuito** no plano Spark do Firebase (gasta ~0,1% dos limites para um casal)

---

## 🚀 Passo a passo para colocar no ar (10–15 minutos)

### Parte 1 — Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com/ e entre com sua conta Google.
2. Clique em **"Adicionar projeto"** (ou **"Criar projeto"**).
3. Dê um nome (ex: `casa-e-conta`). Aceite os termos e siga.
4. Quando perguntar sobre o **Google Analytics**, pode **desativar** (não é necessário). Clique em **Criar projeto**.
5. Aguarde uns 30 segundos até finalizar.

### Parte 2 — Ativar o Login com Google

1. No menu lateral, clique em **Build → Authentication**.
2. Clique em **"Get started"** (ou **"Começar"**).
3. Na aba **Sign-in method**, clique em **Google**.
4. **Ative** o toggle, informe um **e-mail de suporte** (o seu) e clique em **Save**.

### Parte 3 — Criar o banco Firestore

1. No menu lateral, clique em **Build → Firestore Database**.
2. Clique em **"Create database"**.
3. Escolha **"Start in production mode"** (modo produção). Próximo.
4. Escolha a localização: **`southamerica-east1` (São Paulo)** se você está no Brasil. Confirme.
5. Aguarde a criação.

### Parte 4 — Aplicar as regras de segurança

1. Ainda em **Firestore Database**, clique na aba **Rules**.
2. **Apague todo o conteúdo** que está lá.
3. **Abra o arquivo `firestore.rules`** deste projeto e **copie todo o conteúdo**.
4. **Cole** no editor do Firebase.
5. Clique em **Publish** (Publicar).

### Parte 5 — Obter as chaves de configuração

1. No menu lateral, clique no ícone de **engrenagem (⚙)** → **Configurações do projeto**.
2. Role até **"Seus apps"** e clique no ícone **`</>`** (Web).
3. Dê um apelido ao app (ex: `casa-e-conta-web`). **Não** marque "Firebase Hosting". Clique em **Registrar app**.
4. Você verá um bloco de código como este:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "casa-e-conta-abc.firebaseapp.com",
     projectId: "casa-e-conta-abc",
     storageBucket: "casa-e-conta-abc.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc..."
   };
   ```
5. **Copie esse objeto inteiro**.
6. Abra o arquivo **`config.js`** deste projeto e **cole as chaves** no lugar dos valores de exemplo.

### Parte 6 — Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex: `casa-e-conta`). Pode ser **público** — as chaves do Firebase são públicas por design, a segurança está nas regras do Firestore.
2. Faça upload de **todos os arquivos** deste projeto:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js` (já com suas chaves)
   - `README.md`
   - `firestore.rules` (apenas referência, não é usado em runtime)
3. Vá em **Settings → Pages**.
4. Em **Source**, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**. Salve.
5. Aguarde 1–2 minutos. Sua URL será algo como:
   ```
   https://SEU-USUARIO.github.io/casa-e-conta/
   ```

### Parte 7 — Autorizar o domínio do GitHub Pages

1. Volte ao Firebase Console.
2. **Authentication → Settings → Authorized domains**.
3. Clique em **Add domain** e informe seu domínio:
   ```
   SEU-USUARIO.github.io
   ```
4. Salve.

✅ **Pronto!** Acessem o link no celular e no computador, entrem com Google, e comecem a registrar.

---

## 👫 Como funciona com o casal

- **Os dois fazem login** com a conta Google de cada um (qualquer Gmail funciona).
- Os **lançamentos são compartilhados**: tudo que um registra, o outro vê na hora.
- Cada lançamento marca quem **fez o registro** (aparece na lista, ex: "lançado por Maria").
- O campo **"Quem pagou"** continua sendo um rótulo livre (Esposo / Esposa / Conjunto), independente de quem fez o lançamento.

## 🔒 Segurança

- As regras do Firestore exigem que o usuário esteja **autenticado** para ler ou escrever.
- Os dados ficam no servidor do **Google (Firebase)** com criptografia.
- Se quiser **restringir o acesso a apenas alguns e-mails**, é possível editar o `firestore.rules` para incluir um whitelist (basta avisar e eu adapto).

## 💸 Custos

O plano **Spark do Firebase é gratuito** e oferece:
- 50.000 leituras/dia
- 20.000 escritas/dia
- 1 GB de armazenamento
- Autenticação ilimitada com Google

Para um casal lançando ~50–100 gastos por mês, isso é **0,1% do limite**. Sem cartão de crédito, sem cobrança.

## 🆘 Problemas comuns

**"unauthorized-domain" ao tentar entrar**
→ Você esqueceu o passo 7. Adicione `SEU-USUARIO.github.io` em Authorized domains.

**Dados não aparecem após login**
→ Verifique se publicou as regras do Firestore (Parte 4).

**Quero adicionar outras categorias**
→ Edite o objeto `catConfig` no `app.js` e o `<select>` de categorias no `index.html`.

## 📄 Licença

MIT — uso livre.
