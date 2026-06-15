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

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verifica se as credenciais reais foram configuradas no arquivo .env
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
    console.log("Firebase inicializado com sucesso.");
  } catch (error) {
    console.warn("Erro ao inicializar o Firebase. Ativando modo simulado (localStorage):", error);
    useMock = true;
  }
} else {
  console.log("Usando banco de dados simulado (localStorage). Configure o arquivo .env para conectar ao Firebase real.");
}

// ----------------------------------------------------
// Métodos de Autenticação
// ----------------------------------------------------

export const loginUser = async (email, password) => {
  if (useMock) {
    // Login simulado para desenvolvimento
    if (email === "hank@schrader.com" && password === "mineral") {
      const mockUser = { email, uid: "hank_uid_123", displayName: "Hank Schrader" };
      localStorage.setItem("brew_session", JSON.stringify(mockUser));
      return mockUser;
    }
    if (email && password.length >= 6) {
      const mockUser = { email, uid: "user_" + Date.now(), displayName: email.split('@')[0] };
      localStorage.setItem("brew_session", JSON.stringify(mockUser));
      return mockUser;
    }
    throw new Error("Credenciais inválidas! Tente hank@schrader.com / mineral");
  } else {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await seedDatabase();
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
    // Monitora a sessão local simulada
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

// ----------------------------------------------------
// Métodos de Banco de Dados (Firestore / Local)
// ----------------------------------------------------

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


export const addDocument = async (colName, data) => {
  if (useMock) {
    initMockData();
    const items = JSON.parse(localStorage.getItem(`brew_${colName}`) || "[]");
    const newItem = { ...data, id: Date.now().toString() };
    items.push(newItem);
    localStorage.setItem(`brew_${colName}`, JSON.stringify(items));

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

// Popula o Firestore com os dados iniciais caso esteja vazio
export const seedDatabase = async () => {
  if (useMock) {
    console.log("Banco de dados local já inicializado.");
    return;
  }

  try {
    const estilosSnapshot = await getDocs(collection(db, "estilos"));
    if (!estilosSnapshot.empty) {
      console.log("O banco de dados já possui registros.");
      return;
    }

    console.log("Semeando dados padrão...");

    // Mapeia os IDs originais para os gerados pelo Firestore
    const estiloIdMap = {};
    const cervejaIdMap = {};

    // 1. Estilos
    for (const estilo of defaultData.estilos) {
      const { id, ...estiloSemId } = estilo;
      const docRef = await addDoc(collection(db, "estilos"), estiloSemId);
      estiloIdMap[id] = docRef.id;
    }

    // 2. Cervejas
    for (const cerveja of defaultData.cervejas) {
      const { id, estiloId, ...cervejaSemId } = cerveja;
      const novoEstiloId = estiloIdMap[estiloId] || estiloId;
      const docRef = await addDoc(collection(db, "cervejas"), {
        ...cervejaSemId,
        estiloId: novoEstiloId
      });
      cervejaIdMap[id] = docRef.id;
    }

    // 3. Lotes
    for (const lote of defaultData.lotes) {
      const { id, cervejaId, ...loteSemId } = lote;
      const novaCervejaId = cervejaIdMap[cervejaId] || cervejaId;
      await addDoc(collection(db, "lotes"), {
        ...loteSemId,
        cervejaId: novaCervejaId
      });
    }

    console.log("Banco de dados semeado com sucesso.");
  } catch (error) {
    console.error("Erro ao semear o banco de dados:", error);
  }
};
