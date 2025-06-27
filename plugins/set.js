commands.add({
    name: ["setwelcome"],
    command: ["setwelcome"],
    desc: "Set a custom welcome message for the group",
    category: "group",
    admin: true,
    group: true,
    run: async ({ sius, m, args }) => {
        if (!args.length) return m.reply("Please provide the welcome text to set!");
        const text = args.join(" ");
        const id = m.chat;
        if (!db.groups[id]) db.groups[id] = {};
        db.groups[id].setwelcome = text;
        m.reply(`[√] Welcome message saved:\n${text}`);
    }
});

commands.add({
    name: ["setleave"],
    command: ["setleave"],
    desc: "Set a custom leave message for the group",
    category: "group",
    admin: true,
    group: true,
    run: async ({ sius, m, args }) => {
        if (!args.length) return m.reply("Please provide the leave text to set!");
        const text = args.join(" ");
        const id = m.chat;
        if (!db.groups[id]) db.groups[id] = {};
        db.groups[id].setleave = text;
        m.reply(`[√] Leave message saved:\n${text}`);
    }
});

commands.add({
    name: ["setpromote"],
    command: ["setpromote"],
    desc: "Set a custom promote message for the group",
    category: "group",
    admin: true,
    group: true,
    run: async ({ sius, m, args }) => {
        if (!args.length) return m.reply("Please provide the promote text to set!");
        const text = args.join(" ");
        const id = m.chat;
        if (!db.groups[id]) db.groups[id] = {};
        db.groups[id].setpromote = text;
        m.reply(`[√] Promote message saved:\n${text}`);
    }
});

commands.add({
    name: ["setdemote"],
    command: ["setdemote"],
    desc: "Set a custom demote message for the group",
    category: "group",
    admin: true,
    group: true,
    run: async ({ sius, m, args }) => {
        if (!args.length) return m.reply("Please provide the demote text to set!");
        const text = args.join(" ");
        const id = m.chat;
        if (!db.groups[id]) db.groups[id] = {};
        db.groups[id].setdemote = text;
        m.reply(`[√] Demote message saved:\n${text}`);
    }
});

commands.add({
    name: ["adminonly"],
    command: ["adminonly"],
    description: "Enable or disable admin-only mode for the group",
    category: "group",
    group: true,
    admin: true,
    run: async ({ sius, m, args }) => {
        const mode = args[0]?.toLowerCase();
        if (!mode || !["on", "off"].includes(mode)) {
            return m.reply("[×] Invalid format! Use .adminonly on/off");
        }
        if (!db.groups[m.chat]) db.groups[m.chat] = {};
        db.groups[m.chat].adminonly = mode === "on";
        await m.reply(`[√] Admin-only mode is now *${mode === "on" ? "enabled" : "disabled"}* in this group.`);
    }
});