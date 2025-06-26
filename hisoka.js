/**
 * 🃏 HIS-MD V0 - Bot WhatsApp Hybride
 * 👑 Créateur : hhhisoka
 * 🎭 Thème : Hisoka (Hunter x Hunter)
 * 🔗 Fusion : Levanter + Queen-Elisa-MD-V2
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  makeInMemoryStore,
  jidDecode,
  proto,
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const { Boom } = require("@hapi/boom")
const fs = require("fs")
const path = require("path")
const config = require("./config")
const { color, mylog, infolog } = require("./lib/color")
const {
  smsg,
  formatp,
  tanggal,
  formatDate,
  getTime,
  isUrl,
  sleep,
  clockString,
  runtime,
  fetchJson,
  getBuffer,
  jsonformat,
  delay,
  format,
  logic,
  generateProfilePicture,
  parseMention,
  getRandom,
} = require("./lib/myfunc")

// Store pour gérer les sessions
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) })

// Variables globales
global.db = { users: {}, chats: {}, game: {}, database: {}, settings: {}, others: {}, sticker: {} }
global.opts = {}

// Chargement des plugins
const plugins = new Map()
const pluginFolder = path.join(__dirname, "plugins")
const pluginFilter = (filename) => /\.js$/.test(filename)

// Fonction pour charger les plugins
async function loadPlugins() {
  console.log(color("🃏 Hisoka charge ses cartes (plugins)...", "yellow"))

  for (const filename of fs.readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = path.join(pluginFolder, filename)
      const plugin = require(file)

      plugins.set(filename, plugin)
      console.log(color(`✅ Plugin chargé: ${filename}`, "green"))
    } catch (e) {
      console.log(color(`❌ Erreur plugin ${filename}: ${e}`, "red"))
    }
  }

  console.log(color(`🎭 ${plugins.size} cartes dans le jeu de Hisoka`, "magenta"))
}

// Fonction principale
async function startHisoka() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "./session"))
  const { version, isLatest } = await fetchLatestBaileysVersion()

  console.log(color(`🃏 Hisoka utilise WA v${version.join(".")}, est-ce la dernière? ${isLatest}`, "cyan"))

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: config.CONNECTION_METHOD === "qr",
    browser: ["Hisoka-MD", "Safari", "1.0.0"],
    auth: state,
    generateHighQualityLinkPreview: true,
    // Support du pairing code
    ...(config.CONNECTION_METHOD === "pairing" &&
      config.PAIRING_NUMBER && {
        mobile: false,
      }),
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id)
        return msg?.message || undefined
      }
      return proto.Message.fromObject({})
    },
  })

  // Gestion du pairing code
  if (config.CONNECTION_METHOD === "pairing" && config.PAIRING_NUMBER && !sock.authState.creds.registered) {
    console.log(color("🃏 Mode Pairing Code activé...", "cyan"))
    setTimeout(async () => {
      const code = await sock.requestPairingCode(config.PAIRING_NUMBER)
      console.log(color(`🎭 Code de jumelage: ${code}`, "green"))
      console.log(color("📱 Entrez ce code dans WhatsApp > Appareils liés > Lier un appareil", "yellow"))
    }, 3000)
  }

  store?.bind(sock.ev)

  // Événements de connexion
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update

    // Affichage du QR code si nécessaire
    if (qr && config.CONNECTION_METHOD === "qr") {
      console.log(color("🃏 Scannez le QR code avec WhatsApp!", "cyan"))
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode

      if (reason === DisconnectReason.badSession) {
        console.log(color("🃏 Session corrompue, Hisoka supprime et redémarre...", "red"))
        fs.rmSync(path.join(__dirname, "./session"), { recursive: true, force: true })
        startHisoka()
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log(color("🎭 Connexion fermée, Hisoka se reconnecte...", "yellow"))
        startHisoka()
      } else if (reason === DisconnectReason.connectionLost) {
        console.log(color("🃏 Connexion perdue, Hisoka revient...", "yellow"))
        startHisoka()
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log(color("🎭 Connexion remplacée, Hisoka ferme cette session...", "red"))
        sock.logout()
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(color("🃏 Hisoka a été déconnecté, suppression de la session...", "red"))
        fs.rmSync(path.join(__dirname, "./session"), { recursive: true, force: true })
        startHisoka()
      } else if (reason === DisconnectReason.restartRequired) {
        console.log(color("🎭 Redémarrage requis, Hisoka redémarre...", "yellow"))
        startHisoka()
      } else if (reason === DisconnectReason.timedOut) {
        console.log(color("🃏 Connexion expirée, Hisoka se reconnecte...", "yellow"))
        startHisoka()
      } else {
        sock.end(color(`🎭 Raison de déconnexion inconnue: ${reason}|${connection}`, "red"))
      }
    } else if (connection === "open") {
      console.log(color("🃏✨ Hisoka est maintenant en ligne! Le spectacle peut commencer...", "green"))
      console.log(color('🎭 "Ohhh~ Comme c\'est excitant!" - Hisoka', "magenta"))

      // Envoi de la session ID si activé
      if (config.SEND_SESSION_ID && config.owner[0]) {
        try {
          const sessionId = Buffer.from(JSON.stringify(sock.authState.creds)).toString("base64")
          const sessionMessage =
            `🃏 *HISOKA SESSION ID* 🎭\n\n` +
            `✨ Votre bot est maintenant connecté!\n\n` +
            `🔐 *Session ID:*\n\`\`\`${sessionId.slice(0, 50)}...\`\`\`\n\n` +
            `📱 *Numéro connecté:* ${sock.user.id.split(":")[0]}\n` +
            `🎪 *Nom:* ${sock.user.name}\n\n` +
            `_"Schwing~ La connexion est établie!"_ - Hisoka`

          await sock.sendMessage(config.owner[0] + "@s.whatsapp.net", {
            text: sessionMessage,
          })

          console.log(color("📤 Session ID envoyée au propriétaire", "green"))
        } catch (error) {
          console.log(color("❌ Erreur envoi session ID:", "red"), error)
        }
      }
    }
  })

  // Sauvegarde des credentials
  sock.ev.on("creds.update", saveCreds)

  // Gestion des messages
  sock.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0]
      if (!mek.message) return

      mek.message =
        Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message

      if (mek.key && mek.key.remoteJid === "status@broadcast") {
        if (config.AUTO_READ_STATUS) {
          await sock.readMessages([mek.key])
          console.log(color("🃏 Hisoka a lu un statut...", "cyan"))
        }
        return
      }

      if (!mek.key.fromMe && chatUpdate.type === "notify") {
        const m = smsg(sock, mek, store)

        // Traitement des plugins
        for (const [name, plugin] of plugins) {
          if (plugin.pattern) {
            // Vérifier si le message commence par un des préfixes ou si le préfixe vide est autorisé
            const hasValidPrefix = config.prefa.some((prefix) => {
              if (prefix === "") return true // Préfixe vide = toujours valide
              return m.body.startsWith(prefix)
            })

            if (hasValidPrefix && plugin.pattern.test(m.body || "")) {
              try {
                await plugin.function(m, sock, store)
              } catch (e) {
                console.log(color(`🎭 Erreur dans ${name}: ${e}`, "red"))
              }
              break
            }
          }
        }
      }
    } catch (err) {
      console.log(color("🃏 Erreur dans messages.upsert:", "red"), err)
    }
  })

  // Gestion des participants de groupe
  sock.ev.on("group-participants.update", async (anu) => {
    try {
      const welcomePlugin = plugins.get("welcome.js")
      const leavePlugin = plugins.get("leave.js")

      if (anu.action === "add" && welcomePlugin) {
        await welcomePlugin.function(anu, sock)
      } else if (anu.action === "remove" && leavePlugin) {
        await leavePlugin.function(anu, sock)
      }
    } catch (err) {
      console.log(color("🎭 Erreur group-participants:", "red"), err)
    }
  })

  return sock
}

// Messages de démarrage
console.log(
  color(
    `
🃏═══════════════════════════════════════🃏
    ██╗  ██╗██╗███████╗ ██████╗ ██╗  ██╗ █████╗ 
    ██║  ██║██║██╔════╝██╔═══██╗██║ ██╔╝██╔══██╗
    ███████║██║███████╗██║   ██║█████╔╝ ███████║
    ██╔══██║██║╚════██║██║   ██║██╔═██╗ ██╔══██║
    ██║  ██║██║███████║╚██████╔╝██║  ██╗██║  ██║
    ╚═╝  ╚═╝╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
                                                
         🎭 HIS-MD V0 - Bot WhatsApp Hybride 🎭
              "Ohhh~ Le spectacle commence!"
🃏═══════════════════════════════════ Joker
`,
    "magenta",
  ),
)

console.log(color("🎭 Créateur: hhhisoka", "cyan"))
console.log(color("🃏 Thème: Hisoka (Hunter x Hunter)", "yellow"))
console.log(color("✨ Fusion: Levanter + Queen-Elisa-MD-V2", "green"))

// Chargement et démarrage
loadPlugins().then(async () => {
  startHisoka()
})
