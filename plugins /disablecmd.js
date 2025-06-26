commands.add({
    name: ["enablecmd"],
    command: ["enablecmd"],
    category: "owner",
    owner: true,
    query: true,
    desc: "Enable a command",
    usage: "<command>",
    run: async ({ m, args }) => {
        const target = args[0]?.toLowerCase()
        const cmd = commands.findCommand(target)
        if (!cmd) return m.reply(`⚠️ Command *${target}* not found.`)
        
        const success = commands.setCommandState(cmd.name[0], true)
        m.reply(success ?
            `[√] Command *${cmd.name[0]}* has been successfully enabled.` :
            `⚠️ Failed to enable the command.`)
    }
})

commands.add({
    name: ["disablecmd"],
    command: ["disablecmd"],
    category: "owner",
    owner: true,
    query: true,
    desc: "Disable a command",
    usage: "<command>",
    run: async ({ m, args }) => {
        const target = args[0]?.toLowerCase()
        const cmd = commands.findCommand(target)
        if (!cmd) return m.reply(`⚠️ Command *${target}* not found.`)
        
        const success = commands.setCommandState(cmd.name[0], false)
        m.reply(success ?
            `[√] Command *${cmd.name[0]}* has been successfully disabled.` :
            `⚠️ Failed to disable the command.`)
    }
})