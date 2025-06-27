commands.add({
    name: ["mode"],
    command: ["mode"],
    category: "owner",
    owner: true,
    run: async ({ sius, m, args }) => {
        let jid = await sius.decodeJid(sius.user.id)
        let set = db.set[jid]
        let mode = args[0]
        
        if (mode === "public") {
            sius.public = set.public = true
            set.grouponly = false
            set.privateonly = false
            m.reply("*[√] Successfully switched to public mode*")
        } else if (mode === "self") {
            set.grouponly = false
            set.privateonly = false
            sius.public = set.public = false
            m.reply("*[√] Successfully switched to self mode*")
        } else if (mode === "group") {
            set.grouponly = true
            set.privateonly = false
            m.reply("*[√] Successfully switched to group-only mode*")
        } else if (mode === "private") {
            set.grouponly = false
            set.privateonly = true
            m.reply("*[√] Successfully switched to private-only mode*")
        } else {
            m.reply(
                "• Please choose a valid bot mode below:\n▢ self\n▢ group\n▢ private\n▢ public"
            )
        }
    }
})

commands.add({
    name: ["self"],
    command: ["self"],
    category: "owner",
    owner: true,
    run: async ({ sius, m }) => {
        let jid = await sius.decodeJid(sius.user.id)
        let set = db.set[jid]
        set.grouponly = false
        set.privateonly = false
        sius.public = false
        set.public = false
        m.reply("*[√] Successfully switched to self mode*")
    }
})

commands.add({
    name: ["public"],
    command: ["public"],
    category: "owner",
    owner: true,
    run: async ({ sius, m }) => {
        let jid = await sius.decodeJid(sius.user.id)
        let set = db.set[jid]
        sius.public = true
        set.public = true
        set.grouponly = false
        set.privateonly = false
        m.reply("*[√] Successfully switched to public mode*")
    }
})

commands.add({
    name: ["grouponly"],
    command: ["grouponly"],
    alias: ["gconly"],
    category: "owner",
    owner: true,
    run: async ({ sius, m }) => {
        let jid = await sius.decodeJid(sius.user.id)
        let set = db.set[jid]
        set.grouponly = true
        set.privateonly = false
        m.reply("*[√] Successfully switched to group-only mode*")
    }
})

commands.add({
    name: ["privateonly"],
    command: ["privateonly"],
    alias: ["pconly"],
    category: "owner",
    owner: true,
    run: async ({ sius, m }) => {
        let jid = await sius.decodeJid(sius.user.id)
        let set = db.set[jid]
        set.grouponly = false
        set.privateonly = true
        m.reply("*[√] Successfully switched to private-only mode*")
    }
})

commands.add({
    name: ["shutdown"],
    command: ["shutdown"],
    category: "owner",
    owner: true,
    run: async ({ m }) => {
        m.reply("*[×] Shutting down...*").then(() => {
            process.exit(0)
        })
    }
})