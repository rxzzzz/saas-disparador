const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://lbppqiwoitkldqyukvxl.supabase.co"; // Substitua pela sua URL do Supabase
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicHBxaXdvaXRrbGRxeXVrdnhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY1NzU2NiwiZXhwIjoyMDY3MjMzNTY2fQ.V829zb2ZnHpGfulEg_vSHRwRDUUC99SFWdxV9dEJXBs"; // IMPORTANTE: Use a chave 'service_role' (secret)
const supabase = createClient(supabaseUrl, supabaseKey);
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

// --- MANTENHA app.listen NO FINAL DO ARQUIVO! ---
app.listen(port, () => {
  console.log(`Servidor WhatsApp rodando em http://localhost:${port}`);
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

app.get("/report", (req, res) => {
  if (isSending) {
    return res.json({ status: "enviando" });
  }
  res.json({ status: "concluido", report: lastReport });
});

app.post("/send", async (req, res) => {
  if (isSending) {
    return res
      .status(429)
      .json({
        error: "Uma campanha já está em andamento. Por favor, aguarde.",
      });
  }
  if (!client || connectionStatus !== "Conectado") {
    return res.status(400).json({ error: "WhatsApp não está conectado." });
  }

  const { message, contacts, userId } = req.body;
  if (!userId || !message || !contacts) {
    return res
      .status(400)
      .json({ error: "Dados insuficientes para iniciar a campanha." });
  }

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
    .filter(Boolean);

  if (contactList.length === 0) {
    return res.status(400).json({ error: "Nenhum contato válido na lista." });
  }

  isSending = true; // Bloqueia novos envios
  res.json({
    success: true,
    message: "Campanha recebida. O envio foi iniciado.",
  });

  // Executa o envio em segundo plano
  (async () => {
    console.log(
      `[ENVIO] Iniciando campanha para ${contactList.length} contatos.`
    );
    let campaignId = null;

    try {
      // 1. Cria a campanha no banco de dados
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          message: message,
          total_recipients: contactList.length,
          user_id: userId,
          status: "sending",
        })
        .select("id")
        .single();

      if (campaignError || !campaignData) {
        throw new Error(
          `Falha ao criar campanha no DB: ${campaignError?.message}`
        );
      }
      campaignId = campaignData.id;
      console.log(`[ENVIO] Campanha registrada no DB com ID: ${campaignId}`);

      // 2. Loop de envio
      let successCount = 0;
      for (const contact of contactList) {
        try {
          const personalizedMessage = message
            .replace(/{nome}/gi, contact.name || "")
            .replace(/{grupo}/gi, contact.group || "");
          const formattedNumber = `${contact.phone.replace(/\D/g, "")}@c.us`;

          console.log(`[ENVIO] Tentando enviar para ${formattedNumber}...`);
          await client.sendMessage(formattedNumber, personalizedMessage);

          await supabase
            .from("dispatch_logs")
            .insert({
              campaign_id: campaignId,
              contact_phone: contact.phone,
              status: "success",
            });
          console.log(`[ENVIO] Sucesso para ${formattedNumber}`);
          successCount++;
        } catch (error) {
          console.error(
            `[ENVIO] Falha ao enviar para ${contact.phone}:`,
            error.message
          );
          await supabase
            .from("dispatch_logs")
            .insert({
              campaign_id: campaignId,
              contact_phone: contact.phone,
              status: "failed",
              error_reason: error.message,
            });
        }
        const delay = Math.floor(Math.random() * 2000) + 1000; // Delay de 1-3 segundos para teste
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // 3. Atualiza o status final da campanha
      const finalStatus =
        successCount === contactList.length ? "completed" : "partial_failure";
      await supabase
        .from("campaigns")
        .update({ status: finalStatus })
        .eq("id", campaignId);
      console.log(
        `[ENVIO] Campanha ${campaignId} finalizada com status: ${finalStatus}`
      );
    } catch (e) {
      console.error("[ENVIO] Erro crítico no processo de campanha:", e.message);
      if (campaignId) {
        await supabase
          .from("campaigns")
          .update({ status: "failed" })
          .eq("id", campaignId);
      }
    } finally {
      isSending = false; // Libera para novos envios
    }
  })();
});
