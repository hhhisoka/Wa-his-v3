export default {
    name: "anti-link",
    exec: async ({ sius, m }) => {
        const isOwner = config.owner.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
        
        // Ignore if: no text, from bot, not a group, from admin, bot isn't admin, or sender is owner
        if (!m.text || m.key.fromMe || !m.isGroup || m.isAdmin || !m.isBotAdmin || isOwner) return false
        
        const messageText = typeof m.text === "string" ? m.text.toLowerCase() : ""
        const groupSettings = db.groups[m.chat] || {}
        
        // Detect WhatsApp group links and check if anti-link is active
        if (messageText.match("chat.whatsapp.com/") && groupSettings.antilink) {
            // Delete the message
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
                    text: `Detected @${m.sender.split("@")[0]} sharing a group link.\nSorry, links must be removed.`,
                    contextInfo: {
                        mentionedJid: [m.key.participant],
                        isForwarded: true,
                        forwardingScore: 1,
                        quotedMessage: { conversation: "*Anti Link❗*" },
                        ...m.key
                    }
                }
            }, {})
            
            return true
        }
        
        return false
    }
}