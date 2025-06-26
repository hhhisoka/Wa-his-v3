commands.add({
    name: ["+block", "block"],
    command: ["+block", "block"],
    alias: ["addblock", "blokir", "blockir"],
    category: "owner",
    owner: true,
    run: async ({ sius, m, args }) => {
        let text = args.join(" ")
        let target = m.mentionedJid?.[0] || m.quoted?.sender || (text?.replace(/\D/g, "") + "@s.whatsapp.net")
        
        if (target) {
            await sius.updateBlockStatus(target, "block")
                .then(() => m.reply(config.mess.success))
                .catch(() => m.reply("[×] Failed to block the target"))
        } else {
            m.reply("[×] Please reply, tag, or provide the number to block")
        }
    }
})

commands.add({
    name: ["-block", "unblock"],
    command: ["-block", "unblock"],
    alias: ["unblockir", "unblokir"],
    category: "owner",
    owner: true,
    run: async ({ sius, m, args }) => {
        let text = args.join(" ")
        let target = m.mentionedJid?.[0] || m.quoted?.sender || (text?.replace(/\D/g, "") + "@s.whatsapp.net")
        
        if (target) {
            await sius.updateBlockStatus(target, "unblock")
                .then(() => m.reply(config.mess.success))
                .catch(() => m.reply("[×] Failed to unblock the target"))
        } else {
            m.reply("[×] Please reply, tag, or provide the number to unblock")
        }
    }
})

commands.add({
    name: ["listblock"],
    command: ["listblock"],
    alias: ["blocklist", "listblockir", "listblokir"],
    category: "info",
    run: async ({ sius, m }) => {
        try {
            let blockedUsers = await sius.fetchBlocklist()
            let list = blockedUsers.map(v => "• " + v.replace(/@.+/, "")).join("\n")
            m.reply(`📛 *Blocked Users: ${blockedUsers.length}*\n\n${list}`)
        } catch (e) {
            m.reply("⚠️ Failed to retrieve blocked user list")
        }
    }
})