commands.add({
    name: ["temporarymessages", "pesansementara"],
    command: ["temporarymessages", "pesansementara"],
    param: "<on/off>",
    category: "group",
    desc: "Enable or disable disappearing messages mode in group",
    admin: true,
    botAdmin: true,
    group: true,
    run: async ({ sius, m, args }) => {
        const arg = args[0]?.toLowerCase()
        if (/90|7|1|on/i.test(arg)) {
            // Set disappearing messages duration based on input
            // 90 days = 7776000 seconds, 7 days = 604800 seconds, 1 day = 86400 seconds
            const duration = /90/.test(arg) ? 7776000 :
                /7/.test(arg) ? 604800 :
                86400
            await sius.sendMessage(m.chat, { disappearingMessagesInChat: duration })
            m.reply("Success!")
        } else if (/0|off|false/i.test(arg)) {
            // Disable disappearing messages
            await sius.sendMessage(m.chat, { disappearingMessagesInChat: 0 })
            m.reply("Success!")
        } else {
            m.reply("Please choose:\n\n*90 days, 7 days, 1 day, off*")
        }
    }
})