commands.add({
    name: ["lyrics"],
    command: ["lyrics"],
    category: "search",
    alias: ["lyric", "lirik"],
    usage: "<title>",
    limit: 5,
    desc: "Search song lyrics by title",
    run: async ({ sius, m, args, Func }) => {
        try {
            if (!args[0])
                return m.reply(`*Please enter the song title!*\n\n> Example usage: *.lyrics Beauty and the Beast*`);
            
            const query = args.join(" ");
            const apiUrl = `https://fastrestapis.fasturl.cloud/music/songlyrics-v2?name=${encodeURIComponent(query)}`;
            const result = await Func.fetchJson(apiUrl);
            
            if (!result || !result.result) {
                return m.reply(`*Lyrics for "${query}" not found. Try another title!*`);
            }
            
            const { title, artist, album, albumCover, description, lyrics } = result.result;
            const lyricLines = lyrics
                .filter(line => line.type === "lyric")
                .map(line => line.text)
                .join("\n");
            
            const caption = `*▢ Title:* ${title}\n*▢ Artist:* ${artist}\n*▢ Album:* ${album}\n*▢ Description:* ${description}\n\n*THE LYRICS:*\n${lyricLines}`;
            
            await m.reply(caption, {
                contextInfo: {
                    externalAdReply: {
                        thumbnailUrl: albumCover,
                        mediaUrl: albumCover,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        previewType: "PHOTO",
                        sourceUrl: config.github
                    }
                }
            });
        } catch (err) {
            sius.cantLoad(err);
        }
    }
});