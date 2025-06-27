commands.add({
    name: ["mute"],
    command: ["mute"],
    category: "owner",
    owner: true,
    group: true,
    desc: "Mute the bot in a specific group.",
    run: async ({ sius, m }) => {
        try {
            db.groups[m.chat].mute = true
            m.reply("[√] The bot has been muted in this group!")
        } catch (e) {
            sius.cantLoad(e)
        }
    }
})

commands.add({
    name: ["unmute"],
    command: ["unmute"],
    category: "owner",
    owner: true,
    group: true,
    desc: "Unmute the bot in a specific group.",
    run: async ({ sius, m }) => {
        try {
            db.groups[m.chat].mute = false
            m.reply("[√] Successfully unmuted!")
        } catch (e) {
            sius.cantLoad(e)
        }
    }
})