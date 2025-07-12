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
let lastReport = null;
let isSending = false;

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
  if (isSending) {
    return res
      .status(400)
      .json({ error: "Uma campanha já está em andamento." });
  }
  if (!client || connectionStatus !== "Conectado") {
    return res.status(400).json({ error: "O WhatsApp não está conectado." });
  }

  const { message, contacts } = req.body;

  if (!message || !contacts) {
    return res
      .status(400)
      .json({ error: "Mensagem e contatos são obrigatórios." });
  }

  // LÓGICA DE PARSE CORRIGIDA E COMPLETA
  const contactList = contacts
    .trim()
    .split("\n")
    .map((line) => {
      const [phone, name, group] = line.split(",");
      if (phone && phone.trim()) {
        return {
          phone: phone.trim(),
          name: name?.trim(),
          group: group?.trim(),
        };
      }
      return null;
    })
    .filter(Boolean); // Remove qualquer linha nula/inválida

  if (contactList.length === 0) {
    return res
      .status(400)
      .json({ error: "Nenhum contato válido encontrado para o disparo." });
  }

  isSending = true;
  lastReport = null;
  res.json({ success: true, message: "Campanha recebida. O envio começou." });

  // Loop de envio agora com os dados limpos
  (async () => {
    const report = { success: [], failed: [] };
    console.log(`Iniciando campanha para ${contactList.length} contatos.`);
    for (const contact of contactList) {
      try {
        let personalizedMessage = message
          .replace(/{nome}/gi, contact.name || "")
          .replace(/{grupo}/gi, contact.group || "");

        const formattedNumber = `${contact.phone.replace(/\D/g, "")}@c.us`;
        await client.sendMessage(formattedNumber, personalizedMessage);
        report.success.push(contact.phone);
        console.log(`Sucesso para ${contact.phone}`);
      } catch (error) {
        report.failed.push({ phone: contact.phone, reason: error.message });
        console.error(`Falha para ${contact.phone}:`, error.message);
      }
      const delay = Math.floor(Math.random() * 3000) + 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    console.log("Fim da campanha.");
    lastReport = report;
    isSending = false;
  })();
});

app.get("/report", (req, res) => {
  if (isSending) {
    return res.json({ status: "enviando" });
  }
  res.json({ status: "concluido", report: lastReport });
});

app.listen(port, () => {
  console.log(`Servidor whatsapp-web.js rodando em http://localhost:${port}`);
  // Tenta reconectar automaticamente
  initializeClient();
});
