// venom-server/server.js - A VERSÃO FINAL E CORRETA
const { Client, LocalAuth } = require("whatsapp-web.js");
const puppeteer = require("puppeteer");
const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const qrcode = require("qrcode"); // <<<--- IMPORTAMOS A NOVA FERRAMENTA

const app = express();
app.use(express.json());
app.use(cors());
const port = 3001;

let client = null;
let qrCodeBase64 = null;
let connectionStatus = "Desconectado";

function initializeClient(isNewSession = false) {
  if (isNewSession) {
    fs.removeSync("./.wwebjs_auth");
    console.log("[DEBUG] Sessão antiga limpa para nova conexão.");
  }

  // Reseta os estados para um início limpo
  qrCodeBase64 = null;
  connectionStatus = "Iniciando";
  console.log("[DEBUG] Status -> Iniciando");

  // Destrói qualquer cliente antigo para evitar conflitos
  if (client) {
    client.destroy();
    client = null;
    console.log("[DEBUG] Cliente anterior destruído.");
  }

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      executablePath: puppeteer.executablePath(),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    try {
      qrCodeBase64 = await qrcode.toDataURL(qr);
      connectionStatus = "Aguardando QR Code";
      console.log("[DEBUG] Status -> QR Code gerado e Aguardando.");
    } catch (err) {
      console.error("[DEBUG] Falha ao converter QR code:", err);
      connectionStatus = "Erro";
    }
  });

  client.on("ready", () => {
    connectionStatus = "Conectado";
    qrCodeBase64 = null;
    console.log("[DEBUG] Status -> Cliente conectado e pronto!");
  });

  client.on("auth_failure", (msg) => {
    console.error("[DEBUG] Falha na autenticação!", msg);
    connectionStatus = "Erro";
  });

  client.on("disconnected", (reason) => {
    console.log("[DEBUG] Cliente foi desconectado:", reason);
    if (client) client.destroy();
    client = null;
    connectionStatus = "Desconectado";
    fs.removeSync("./.wwebjs_auth");
  });

  console.log("[DEBUG] Chamando client.initialize()...");
  client.initialize().catch((err) => {
    console.error("[DEBUG] Erro CRÍTICO de inicialização:", err);
    connectionStatus = "Erro";
  });
}

// --- ROTAS DA API ---

app.post("/connect", (req, res) => {
  if (connectionStatus === "Desconectado" || connectionStatus === "Erro") {
    initializeClient();
    res.json({ message: "Iniciando nova conexão..." });
  } else {
    res.json({ message: "Conexão já em andamento ou estabelecida." });
  }
});

app.post("/disconnect", async (req, res) => {
  if (client) {
    await client.logout();
  }
  res.json({ success: true, message: "Desconectado." });
});

// CÓDIGO NOVO E CORRETO
app.get("/status", async (req, res) => {
  if (client) {
    try {
      const state = await client.getState();
      // Se o cliente reportar que está conectado, atualizamos nosso status
      if (state === "CONNECTED") {
        connectionStatus = "Conectado";
        qrCodeBase64 = null; // Limpa o QR Code, pois não é mais necessário
      }
    } catch (error) {
      // Se getState() der erro, significa que o cliente não está bem
      console.error(
        "Erro ao obter estado do cliente, pode ter sido desconectado.",
        error
      );
      connectionStatus = "Desconectado";
      client = null;
    }
  }

  res.json({ status: connectionStatus, qrCode: qrCodeBase64 });
});

app.post("/send", async (req, res) => {
  if (!client || connectionStatus !== "Conectado") {
    return res.status(400).json({ error: "O WhatsApp não está conectado." });
  }
  // O resto do código de envio é praticamente idêntico
  const { message, numbers, contacts } = req.body;
  res.json({ success: true, message: "Campanha recebida." });
  (async () => {
    // Nova lógica robusta para processar a lista de contatos CSV
    const contactList = contacts
      .trim()
      .split("\n")
      .map((line) => {
        const [phone, name, company] = line.split(",");
        if (phone && phone.trim()) {
          return {
            phone: phone.trim(),
            name: name?.trim(),
            company: company?.trim(),
          };
        }
        return null;
      })
      .filter(Boolean);
    for (const contact of contactList) {
      try {
        const formattedNumber = `${(contact.phone || "").replace(
          /\D/g,
          ""
        )}@c.us`;
        let personalizedMessage = message
          .replace(/{nome}/gi, contact.name || "")
          .replace(/{telefone}/gi, contact.phone || "")
          .replace(/{grupo}/gi, contact.group || "");
        // Adicione outras variáveis como {empresa} se tiver no seu CSV
        await client.sendMessage(formattedNumber, personalizedMessage);
        console.log(`Mensagem enviada para ${formattedNumber}`);
        const delay = Math.floor(Math.random() * 5000) + 5000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Erro ao enviar para ${contact.phone}:`, error.message);
      }
    }
    console.log("Fim do ciclo de envios.");
  })();
});

app.listen(port, () => {
  console.log(`Servidor whatsapp-web.js rodando em http://localhost:${port}`);
  // Tenta reconectar automaticamente
  initializeClient();
});
