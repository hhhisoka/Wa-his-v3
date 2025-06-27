export default {
    name: "anti-virtex",
    exec: async ({ sius, m }) => {
        const isOwner = config.owner.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
        
        // Ignore if: no text, from bot, not in group, from admin, bot not admin, or sender is owner
        if (!m.text || m.key.fromMe || !m.isGroup || m.isAdmin || !m.isBotAdmin || isOwner) return false
        
        const messageText = typeof m.text === "string" ? m.text.toLowerCase() : ""
        const groupSettings = db.groups[m.chat] || {}
        
        if (groupSettings.antivirtex) {
            // Check for virtex (very long message)
            if (messageText.length > 10000) {
                await sius.sendMessage(m.chat, {
                    delete: {
                        remoteJid: m.chat,
                        fromMe: false,
                        id: m.id,
                        participant: m.sender
                    }
                })
                
                await sius.relayMessage(m.chat, {
                    extendedTextMessage: {
                        text: `Detected @${m.sender.split("@")[0]} sending a Virtex message.`,
                        contextInfo: {
                            mentionedJid: [m.key.participant],
                            isForwarded: true,
                            forwardingScore: 1,
                            quotedMessage: { conversation: "*Anti Virtex❗*" },
                            ...m.key
                        }
                    }
                }, {})
                
                await sius.groupParticipantsUpdate(m.chat, [m.sender], "remove")
                return true
            }
            
            // Check for FlowMessage spam (bug/lag type)
            if (m.msg.nativeFlowMessage && m.msg.nativeFlowMessage.messageParamsJson && m.msg.nativeFlowMessage.messageParamsJson.length > 3500) {
                await sius.sendMessage(m.chat, {
                    delete: {
                        remoteJid: m.chat,
                        fromMe: false,
                        id: m.id,
                        participant: m.sender
                    }
                })
                
                await sius.relayMessage(m.chat, {
                    extendedTextMessage: {
                        text: `Detected @${m.sender.split("@")[0]} sending a bug-type message.`,
                        contextInfo: {
                            mentionedJid: [m.key.participant],
                            isForwarded: true,
                            forwardingScore: 1,
                            quotedMessage: { conversation: "*Anti Bug❗*" },
                            ...m.key
                        }
                    }
                }, {})
                
                await sius.groupParticipantsUpdate(m.chat, [m.sender], "remove")
                return true
            }
        }
        
        return false
    }
}