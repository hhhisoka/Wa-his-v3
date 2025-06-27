commands.add({
    name: ["deletecmd", "delcmd"],
    command: ["deletecmd", "delcmd"],
    category: "owner",
    desc: "Delete a custom command from the system",
    query: true,
    owner: true,
    usage: "<command>",
    example: ".deletecmd menu",
    run: async ({ sius, m, args, Func }) => {
        const target = args[0]?.toLowerCase()
        if (!target) return m.example("<command>")
        
        const cmd = commands.findCommand(target)
        if (!cmd) {
            // Suggestion if the command is mistyped
            const allCommands = commands.getAllCommands().flatMap(e => [...e.command, ...(e.alias || [])])
            const suggestion = Func.suggestCommand(target, allCommands)
            if (suggestion && suggestion.similarity > 70) {
                return m.reply(`⚠️ Command not found!\nDid you mean: *.${suggestion.suggestion}*?`)
            }
            return m.reply("⚠️ Command not found.")
        }
        
        const removed = commands.remove(cmd.name[0])
        if (removed) {
            return m.reply(`[√] Command *.${target}* has been successfully deleted from the system`)
        } else {
            return m.reply(`⚠️ Failed to delete the command`)
        }
    }
})