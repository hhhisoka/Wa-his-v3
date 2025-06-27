commands.add({
    name: ["getcmd"],
    command: ["getcmd"],
    category: "owner",
    desc: "View the function source code of a command",
    owner: true,
    query: true,
    usage: "<command>",
    example: ".getcmd menu",
    run: async ({ sius, m, args }) => {
        const target = args[0]?.toLowerCase()
        if (!target) return m.example("<command>")
        
        const data = commands.findCommand(target)
        if (!data) return m.reply(`⚠️ Command *${target}* not found!`)
        
        const code = data.run?.toString()
        if (!code || code.length < 10) return m.reply("⚠️ Unable to display the function source.")
        
        const header = `📄 *FUNCTION SOURCE - .${target}*\n` +
            `▢ *Command:* ${data.command[0]}\n` +
            `▢ *Category:* ${data.category}\n` +
            `▢ *Status:* ${data.enable ? "Enabled" : "Disabled"}\n\n`
        
        return m.reply(header + "```\n" + code + "\n```")
    }
})