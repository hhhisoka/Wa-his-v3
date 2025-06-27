import fs from "fs";
import path from "path";
import { imageToWebp, videoToWebp, writeExif } from "../../lib/exif.js";

commands.add({
    name: ["sticker"],
    command: ["sticker"],
    category: "maker",
    desc: "Convert images or videos into stickers",
    alias: ["swm", "s", "stiker", "stickerwm", "stikerwm"],
    run: async ({ sius, m, args, Func }) => {
        try {
            // Use quoted message if exists, else current message
            const quoted = m.quoted ? m.quoted : m;
            const mime = (quoted.msg || quoted).mimetype || "";
            const qmsg = quoted.msg || quoted;
            
            if (!/image|video|webp/.test(mime)) {
                return m.reply("[×] Please reply to an image, video, or sticker with the caption *.sticker*");
            }
            
            if (qmsg.bytes > 10 * 1024 * 1024) {
                return m.reply("[×] Media size is too large (max 10MB)");
            }
            
            // Download media from quoted message
            let media = await sius.downloadAndSaveMediaMessage(qmsg);
            
            // Use arguments or default config for sticker pack and author
            let packname = args[0] || config.sticker.packname || "ItsukiBot";
            let author = args[1] || config.sticker.author || "Hyzer";
            let emojis = args[2] ? args[2].split(",") : ["😎"];
            
            let webpBuffer;
            
            if (/image|webp/.test(mime)) {
                webpBuffer = await imageToWebp(fs.readFileSync(media));
            } else if (/video/.test(mime)) {
                webpBuffer = await videoToWebp(fs.readFileSync(media));
            }
            
            // Prepare EXIF metadata for sticker
            const exifData = {
                packname,
                author,
                emojis,
                categories: emojis,
                isAvatar: 0
            };
            
            // Write EXIF data to WebP buffer
            const finalSticker = await writeExif(webpBuffer, exifData);
            
            if (finalSticker.length > 512 * 1024) {
                fs.unlinkSync(media);
                return m.reply("[×] Sticker is too large (max 512KB)");
            }
            
            // Send sticker reply
            await m.reply({ sticker: finalSticker });
            
            // Clean up temporary media file
            fs.unlinkSync(media);
        } catch (err) {
            sius.cantLoad(err);
        }
    }
});