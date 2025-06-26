commands.add({
    name: ["join"],
    command: ["join"],
    category: "owner",
    desc: "Make the bot join a group using a WhatsApp invite link.",
    param: "<WhatsApp invite link>",
    owner: true,
    run: async ({ sius, m, args }) => {
        const text = args[0]
        const errorMsg = `[×] Please provide a valid group invite link!`
        if (!text || !text.includes("chat.whatsapp.com/")) return m.reply(errorMsg)
        
        const groupId = text.split("chat.whatsapp.com/")[1]?.split(" ")[0]
        if (!groupId) return m.reply(errorMsg)
        
        try {
            const result = await sius.groupAcceptInvite(groupId)
            const pendingMsg = `[√] Join request is being processed by the group admin.`
            m.reply(result ? config.mess.success : pendingMsg)
        } catch (err) {
            sius.cantLoad(err)
        }
    }
})