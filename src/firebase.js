import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE ---
// IMPORTANTE: Insira as credenciais do seu projeto Firebase aqui se desejar conectar a um banco real!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

// Verifica se as credenciais reais foram fornecidas
const isFirebasePlaceholder = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey.includes("YOUR_API_KEY") || 
  firebaseConfig.apiKey === "";

let app, auth, db;
let useMock = isFirebasePlaceholder;

if (!useMock) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("🔥 Firebase inicializado com sucesso!");
  } catch (error) {
    console.warn("⚠️ Falha ao inicializar o Firebase. Ativando Modo de Simulação (localStorage). Error:", error);
    useMock = true;
  }
} else {
  console.log("ℹ️ Usando Modo de Simulação (localStorage). Para usar o Firebase real, configure suas credenciais em src/firebase.js");
}

// ==========================================
// 🛡️ ANCORA DE SERVIÇO DE AUTENTICAÇÃO (AUTH)
// ==========================================

export const loginUser = async (email, password) => {
  if (useMock) {
    // Simula validação básica
    if (email === "hank@schrader.com" && password === "mineral") {
      const mockUser = { email, uid: "hank_uid_123", displayName: "Hank Schrader" };
      localStorage.setItem("brew_session", JSON.stringify(mockUser));
      return mockUser;
    }
    // Permite cadastrar ou logar qualquer outro simulado se desejar, mas o padrão é Hank
    if (email && password.length >= 6) {
      const mockUser = { email, uid: "user_" + Date.now(), displayName: email.split('@')[0] };
      localStorage.setItem("brew_session", JSON.stringify(mockUser));
      return mockUser;
    }
    throw new Error("Credenciais inválidas! Tente hank@schrader.com / mineral");
  } else {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }
};

export const logoutUser = async () => {
  if (useMock) {
    localStorage.removeItem("brew_session");
    return true;
  } else {
    await signOut(auth);
    return true;
  }
};

export const subscribeToAuth = (callback) => {
  if (useMock) {
    // Retorna o estado atual da sessão e ativa um listener simulado
    const checkSession = () => {
      const session = localStorage.getItem("brew_session");
      callback(session ? JSON.parse(session) : null);
    };
    checkSession();
    window.addEventListener("storage", checkSession);
    return () => window.removeEventListener("storage", checkSession);
  } else {
    return onAuthStateChanged(auth, callback);
  }
};

// ==========================================
// 🗂️ ANCORA DE BANCO DE DADOS (FIRESTORE / MOCK)
// ==========================================

// Dados iniciais para quando o localStorage estiver vazio
const defaultData = {
  estilos: [
    { id: "1", nomeEstilo: "German Lager", origem: "Alemanha", temperaturaServico: "4-7" },
    { id: "2", nomeEstilo: "India Pale Ale (IPA)", origem: "EUA / Inglaterra", temperaturaServico: "8-12" },
    { id: "3", nomeEstilo: "Amber Ale", origem: "Alemanha / EUA", temperaturaServico: "7-10" }
  ],
  cervejas: [
    { id: "1", nome: "Schraderbräu Classic", estiloId: "1", abv: "5.2", preco: "18.50", descricao: "A autêntica cerveja artesanal do Hank. Uma German Lager encorpada, de cor dourada clara e sabor sedoso." },
    { id: "2", nome: "Schraderbräu Märzen", estiloId: "3", abv: "5.8", preco: "21.90", descricao: "Uma cerveja maltada de tom âmbar profundo, notas de caramelo tostado e final suave." },
    { id: "3", nome: "Heisenberg Dark Beer", estiloId: "2", abv: "6.5", preco: "23.00", descricao: "Lúpulo intenso, teor alcoólico elevado. Amargor marcante e aroma cítrico cristalino." }
  ],
  lotes: [
    { id: "1", codigoLote: "LOTE-001", cervejaId: "1", dataInicio: "2026-05-15", quantidade: "500", status: "Pronto" },
    { id: "2", codigoLote: "LOTE-002", cervejaId: "2", dataInicio: "2026-05-28", quantidade: "300", status: "Fermentando" },
    { id: "3", codigoLote: "LOTE-003", cervejaId: "1", dataInicio: "2026-06-01", quantidade: "450", status: "Condicionando" }
  ]
};

// Função auxiliar para inicializar o localStorage se vazio
const initMockData = () => {
  Object.keys(defaultData).forEach(key => {
    if (!localStorage.getItem(`brew_${key}`)) {
      localStorage.setItem(`brew_${key}`, JSON.stringify(defaultData[key]));
    }
  });
};

if (useMock) {
  initMockData();
}

// Funções genéricas de CRUD
export const addDocument = async (colName, data) => {
  if (useMock) {
    initMockData();
    const items = JSON.parse(localStorage.getItem(`brew_${colName}`) || "[]");
    const newItem = { ...data, id: Date.now().toString() };
    items.push(newItem);
    localStorage.setItem(`brew_${colName}`, JSON.stringify(items));
    
    // Dispara evento para re-renderizar outras abas se necessário
    window.dispatchEvent(new Event("brew_data_changed"));
    return newItem;
  } else {
    const docRef = await addDoc(collection(db, colName), data);
    return { ...data, id: docRef.id };
  }
};

export const getDocuments = async (colName) => {
  if (useMock) {
    initMockData();
    return JSON.parse(localStorage.getItem(`brew_${colName}`) || "[]");
  } else {
    const querySnapshot = await getDocs(collection(db, colName));
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  }
};

export const updateDocument = async (colName, id, data) => {
  if (useMock) {
    initMockData();
    let items = JSON.parse(localStorage.getItem(`brew_${colName}`) || "[]");
    items = items.map(item => item.id === id ? { ...item, ...data } : item);
    localStorage.setItem(`brew_${colName}`, JSON.stringify(items));
    window.dispatchEvent(new Event("brew_data_changed"));
    return true;
  } else {
    const docRef = doc(db, colName, id);
    await updateDoc(docRef, data);
    return true;
  }
};

export const deleteDocument = async (colName, id) => {
  if (useMock) {
    initMockData();
    let items = JSON.parse(localStorage.getItem(`brew_${colName}`) || "[]");
    items = items.filter(item => item.id !== id);
    localStorage.setItem(`brew_${colName}`, JSON.stringify(items));
    window.dispatchEvent(new Event("brew_data_changed"));
    return true;
  } else {
    const docRef = doc(db, colName, id);
    await deleteDoc(docRef);
    return true;
  }
};

// Escuta em tempo real mudanças no banco
export const subscribeToCollection = (colName, callback) => {
  if (useMock) {
    initMockData();
    const handleUpdate = () => {
      const items = JSON.parse(localStorage.getItem(`brew_${colName}`) || "[]");
      callback(items);
    };
    handleUpdate();
    
    // Escuta mudanças disparadas pela própria aba ou por outras abas
    window.addEventListener("brew_data_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    
    return () => {
      window.removeEventListener("brew_data_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  } else {
    return onSnapshot(collection(db, colName), (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      callback(items);
    });
  }
};
