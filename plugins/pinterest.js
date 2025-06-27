commands.add({
    name: ["pinterest"],
    command: ["pinterest"],
    alias: ["pin"],
    desc: "Find any pictures from Pinterest",
    limit: true,
    cooldown: 60, // cooldown in seconds
    param: "<keyword>",
    category: "internet",
    run: async ({ sius, m, args, Func }) => {
        try {
            if (!args[0]) return m.reply("*Example usage:* .pinterest ariana grande");
            
            const keyword = args.join(" ");
            const result = await Func.fetchJson(`https://fastrestapis.fasturl.cloud/search/pinterest?name=${encodeURIComponent(keyword)}`);
            
            if (!result || result.status !== 200 || !result.result || result.result.length === 0) {
                return m.reply("Failed to get images, please try another keyword!");
            }
            
            const images = result.result.slice(0, 5).map(item => item.directLink);
            const links = result.result.slice(0, 5).map(item => item.link);
            
            const cards = images.map((url, index) => ({
                header: {
                    image: url
                },
                body: {
                    text: `Image ${index + 1} of ${images.length}`
                },
                nativeFlowMessage: {
                    buttons: [{
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "View on Pinterest",
                            url: links[index]
                        })
                    }]
                }
            }));
            
            // Send carousel
            await sius.sendCarousel(m.chat, `Search results for *${keyword}*`, cards, m);
        } catch (e) {
            sius.cantLoad(e);
        }
    }
});