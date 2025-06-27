commands.add({
    name: ["animequote"],
    command: ["animequote"],
    alias: ["animequotes", "quoteanime", "quotesanime"],
    category: "anime",
    limit: true,
    desc: "Random anime quotes from characters",
    run: async ({ sius, m, Func }) => {
        // await m.reply({ react: { text: "🕣", key: m.key } }) // optional reaction
        
        const res = await Func.fetchJson("https://fastrestapis.fasturl.cloud/anime/animequote");
        if (!res?.result || !Array.isArray(res.result)) return m.reply("⚠️ Failed to fetch quote");
        
        const quote = Func.pickRandom(res.result);
        let text = `*${quote.character}* - ${quote.anime}\n`;
        text += `_${quote.episode}_\n\n`;
        text += `❝ ${quote.quote} ❞\n\n`;
        text += `Link: ${quote.link}`;
        
        const title = "🔖 A N I M E - Q U O T E S";
        await sius.reply(m.chat, text, title, false);
    }
});