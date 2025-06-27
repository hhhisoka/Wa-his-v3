commands.add({
    name: ["manga"],
    command: ["manga"],
    category: "anime",
    limit: true,
    query: true,
    example: "One Piece",
    usage: "<title>",
    desc: "Search manga info from MAL",
    run: async ({ sius, m, args, Func }) => {
        // await m.reply({ react: { text: "🕣", key: m.key } }) // optional reaction
        
        const res = await Func.fetchJson(`https://fastrestapis.fasturl.cloud/anime/mangainfo?name=${encodeURIComponent(args.join(" "))}`);
        if (!res?.result) return m.reply("⚠️ Manga not found!");
        
        const r = res.result;
        let text = `*▢ Title:* ${r.title}\n`;
        text += `*▢ Type:* ${r.type}\n`;
        text += `*▢ Status:* ${r.status}\n`;
        text += `*▢ Genre:* ${r.genres}\n`;
        text += `*▢ Score:* ${r.score} (from ${r.scored_by} users)\n`;
        text += `*▢ Rank:* ${r.rank} | *Popularity:* ${r.popularity}\n`;
        text += `*▢ Members:* ${r.members}\n\n`;
        text += `*▢ Synopsis:*\n${r.synopsis?.split("\n").slice(0, 2).join("\n")}...\n\n`;
        text += `Link: ${r.url}`;
        
        sius.reply(m.chat, text, "MANGA - INFO", false);
    }
});