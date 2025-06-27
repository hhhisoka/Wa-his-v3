commands.add({
    name: ["instagram"],
    command: ["instagram"],
    category: "downloader",
    alias: ["igmp4", "igvideo", "ig", "igreel", "igphoto", "reels"],
    usage: "<url>",
    desc: "Instagram media downloader!",
    limit: 5,
    query: true,
    example: "https://www.instagram.com/reel/C_Phn6NSIfQ",
    run: async ({ sius, m, args, Func, dl }) => {
        try {
            const url = args[0].trim();
            if (!url.includes('instagram.com'))
                return m.reply(`⚠️ Invalid URL! Please make sure the URL is from Instagram\n\n> Example: https://www.instagram.com/reel/C_Phn6NSIfQ`);
            
            // const apiUrl to fetch media details
            const apiUrl = `https://fastrestapis.fasturl.cloud/downup/igdown/advanced?url=${encodeURIComponent(url)}&type=detail`;
            const result = await Func.fetchJson(apiUrl);
            
            if (!result || result.status !== 200 || !result.result) {
                return m.reply(`⚠️ Failed to download Instagram content: ${result?.message || 'Data not found'}.`);
            }
            
            const { is_video, video_url, images, caption, owner, like_count, comment_count, taken_at_timestamp, shortcode } = result.result;
            
            const captionText = `📸 *Instagram - ${owner?.username || 'Unknown'}*\n` +
                `❤️ Likes: ${like_count || 0} | 💬 Comments: ${comment_count || 0}\n` +
                `📅 ${new Date(taken_at_timestamp * 1000).toLocaleDateString('en-US')}\n\n` +
                `${caption?.text || 'No caption'}`;
            
            if (is_video && video_url) {
                await m.reply({
                    video: { url: video_url },
                    mimetype: 'video/mp4',
                    caption: captionText
                });
            } else if (images && images.length > 0) {
                // Limit to first 10 images
                const imageUrls = images.slice(0, 10);
                
                const cards = imageUrls.map((imageUrl, index) => ({
                    header: {
                        image: imageUrl
                    },
                    body: {
                        text: `Image ${index + 1} of ${imageUrls.length}`
                    },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "View on Instagram",
                                url: `https://www.instagram.com/p/${shortcode}`
                            })
                        }]
                    }
                }));
                
                await sius.sendCarousel(m.chat, captionText, cards, m);
            } else {
                m.reply(`⚠️ Content format not recognized or no media available.`);
            }
        } catch (err) {
            sius.cantLoad(err);
        }
    }
});