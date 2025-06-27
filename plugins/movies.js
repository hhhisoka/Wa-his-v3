import fetch from "node-fetch";
// Replace with your own API key, free registration at http://www.omdbapi.com/apikey.aspx
const OMDB_API_KEY = "2f41b399";

commands.add({
    name: ["movie", "film"],
    command: ["movie", "film"],
    category: "search",
    param: "<title>",
    desc: "Display movie info based on the title",
    run: async ({ sius, m, args, Func, dl }) => {
        try {
            if (!args[0]) return m.reply("Please provide a movie title (example: .movie good will hunting)!");
            
            const title = args.join(" ").trim();
            const apiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) return m.reply("Failed to access OMDB API");
            
            const data = await response.json();
            
            if (data.Response === "False") return m.reply(`Movie *${title}* not found!`);
            
            // Get an image from Google Image Search to improve accuracy
            const images = await dl.googleImage(title + " movie");
            const randomIndex = Math.floor(Math.random() * images.length);
            const thumbnailUrl = images[randomIndex];
            
            const movieMsg = `*▢ Title:* ${data.Title}\n` +
                `*▢ Year:* ${data.Year}\n` +
                `*▢ Director:* ${data.Director || "N/A"}\n` +
                `*▢ Actors:* ${data.Actors || "N/A"}\n` +
                `*▢ Genre:* ${data.Genre || "N/A"}\n` +
                `*▢ Rating:* ${data.imdbRating || "N/A"}/10\n` +
                `*▢ Plot:* ${data.Plot || "No description available"}`;
            
            await m.reply(movieMsg, {
                contextInfo: {
                    externalAdReply: {
                        title: data.Title.toUpperCase(),
                        thumbnailUrl,
                        mediaUrl: "",
                        mediaType: 1,
                        previewType: "PHOTO",
                        renderLargerThumbnail: true
                    }
                }
            });
        } catch (err) {
            sius.cantLoad();
        }
    }
});