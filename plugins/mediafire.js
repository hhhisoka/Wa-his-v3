commands.add({
    name: ["mediafire"],
    command: ["mediafire"],
    category: "downloader",
    alias: ["mediafiredown"],
    usage: "<url>",
    desc: "MediaFire file downloader!",
    limit: 5,
    query: true,
    example: "https://www.mediafire.com/file/56qiqi6h3lgvfy3/Shoyu+V1_s%40aima.zip/file",
    run: async ({ sius, m, args, Func, dl }) => {
        try {
            const url = args[0].trim();
            if (!url.includes('mediafire.com'))
                return m.reply(`⚠️ Invalid URL! Make sure the URL is from MediaFire\n\n> Example: https://www.mediafire.com/file/56qiqi6h3lgvfy3/Shoyu+V1_s%40aima.zip/file`);
            
            //const apiUrl to fetch download info
            const apiUrl = `https://fastrestapis.fasturl.cloud/downup/mediafiredown?url=${encodeURIComponent(url)}`;
            const result = await Func.fetchJson(apiUrl);
            
            if (!result || result.status !== 200 || !result.result || !result.result.download) {
                return m.reply(`⚠️ Failed to download MediaFire file: ${result?.message || 'Data not found'}.`);
            }
            
            const { filename, size, filetype, mimetype, owner, created, download } = result.result;
            
            const caption = `📁 *MediaFire - ${filename || 'Unknown'}*\n` +
                `📏 Size: ${size || 'Unknown'}\n` +
                `📄 Type: ${filetype || 'Unknown'}\n` +
                `👤 Owner: ${owner || 'Anonymous'}\n` +
                `📅 Created: ${new Date(created).toLocaleDateString('en-US')}`;
            
            const isMedia = ['video', 'image'].includes(filetype);
            
            if (isMedia) {
                await m.reply({
                    [filetype]: { url: download },
                    mimetype: mimetype || (filetype === 'video' ? 'video/mp4' : 'image/jpeg'),
                    caption
                });
            } else {
                await m.reply({
                    document: { url: download },
                    mimetype: mimetype || 'application/octet-stream',
                    fileName: filename || 'file',
                    caption
                });
            }
        } catch (err) {
            sius.cantLoad(err);
        }
    }
});