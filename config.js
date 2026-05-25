// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// Substitua os valores abaixo pelos do SEU projeto Firebase.
//
// Para obter essas chaves:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um projeto (ou abra um existente)
// 3. Em "Configurações do projeto" (ícone de engrenagem)
// 4. Role até "Seus apps" → clique em "Adicionar app" → escolha Web (</>)
// 5. Copie o objeto firebaseConfig e cole abaixo
// ============================================================

export const firebaseConfig = {
  apiKey: "COLE-SUA-API-KEY-AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:abc123"
};

// Não é necessário esconder essas chaves: elas são públicas por design.
// A segurança vem das regras do Firestore (firestore.rules).
