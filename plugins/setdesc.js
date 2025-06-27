commands.add({
    name: ["setdescription"],
    command: ["setdeskripsi", "setdesc", "setdescription"],
    alias: ["setdesc", "setdescription"],
    category: "group",
    desc: "Update the group description",
    admin: true,
    group: true,
    botAdmin: true,
    run: async ({ sius, m, args, command }) => {
        const text = args.join(" ");
        if (text) {
            await sius.groupUpdateDescription(m.chat, text);
            m.reply(`*Group description has been updated to:*\n\n${text}`);
        } else {
            return m.reply(`Please enter the group description!\nExample:\n.${command} Rules of my group`);
        }
    }
});