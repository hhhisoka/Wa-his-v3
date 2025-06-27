commands.add({
    name: ["ban", "+ban"],
    param: "<number>",
    command: ["ban", "+ban"],
    category: "owner",
    owner: true,
    desc: "Ban a specific number",
    run: async ({ sius, m, args, Func }) => {
        try {
            let target = m.mentionedJid?.[0] || m.quoted?.sender || args[0] ? args[0] + "@s.whatsapp.net" : m.sender
            let number = Func.formatNumber(target)
            if (!number) return m.reply('[×] Include target number')
            if (global.db.users[number]) {
                global.db.users[number].ban = true
                await m.reply('[√] User has been banned')
            } else {
                await m.reply('[×] User not registered')
            }
        } catch (e) {
            sius.cantLoad(e)
        }
    }
})

commands.add({
    name: ["-ban", "unban"],
    param: "<number>",
    command: ["-ban", "unban"],
    category: "owner",
    owner: true,
    desc: "Remove ban from a specific number",
    run: async ({ sius, m, args, Func }) => {
        try {
            let target = m.mentionedJid?.[0] || m.quoted?.sender || args[0] ? args[0] + "@s.whatsapp.net" : m.sender
            let number = Func.formatNumber(target)
            if (!number) return m.reply('[×] Include target number')
            if (global.db.users[number]) {
                global.db.users[number].ban = false
                await m.reply('[√] User has been unbanned')
            } else {
                await m.reply('[×] User not registered')
            }
        } catch (e) {
            sius.cantLoad(e)
        }
    }
})