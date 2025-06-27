import chalk from "chalk"
import util from "util"
import path from "path"
import cron from "node-cron"
import fs from "fs"
import syntaxerror from "syntax-error"
import dl from "./scrape.js"
import infobot from "../settings.js"
import * as Func from "./functions.js"
import { exec } from "child_process"
import { fileURLToPath } from "url"
import { setLimit } from "./game.js"
import commandEvents from "./events.js"
import { GroupUpdate, LoadDataBase } from "./update.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const { autoLoadAllJS } = Func;
const lastGreeting = new Map()
const warned = new Map()

global.commands = new commandEvents()
global.config = infobot
global.cmdLogs = []
global.rateLimit = new Map()
global.events = []

export async function handler(sius, m, msg, store, groupCache) {
    try {
        await autoLoadAllJS("./cmd", commands)
    } catch (e) {
        console.log("⚠️ Failed to load commands " + e)
    }

    if (!store.messages[msg.key.remoteJid]?.array?.some(a => a.key.id === msg.key.id)) return
    if (!msg.message) return

    await LoadDataBase(sius, m)
    await GroupUpdate(sius, m, store)

    let message = (m.type === "conversation") ? m.message.conversation :
        (m.type == "imageMessage") ? m.message.imageMessage.caption :
        (m.type == "videoMessage") ? m.message.videoMessage.caption :
        (m.type == "extendedTextMessage") ? m.message.extendedTextMessage.text :
        (m.type == "buttonsResponseMessage") ? m.message.buttonsResponseMessage.selectedButtonId :
        (m.type == "listResponseMessage") ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
        (m.type == "templateButtonReplyMessage") ? m.message.templateButtonReplyMessage.selectedId :
        (m.type == "messageContextInfo") ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) :
        (m.type == "editedMessage") ? (m.message.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || m.message.editedMessage?.message?.protocolMessage?.editedMessage?.conversation || "") :
        (m.type == "protocolMessage") ? (m.message.protocolMessage?.editedMessage?.extendedTextMessage?.text || m.message.protocolMessage?.editedMessage?.conversation || m.message.protocolMessage?.editedMessage?.imageMessage?.caption || m.message.protocolMessage?.editedMessage?.videoMessage?.caption || "") : ""

    const isLimit = db.users[m.sender] ? (db.users[m.sender].limit > 0) : false
    const botNumber = await sius.decodeJid(sius.user.id);
    const set = db.set[botNumber]
    const setgroups = m.isGroup ? db.groups[m.chat] : {}
    sius.public = true
    const user = db.users[m.sender]
    const body = (typeof m.text == "string" ? m.text :"")
    
    // autoread
    if (set.autoread) {
        await sius.readMessages([msg.key])
            .catch((e) => console.log(e))
    }
    
	// auto set bio
	if (set.autobio) {
		if (new Date() * 1 - set.status > 60000) {
			await sius.updateProfileStatus(`🪽 ${sius.user.name} | Runtime : ${Func.runtime(process.uptime())}`).catch(e => {})
			set.status = new Date() * 1
		}
	}
	
    sius.cantLoad = async (e) => {
        const stack = e.stack || "⚠️ No Stack Trace";
        const fileMatch = stack.match(/at\s.*?$$(.*?):(\d+):(\d+)$$/) || stack.match(/at\s(.*?):(\d+):(\d+)/);
        const fileInfo = fileMatch ? `${fileMatch[1]}:${fileMatch[2]}` : "Unknown file";
        const errorMsg = `*HELLO BOSS 🫡, ERROR REPORT!*\n\n💬 *Chat :* ${m.isGroup ? `${m.metadata.subject || "-"} [ GROUP ]` : '@' + m.sender.split('@')[0]}\n*⚠️ Error*: ${e.message || e}\n*📂 File*: ${fileInfo}\n*🚩 Stack*:\n${stack.slice(0, 500)}`;
        const owners = config.owner.map(o => `${o.trim()}@s.whatsapp.net`);
        if (owners.length) {
            try {
                await Promise.all(owners.map(owner =>
                    sius.sendMessage(owner, { text: errorMsg, mentions: [m.sender] }, { quoted: m })
                ));
            } catch (ee) {
                console.error("Failed to send report:", ee);
            }
        }
        if (msg?.key?.remoteJid) {
            await sius.sendMessage(msg.key.remoteJid, { text: config.mess.failed }, { quoted: msg });
        }
    }

    const evFiles = fs.readdirSync("./cmd/@events").filter(v => v.endsWith(".js"))
    for (const file of evFiles) {
        const { default: ev } = await import(`../cmd/@events/${file}`)
        if (ev?.exec && typeof ev.exec === "function") {
            events.push(ev)
        }
    }
    for (const ev of events) {
        try {
            const result = await ev.exec({ sius, m, Func, msg, store });
            if (result !== false) break;
        } catch (err) {
            sius.cantLoad(err)
        }
    }
    
	if (!m.isOwner) {
        // set mode
        if (m.isBot) return
	    if (db.users[m.sender]?.ban) return
        if (set.privateonly && m.isGroup) return
        if (!sius.public && !m.key.fromMe) return
        if (m.isGroup && setgroups.mute) return
        if (set.grouponly && !m.isGroup) {
            if (!warned.has(m.sender)) {
                warned.set(m.sender, true)
                return sius.reply(m.chat, `Bot is currently running in *Group Only* mode. Access via *PC / Private Chat* is restricted.

*Available options:*
▢ Join public bot group: ${config.bot.group}   

📌 Features can still be used, but only from within groups.`.trim(), "A C C E S S - D E N I E D", true)
            }
            return;
        }
    }

    async function loadCommands() {
        commands.event = {}
        const cmdpath = path.join(__dirname, "../cmd")
        const commandFiles = fs.readdirSync(cmdpath).filter(file => file.endsWith(".js"))
        for (const file of commandFiles) {
            try {
                const filePath = path.join(cmdpath, file)
                const fileUrl = `file://${filePath}?update=${Date.now()}`
                await import(fileUrl)
                console.log(`[ 🔄 LOADING ] Loaded command: ${file}`)
                global.cmdLogs.push({
                    type: "add",
                    file: file,
                    time: new Date().toLocaleString("en"),
                    status: "Loaded successfully"
                })
            } catch (err) {
                console.error(`[ ⚠️ ERROR ] Loading command ${file}:`, err)
                global.cmdLogs.push({
                    type: "error",
                    file: file,
                    time: new Date().toLocaleString("en"),
                    status: `Error: ${err.message}`
                })
            }
        }
    }

    function setupHotReload() {
        const cmdpath = path.join(__dirname, "../cmd")
        fs.watch(cmdpath, { recursive: true }, async (eventType, filename) => {
            if (!filename || !filename.endsWith(".js")) return
            console.log(`[ 🔄 RELOAD ] Detected ${eventType} in ${filename}`)
            try {
                const filePath = path.join(cmdpath, filename)
                const fileUrl = `file://${filePath}?update=${Date.now()}`
                if (!fs.existsSync(filePath)) {
                    console.log(`[ 📂 DELETE ] ${filename} deleted, reloading all...`)
                    global.cmdLogs.push({
                        type: "delete",
                        file: filename,
                        time: new Date().toLocaleString("en"),
                        status: "File deleted"
                    })
                    await loadCommands()
                    return
                }
                await import(fileUrl)
                console.log(`[ 🔄 RELOAD ] Reloaded command: ${filename}`)
                global.cmdLogs.push({
                    type: "update",
                    file: filename,
                    time: new Date().toLocaleString("en"),
                    status: "Reloaded successfully"
                })
            } catch (err) {
                console.error(`[ ⚠️ ERROR ] Reloading ${filename}:`, err)
                global.cmdLogs.push({
                    type: "error",
                    file: filename,
                    time: new Date().toLocaleString("en"),
                    status: `Error: ${err.message}`
                })
            }
        })
    }

    setupHotReload();
    
    sius.reply = async(chat, q, sil, renderLarge, options = {}) => {
        let img = config.thumb.reply
        await sius.sendMessage(chat, {
            text: q,           
            contextInfo: {
                externalAdReply: {
                    title: sil,
                    previewType: "PHOTO",
                    thumbnailUrl: img,
                    renderLargerThumbnail: renderLarge,
                    mediaUrl: img,
                    mediaType: 1,
                    sourceUrl: config.github
                }
            },
            ...options
        }, { quoted: m });
    }

    sius.adChannel = async(q, options = {}) => {
        m.reply(q, {
        contextInfo: {
            forwardingScore: 10,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.channel,
                serverMessageId: null,
                newsletterName: options.txt ? options.txt : config.bot.name
            },
            externalAdReply: {
                title: options.title ? options.title : config.bot.name,
                thumbnailUrl: options.thumb ? options.thumb : config.thumb.reply,
                renderLargerThumbnail: options.render ? options.render : false,
                mediaType: 1,
                mediaUrl: options.thumb ? options.thumb : config.thumb.reply,
                sourceUrl: config.channel
            }
        }
        })
    }

    // log message
    console.log(chalk.hex("#999999")("─────────────────────────────"))
    console.log(chalk.bgHex("#4a69bd").white.bold("  📥 New Message  "))
    console.log(chalk.bgHex("#ffffff").hex("#333333")(
        `▢ Date        : ${new Date().toLocaleString()}\n` +
        `▢ Message     : ${message || m.body || "-"}\n` +
        `▢ Sender      : ${m.pushName}\n` +
        `▢ JID         : ${m.sender}`
    ))
    if (m.isGroup) {
    console.log(chalk.bgHex("#ffffff").hex("#333333")(
        `▢ Group       : ${m.metadata.subject}\n` +
        `▢ GroupJID    : ${m.chat}`
    ))
    }
    console.log(chalk.hex("#999999")("─────────────────────────────\n"))
            
     
    if (message?.startsWith("=> ") && m.isOwner) {
        const code = message.slice(3)
        try {
            let result = await eval(code)
            if (typeof result !== "string") {
                result = util.inspect(result)
            }
            await m.reply(result)
        } catch (err) {
            await m.reply(`Error:\n${err.message}`)
        }
        
        // exec
    } else if (message?.startsWith("$ ") && m.isOwne
