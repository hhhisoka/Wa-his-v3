export default {
    name: "anti-hidetag",
    exec: async ({ sius, m }) => {
        const isOwner = config.owner.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
        
        // Skip conditions: if message is from bot, not in group, from admin, bot is not admin, or from owner
        if (m.key.fromMe || !m.isGroup || m.isAdmin || !m.isBotAdmin || isOwner) return false;
        
        const setting = db.groups[m.chat] || {}
        const antiHidetagEnabled = setting.antihidetag
        
        const allMentioned = m.mentionedJid?.length &&
            m.metadata?.participants &&
            m.mentionedJid.length === m.metadata.participants.length
        
        if (antiHidetagEnabled && allMentioned) {
            await sius.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.id,
                    participant: m.sender
                }
            })
            await m.reply("*Anti-Hidetag is enabled!* 🚫")
            return true
        }
        
        return false
    }
}