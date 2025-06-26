commands.add({
    name: ["antilink"],
    command: ["antilink"],
    param: "<on/off>",
    category: "group",
    param: "<on/off>",
    admin: true,
    group: true,
    botAdmin: true,
    desc: "Enable/disable group antilink",
    run: async ({ sius, m, args }) => {
        const set = db.groups[m.chat]
        if (/on|true/i.test(args[0])) {
            if (set.antilink) return m.reply("*Already Active Previously*")
            set.antilink = true
            m.reply("*Successfully activated !!*")
        } else if (/off|false/i.test(args[0])) {
            set.antilink = false
            m.reply("*Successfully deactivated !!*")
        } else sius.sendButton(m.chat, [
            ["On", ".antilink on"],
            ["Off", ".antilink off"]
        ], {
            text: "*Please choose an option below*\n\n> On: Enable\n> Off: Disable",
            quoted: m
        })
    }
})

commands.add({
    name: ["antivirtex"],
    command: ["antivirtex"],
    category: "group",
    param: "<on/off>",
    param: "<on/off>",
    admin: true,
    group: true,
    botAdmin: true,
    desc: "Enable/disable group antivirtex",
    run: async ({ sius, m, args }) => {
        const set = db.groups[m.chat]
        if (/on|true/i.test(args[0])) {
            if (set.antivirtex) return m.reply("*Already Active Previously*")
            set.antivirtex = true
            m.reply("*Successfully activated !!*")
        } else if (/off|false/i.test(args[0])) {
            set.antivirtex = false
            m.reply("*Successfully deactivated !!*")
        } else sius.sendButton(m.chat, [
            ["On", ".antivirtex on"],
            ["Off", ".antivirtex off"]
        ], {
            text: "*Please choose an option below*\n\n> On: Enable\n> Off: Disable",
            quoted: m
        })
    }
})

commands.add({
    name: ["antidelete"],
    command: ["antidelete"],
    category: "group",
    param: "<on/off>",
    admin: true,
    group: true,
    botAdmin: true,
    desc: "Enable/disable group antidelete",
    run: async ({ sius, m, args }) => {
        const set = db.groups[m.chat]
        if (/on|true/i.test(args[0])) {
            if (set.antidelete) return m.reply("*Already Active Previously*")
            set.antidelete = true
            m.reply("*Successfully activated !!*")
        } else if (/off|false/i.test(args[0])) {
            set.antidelete = false
            m.reply("*Successfully deactivated !!*")
        } else sius.sendButton(m.chat, [
            ["On", ".antidelete on"],
            ["Off", ".antidelete off"]
        ], {
            text: "*Please choose an option below*\n\n> On: Enable\n> Off: Disable",
            quoted: m
        })
    }
})

commands.add({
    name: ["welcome"],
    command: ["welcome"],
    category: "group",
    param: "<on/off>",
    admin: true,
    group: true,
    botAdmin: true,
    desc: "Enable/disable group welcome",
    run: async ({ sius, m, args }) => {
        const set = db.groups[m.chat]
        if (/on|true/i.test(args[0])) {
            if (set.welcome) return m.reply("*Already Active Previously*")
            set.welcome = true
            m.reply("*Successfully activated !!*")
        } else if (/off|false/i.test(args[0])) {
            set.welcome = false
            m.reply("*Successfully deactivated !!*")
        } else sius.sendButton(m.chat, [
            ["On", ".welcome on"],
            ["Off", ".welcome off"]
        ], {
            text: "*Please choose an option below*\n\n> On: Enable\n> Off: Disable",
            quoted: m
        })
    }
})



commands.add({
    name: ["antihidetag"],
    command: ["antihidetag"],
    category: "group",
    param: "<on/off>",
    admin: true,
    group: true,
    botAdmin: true,
    desc: "Enable/disable group antihidetag",
    run: async ({ sius, m, args }) => {
        const set = db.groups[m.chat]
        if (/on|true/i.test(args[0])) {
            if (set.antihidetag) return m.reply("*Already Active Previously*")
            set.antihidetag = true
            m.reply("*Successfully activated !!*")
        } else if (/off|false/i.test(args[0])) {
            set.antihidetag = false
            m.reply("*Successfully deactivated !!*")
        } else sius.sendButton(m.chat, [
            ["On", ".antihidetag on"],
            ["Off", ".antihidetag off"]
        ], {
            text: "*Please choose an option below*\n\n> On: Enable\n> Off: Disable",
            quoted: m
        })
    }
})

commands.add({
    name: ["antitagsw"],
    command: ["antitagsw"],
    category: "group",
    param: "<on/off>",
    admin: true,
    group: true,
    botAdmin: true,
    desc: "Enable/disable group antitagsw",
    run: async ({ sius, m, args }) => {
        const set = db.groups[m.chat]
        if (/on|true/i.test(args[0])) {
            if (set.antitagsw) return m.reply("*Already Active Previously*")
            set.antitagsw = true
            m.reply("*Successfully activated !!*")
        } else if (/off|false/i.test(args[0])) {
            set.antitagsw = false
            m.reply("*Successfully deactivated !!*")
        } else sius.sendButton(m.chat, [
            ["On", ".antitagsw on"],
            ["Off", ".antitagsw off"]
        ], {
            text: "*Please choose an option below*\n\n> On: Enable\n> Off: Disable",
            quoted: m
        })
    }
})