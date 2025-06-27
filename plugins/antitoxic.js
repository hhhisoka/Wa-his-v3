export default {
    name: "anti-toxic",
    exec: async ({ sius, m }) => {
        const isOwner = config.owner.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
        
        // Ignore if: no text, from bot, not in group, from admin, bot not admin, or sender is owner
        if (!m.text || m.key.fromMe || !m.isGroup || m.isAdmin || !m.isBotAdmin || isOwner) return false
        
        const messageText = typeof m.text === "string" ? m.text.toLowerCase() : ""
        const groupSettings = db.groups[m.chat] || {}
        
        const isToxic = messageText.split(/\s+/).some(word => config.badWords.includes(word))
        
        if (isToxic && groupSettings.antitoxic) {
            // Delete toxic message
            await sius.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.id,
                    participant: m.sender
                }
            })
            
            // Send warning message
            await sius.relayMessage(m.chat, {
                extendedTextMessage: {
                    text: `Detected @${m.sender.split("@")[0]} using toxic language.\nPlease be respectful and use proper language.`,
                    contextInfo: {
                        mentionedJid: [m.key.participant],
                        isForwarded: true,
                        forwardingScore: 1,
                        quotedMessage: { conversation: "*Anti Toxic❗*" },
                        ...m.key
                    }
                }
            }, {})
            
            return true
        }
        
        return false
    }
}