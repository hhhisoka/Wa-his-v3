commands.add({
    name: ["animesearch"],
    command: ["animesearch"],
    category: "anime",
    alias: ["anisearch", "animelookup"],
    usage: "<title>",
    desc: "Search anime on Otakudesu by title!",
    limit: 8,
    query: true,
    example: "Shingeki no Kyojin",
    run: async ({ sius, m, text, Func }) => {
        // await m.reply({ react: { text: "🕣", key: m.key } }) // optional reaction
        
        const apiUrl = `https://api.siputzx.my.id/api/anime/otakudesu/search?s=${encodeURIComponent(text)}`;
        const result = await Func.fetchJson(apiUrl);
        
        if (!result || !result.status || !result.data || result.data.length === 0) {
            return m.reply(`⚠️ No anime found for the title "${text}". Try another title!`);
        }
        
        const items = result.data.slice(0, 10);
        const caption = `*[√] Search results for "${text}":*\n\nShowing ${items.length} anime from Otakudesu.`;
        
        const cards = items.map((item, index) => ({
            header: {
                image: item.imageUrl || 'https://via.placeholder.com/150'
            },
            body: {
                text: `${item.title}\n⭐ Rating: ${item.rating || 'N/A'}\n🎭 Genre: ${item.genres || 'N/A'}\n📺 Status: ${item.status || 'N/A'}`
            },
            nativeFlowMessage: {
                buttons: [{
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "View on Otakudesu",
                        url: item.link
                    })
                }]
            }
        }));
        
        await sius.sendCarousel(m.chat, caption, cards, m);
        // await m.reply({ react: { text: "", key: m.key } }) // optional reaction
    }
});