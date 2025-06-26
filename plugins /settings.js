commands.add({
  name: ["anticall"],
  command: ["anticall"],
  category: "owner",
  owner: true,
  desc: "Enable/disable anti-call",
  run: async ({ sius, m, args }) => {
    const botNumber = await sius.decodeJid(sius.user.id);
    const set = db.set[botNumber];
    if (args[0] == 'on') {
      if (set.anticall) return m.reply("*Already Enabled*");
      set.anticall = true;
      m.reply(config.mess.success);
    } else if (args[0] == 'off') {
      set.anticall = false;
      m.reply(config.mess.success);
    } else sius.sendButton(m.chat, [["On", ".anticall on"], ["Off", ".anticall off"]], {
      text: "*Please select an option below*\n\n> On: Enable\n> Off: Disable",
      quoted: m
    });
  }
});

commands.add({
  name: ["autobackup"],
  command: ["autobackup"],
  category: "owner",
  owner: true,
  desc: "Enable/disable automatic database backup",
  run: async ({ sius, m, args }) => {
    const botNumber = await sius.decodeJid(sius.user.id);
    const set = db.set[botNumber];
    if (args[0] == 'on') {
      if (set.autobackup) return m.reply("*Already Enabled*");
      set.autobackup = true;
      m.reply(config.mess.success);
    } else if (args[0] == 'off') {
      set.autobackup = false;
      m.reply(config.mess.success);
    } else sius.sendButton(m.chat, [["On", ".autobackup on"], ["Off", ".autobackup off"]], {
      text: "*Please select an option below*\n\n> On: Enable\n> Off: Disable",
      quoted: m
    });
  }
});

commands.add({
  name: ["autobio"],
  command: ["autobio"],
  category: "owner",
  owner: true,
  desc: "Enable/disable auto bio update",
  run: async ({ sius, m, args }) => {
    const botNumber = await sius.decodeJid(sius.user.id);
    const set = db.set[botNumber];
    if (args[0] == 'on') {
      if (set.autobio) return m.reply("*Already Enabled*");
      set.autobio = true;
      m.reply(config.mess.success);
    } else if (args[0] == 'off') {
      set.autobio = false;
      m.reply(config.mess.success);
    } else sius.sendButton(m.chat, [["On", ".autobio on"], ["Off", ".autobio off"]], {
      text: "*Please select an option below*\n\n> On: Enable\n> Off: Disable",
      quoted: m
    });
  }
});

commands.add({
  name: ["setmenu"],
  command: ["setmenu"],
  category: "owner",
  owner: true,
  desc: "Change menu style",
  run: async ({ sius, m, args }) => {
    const userId = await sius.decodeJid(sius.user.id);
    const set = db.set[userId];
    if (args[0] == 'buttonList') {
      set.template = "buttonList";
      m.reply(config.mess.success);
    } else if (args[0] == 'replyAd') {
      set.template = "replyAd";
      m.reply(config.mess.success);
    } else if (args[0] == 'documentButton') {
      set.template = "documentButtonList";
      m.reply(config.mess.success);
    } else if (args[0] == 'documentButtonWithAdReply') {
      set.template = "documentButtonWithAdReply";
      m.reply(config.mess.success);
    } else if (args[0] == 'simple') {
      set.template = "simple";
      m.reply(config.mess.success);
    } else sius.sendButton(m.chat, [
      ["Style 1", ".setmenu replyAd"],
      ["Style 2", ".setmenu buttonList"],
      ["Style 3", ".setmenu documentButton"]
    ], {
      text: `*Please select a menu style below*\n\n> 1: ExternalAdReply\n> 2: ButtonList\n> 3: DocumentButtonList\n> 4: documentButtonWithAdReply\n> 5. simple\n\n> Other options: documentButtonWithAdReply\n> Example: .setmenu adReply`,
      quoted: m
    });
  }
});

commands.add({
  name: ["autoread"],
  command: ["autoread"],
  category: "owner",
  owner: true,
  desc: "Enable/disable autoread",
  run: async ({ sius, m, args }) => {
    const botNumber = await sius.decodeJid(sius.user.id);
    const set = db.set[botNumber];
    if (args[0] == 'on') {
      if (set.autoread) return m.reply("*[×] Already Enabled*");
      set.autoread = true;
      m.reply(config.mess.success);
    } else if (args[0] == 'off') {
      set.autoread = false;
      m.reply(config.mess.success);
    } else sius.sendButton(m.chat, [["On", ".autoread on"], ["Off", ".autoread off"]], {
      text: "*Please select an option below*\n\n> On: Enable\n> Off: Disable",
      quoted: m
    });
  }
});

commands.add({
  name: ["autotyping"],
  command: ["autotyping"],
  category: "owner",
  owner: true,
  desc: "Enable/disable auto typing",
  run: async ({ sius, m, args }) => {
    const botNumber = await sius.decodeJid(sius.user.id);
    const set = db.set[botNumber];
    if (args[0] == 'on') {
      if (set.autotyping) return m.reply("*Already Enabled*");
      set.autotyping = true;
      m.reply(config.mess.success);
    } else if (args[0] == 'off') {
      set.autotyping = false;
      m.reply(config.mess.success);
    } else sius.sendButton(m.chat, [["On", ".autotyping on"], ["Off", ".autotyping off"]], {
      text: "*Please select an option below*\n\n> On: Enable\n> Off: Disable",
      quoted: m
    });
  }
});

commands.add({
  name: ["readsw"],
  command: ["readsw"],
  category: "owner",
  owner: true,
  desc: "Enable/disable Story Watch (read Status)",
  run: async ({ sius, m, args }) => {
    const botNumber = await sius.decodeJid(sius.user.id);
    const set = db.set[botNumber];
    if (args[0] == 'on') {
      if (set.readsw) return m.reply("*Already Enabled*");
      set.readsw = true;
      m.reply(config.mess.success);
    } else if (args[0] == 'off') {
      set.readsw = false;
      m.reply(config.mess.success);
    } else sius.sendButton(m.chat, [["On", ".readsw on"], ["Off", ".readsw off"]], {
      text: "*Please select an option below*\n\n> On: Enable\n> Off: Disable",
      quoted: m
    });
  }
});

commands.add({
  name: ["antispam"],
  command: ["antispam"],
  category: "owner",
  owner: true,
  desc: "Enable/disable anti-spam",
  run: async ({ sius, m, args }) => {
    const botNumber = await sius.decodeJid(sius.user.id);
    const set = db.set[botNumber];
    if (args[0] == 'on') {
      if (set.antispam) return m.reply("*Already Enabled*");
      set.antispam = true;
      m.reply(config.mess.success);
    } else if (args[0] == 'off') {
      set.antispam = false;
      m.reply(config.mess.success);
    } else sius.sendButton(m.chat, [["On", ".antispam on"], ["Off", ".antispam off"]], {
      text: "*Please select an option below*\n\n> On: Enable\n> Off: Disable",
      quoted: m
    });
  }
});

commands.add({
  name: ["settings"],
  command: ["settings"],
  category: "owner",
  alias: ["set"],
  desc: "Change or view bot settings",
  owner: true,
  run: async ({ sius, m, args, Func }) => {
    const jid = sius.decodeJid(sius.user.id);
    const bot = db.set[jid];
    if (!bot) return m.reply("[×] Bot data not found");

    if (!args[0]) {
      let text = "";
      for (let [key, val] of Object.entries(bot)) {
        text += `▢ ${key.charAt(0).toUpperCase() + key.slice(1)}: ${typeof val == "boolean" ? val ? "√" : "×" : val}\n`;
      }
      text += "\n> Type .settings <key> <value> to change";
      return sius.adChannel(text, { title: "B O T - S E T T I N G S" });
    }

    const key = args[0].toLowerCase();
    const value = args[1];
    if (!(key in bot)) return m.reply(`[×] Unknown key "${key}"`);

    const type = typeof bot[key];
    let newValue;

    if (type == "boolean") {
      if (value !== "true" && value !== "false") return m.reply("[×] Value must be 'true' or 'false'");
      newValue = value === "true";
    } else if (type == "number") {
      if (isNaN(value)) return m.reply("[×] Value must be a number");
      newValue = parseInt(value);
    } else {
      newValue = value;
    }

    bot[key] = newValue;
    return m.reply(`[√] Setting "${key}" has been changed to "${newValue}"`);
  }
});