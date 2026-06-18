import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  getDoc
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
      const mockUser = { email, uid: "hank_uid_123", displayName: "Hank Schrader", role: "admin" };
      localStorage.setItem("brew_session", JSON.stringify(mockUser));
      window.dispatchEvent(new Event("brew_auth_changed"));
      return mockUser;
    }
    if (email && password.length >= 6) {
      // Verifica se já existe usuário com esse email
      const users = JSON.parse(localStorage.getItem("brew_users") || "[]");
      const existing = users.find(u => u.email === email);
      if (existing) {
        if (existing.password !== password) throw new Error("Senha incorreta.");
        const sessionUser = { email: existing.email, uid: existing.uid, displayName: existing.displayName, role: existing.role || "customer" };
        localStorage.setItem("brew_session", JSON.stringify(sessionUser));
        window.dispatchEvent(new Event("brew_auth_changed"));
        return sessionUser;
      }
      throw new Error("Usuário não encontrado. Registre-se primeiro.");
    }
    throw new Error("Credenciais inválidas! Tente hank@schrader.com / mineral");
  } else {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await seedDatabase();
    // Busca o role do usuário
    const userData = await getUserData(userCredential.user.uid);
    return { ...userCredential.user, role: userData?.role || "customer" };
  }
};

export const registerUser = async (email, password, displayName) => {
  if (useMock) {
    const users = JSON.parse(localStorage.getItem("brew_users") || "[]");
    if (users.find(u => u.email === email)) {
      throw new Error("Este e-mail já está em uso.");
    }
    const newUser = {
      uid: "user_" + Date.now(),
      email,
      password,
      displayName: displayName || email.split('@')[0],
      role: "customer",
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem("brew_users", JSON.stringify(users));
    const sessionUser = { email: newUser.email, uid: newUser.uid, displayName: newUser.displayName, role: newUser.role };
    localStorage.setItem("brew_session", JSON.stringify(sessionUser));
    window.dispatchEvent(new Event("brew_auth_changed"));
    return sessionUser;
  } else {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    // Cria o documento de usuário com role "customer"
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      displayName,
      role: "customer",
      createdAt: new Date().toISOString()
    });
    return { ...userCredential.user, role: "customer" };
  }
};

export const loginWithGoogle = async () => {
  if (useMock) {
    const mockGoogleUser = {
      uid: "google_user_" + Date.now(),
      email: "cliente.google@gmail.com",
      displayName: "Cliente Google (Simulado)",
      role: "customer",
      provider: "google"
    };
    // Salva como usuário mock
    const users = JSON.parse(localStorage.getItem("brew_users") || "[]");
    if (!users.find(u => u.uid === mockGoogleUser.uid)) {
      users.push({ ...mockGoogleUser, password: null });
      localStorage.setItem("brew_users", JSON.stringify(users));
    }
    localStorage.setItem("brew_session", JSON.stringify(mockGoogleUser));
    window.dispatchEvent(new Event("brew_auth_changed"));
    return mockGoogleUser;
  } else {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // Verifica se já tem perfil no Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    let role = "customer";
    if (!userDocSnap.exists()) {
      // Primeiro login com Google: cria o perfil
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        role: "customer",
        provider: "google",
        createdAt: new Date().toISOString()
      });
    } else {
      role = userDocSnap.data().role || "customer";
    }
    return { ...user, role };
  }
};

export const getUserData = async (uid) => {
  if (useMock) {
    const users = JSON.parse(localStorage.getItem("brew_users") || "[]");
    return users.find(u => u.uid === uid) || null;
  } else {
    const userDocRef = doc(db, "users", uid);
    const snap = await getDoc(userDocRef);
    return snap.exists() ? snap.data() : null;
  }
};

export const isAdminUser = (user) => {
  if (!user) return false;
  return user.role === "admin";
};

export const logoutUser = async () => {
  if (useMock) {
    localStorage.removeItem("brew_session");
    window.dispatchEvent(new Event("brew_auth_changed"));
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
      const sessionRaw = localStorage.getItem("brew_session");
      if (!sessionRaw) {
        callback(null);
        return;
      }
      const session = JSON.parse(sessionRaw);
      // Se a sessão não tem role, busca nos usuários salvos
      if (!session.role) {
        const users = JSON.parse(localStorage.getItem("brew_users") || "[]");
        const found = users.find(u => u.uid === session.uid || u.email === session.email);
        session.role = found?.role || "customer";
        // Atualiza a sessão com o role correto
        localStorage.setItem("brew_session", JSON.stringify(session));
      }
      callback(session);
    };
    checkSession();
    window.addEventListener("storage", checkSession);
    window.addEventListener("brew_auth_changed", checkSession);
    return () => {
      window.removeEventListener("storage", checkSession);
      window.removeEventListener("brew_auth_changed", checkSession);
    };
  } else {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Busca o role do usuário no Firestore
        try {
          const userData = await getUserData(firebaseUser.uid);
          callback({ ...firebaseUser, role: userData?.role || "customer" });
        } catch {
          callback({ ...firebaseUser, role: "customer" });
        }
      } else {
        callback(null);
      }
    });
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
  ],
  pedidos: [],
  users: [
    { uid: "hank_uid_123", email: "hank@schrader.com", displayName: "Hank Schrader", role: "admin", password: "mineral" }
  ]
};

// Função auxiliar para inicializar o localStorage se vazio
const initMockData = () => {
  Object.keys(defaultData).forEach(key => {
    if (!localStorage.getItem(`brew_${key}`)) {
      localStorage.setItem(`brew_${key}`, JSON.stringify(defaultData[key]));
    }
  });

  // Garante que o usuário admin (Hank) sempre exista no brew_users com role correto
  const hankDefault = { uid: "hank_uid_123", email: "hank@schrader.com", displayName: "Hank Schrader", role: "admin", password: "mineral" };
  const users = JSON.parse(localStorage.getItem("brew_users") || "[]");
  const hankIdx = users.findIndex(u => u.uid === "hank_uid_123" || u.email === "hank@schrader.com");
  if (hankIdx === -1) {
    users.push(hankDefault);
    localStorage.setItem("brew_users", JSON.stringify(users));
  } else if (users[hankIdx].role !== "admin") {
    // Corrige se o role estiver errado
    users[hankIdx].role = "admin";
    localStorage.setItem("brew_users", JSON.stringify(users));
  }

  // Corrige a sessão ativa do Hank se o role estiver ausente ou errado
  const sessionRaw = localStorage.getItem("brew_session");
  if (sessionRaw) {
    const session = JSON.parse(sessionRaw);
    if ((session.uid === "hank_uid_123" || session.email === "hank@schrader.com") && session.role !== "admin") {
      session.role = "admin";
      localStorage.setItem("brew_session", JSON.stringify(session));
    }
  }
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
