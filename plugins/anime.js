// FEATURE STRUCTURE EXAMPLE

commands.add({
    name: ["anime"], // feature name in the menu
    command: ["anime"], // the command trigger
    category: "anime", // feature category (tags)
    usage: "<title>", // usage instruction shown in menu
    example: "jujutsu kaisen", // example usage if no query is given
    limit: 5, // costs 5 usage points (limits)
    cooldown: 10, // 10 seconds cooldown per user
    query: true, // required if user input is needed
    desc: "Search anime info using the bot", // feature description
    privatechat: false, // must be used in private chat?
    group: false, // must be used in a group?
    admin: false, // admin only?
    botAdmin: false, // does the bot need to be admin?
    premium: false, // premium users only?
    register: false, // does the user need to register?
    level: 2, // required user level
    run: async ({ sius, m, text, Func }) => {
        let res = await Func.fetchJson(`https://fastrestapis.fasturl.cloud/anime/animeinfo?name=${encodeURIComponent(text)}`)
        if (!res.result) return m.reply("⚠️ Anime not found!")
        let r = res.result
        let response = `*ANIME - INFO*\n\n`
        response += `*▢ Title:* ${r.title}\n`
        response += `*▢ Type:* ${r.type}\n`
        response += `*▢ Status:* ${r.status}\n`
        response += `*▢ Genre:* ${r.genres}\n`
        response += `*▢ Score:* ${r.score} | *Favorites:* ${r.favorites}\n`
        response += `*▢ Members:* ${r.members}\n\n`
        response += `*▢ Synopsis:*\n${r.synopsis?.split("\n").slice(0, 2).join("\n")}...\n\n`
        response += `Link: ${r.url}`
        m.reply(response, {
            contextInfo: {
                externalAdReply: {
                    title: r.title,
                    mediaType: 1,
                    thumbnailUrl: r.images.jpg.image_url,
                    renderLargerThumbnail: true,
                    sourceUrl: r.url
                }
            }
        })
    }
})