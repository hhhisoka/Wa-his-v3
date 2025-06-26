import fs from "fs"
import Jimp from "jimp"

const generateProfile = async (buffer) => {
	const jimp = await Jimp.read(buffer)
	const min = jimp.getWidth()
	const max = jimp.getHeight()
	const cropped = jimp.crop(0, 0, min, max)
	return {
		img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
		preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
	}
}

commands.add({
    name: ["setppgroup"],
    command: ["setppgroup"],
    alias: ["setppgc", "setppgrup"],
    category: "group",
    desc: "Change the group profile picture",
    admin: true,
    group: true,
    botAdmin: true,
    run: async ({ sius, m, args }) => {
        if (!m.quoted) return m.reply("Reply to the image you want to set as the group profile picture!");
        
        const quoted = m.quoted;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/image/.test(quoted.type)) return m.reply("Please reply to a valid image!");

        const media = await sius.downloadAndSaveMediaMessage(quoted, "ppg.jpeg");

        try {
            if (args.length > 0) {
                const { img } = await generateProfile(media);
                await sius.query({
                    tag: 'iq',
                    attrs: {
                        to: m.chat,
                        type: 'set',
                        xmlns: 'w:profile:picture'
                    },
                    content: [
                        {
                            tag: 'picture',
                            attrs: { type: 'image' },
                            content: img
                        }
                    ]
                });
                await m.reply('✅ Group profile picture updated (via advanced method).');
            } else {
                await sius.updateProfilePicture(m.chat, { url: media });
                await m.reply('✅ Group profile picture updated successfully.');
            }
        } catch (e) {
            console.error(e);
            m.reply('❌ Failed to update group profile picture.');
        } finally {
            fs.unlinkSync(media);
        }
    }
});