import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

// Carrega as variáveis do arquivo .env
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error("Arquivo .env não encontrado. Configure suas chaves do Firebase primeiro.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const delimiterIndex = trimmed.indexOf('=');
    if (delimiterIndex !== -1) {
      const key = trimmed.substring(0, delimiterIndex).trim();
      let val = trimmed.substring(delimiterIndex + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
  console.error("As credenciais do Firebase no arquivo .env ainda não foram configuradas.");
  process.exit(1);
}

console.log("Conectando ao Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

async function seed() {
  try {
    const estilosSnapshot = await getDocs(collection(db, "estilos"));
    if (!estilosSnapshot.empty) {
      console.log("O banco de dados já possui registros. Operação cancelada.");
      return;
    }

    console.log("Semeando dados padrão...");
    const estiloIdMap = {};
    const cervejaIdMap = {};

    // 1. Estilos
    console.log("Cadastrando Estilos...");
    for (const estilo of defaultData.estilos) {
      const { id, ...estiloSemId } = estilo;
      const docRef = await addDoc(collection(db, "estilos"), estiloSemId);
      estiloIdMap[id] = docRef.id;
      console.log(`- Estilo criado: "${estiloSemId.nomeEstilo}" -> ID: ${docRef.id}`);
    }

    // 2. Cervejas
    console.log("Cadastrando Cervejas...");
    for (const cerveja of defaultData.cervejas) {
      const { id, estiloId, ...cervejaSemId } = cerveja;
      const novoEstiloId = estiloIdMap[estiloId] || estiloId;
      const docRef = await addDoc(collection(db, "cervejas"), {
        ...cervejaSemId,
        estiloId: novoEstiloId
      });
      cervejaIdMap[id] = docRef.id;
      console.log(`- Cerveja criada: "${cervejaSemId.nome}" -> ID: ${docRef.id}`);
    }

    // 3. Lotes
    console.log("Cadastrando Lotes...");
    for (const lote of defaultData.lotes) {
      const { id, cervejaId, ...loteSemId } = lote;
      const novaCervejaId = cervejaIdMap[cervejaId] || cervejaId;
      await addDoc(collection(db, "lotes"), {
        ...loteSemId,
        cervejaId: novaCervejaId
      });
      console.log(`- Lote criado: "${loteSemId.codigoLote}"`);
    }

    console.log("Banco de dados semeado com sucesso no Firebase!");
  } catch (error) {
    console.error("Erro ao semear banco de dados:", error);
  }
}

seed();
