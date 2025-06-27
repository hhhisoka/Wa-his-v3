commands.add({
    name: ["setnamegroup"],
    command: ["setnamegroup"],
    alias: ["setnamegrup", "setnamegc"],
    category: "group",
    desc: "Update the group name",
    admin: true,
    group: true,
    botAdmin: true,
    run: async ({ sius, m, args }) => {
        const text = args.join(" ");
        
        if (text) {
            try {
                await sius.groupUpdateSubject(m.chat, text);
                m.reply(`✅ *Group name has been updated to:*\n\n${text}`);
            } catch (e) {
                console.error(e);
                m.reply("❌ Failed to update the group name.");
            }
        } else {
            m.reply(`Please provide a group name.\n\nExample:\n.setnamegroup Itsuki Group`);
        }
    }
});