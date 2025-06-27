import fs from "fs"

commands.add({
    name: ["infogroup"],
    command: ["infogroup"],
    category: "group",
    alias: ["groupinfo"],
    desc: "Display information about the group",
    group: true,
    run: async ({ sius, m, Func }) => {
        try {
            const groupMetadata = await sius.groupMetadata(m.chat);
            const participants = groupMetadata.participants;
            const owner = groupMetadata.owner || "Unknown";
            const createdAt = new Date(groupMetadata.creation * 1000).toLocaleString("en-US", { timeZone: "UTC" });
            let profile;
            try {
                profile = await sius.profilePictureUrl(m.chat, "image");
            } catch {
                profile = "./lib/media/assets/default.jpg";
            }
            const thumbnail = profile.startsWith("http") ? await (await Func.getBuffer(profile)) : fs.readFileSync(profile);
            const set = db.groups[m.chat] || {}
            const infoMsg = `*▢ Group Name:* ${groupMetadata.subject}\n` +
                `*▢ Group ID:* ${groupMetadata.id}\n` +
                `*▢ Created On:* ${createdAt}\n` +
                `*▢ Owner:* @${owner.split("@")[0]}\n` +
                `*▢ Member Count:* ${participants.length}\n` +
                `*▢ Edit Info:* ${groupMetadata.restrict ? "Admin Only" : "All Members"}\n` +
                `*▢ Send Messages:* ${groupMetadata.announce ? "Admin Only" : "All Members"}\n` +
                `*▢ Anti tagsw :* ${set.antitagsw ? "√" : "×"}\n` +
                `*▢ Antilink :* ${set.antilink ? "√" : "×"}\n` +
                `*▢ Anti virtex :* ${set.antivirtex ? "√" : "×"}\n` +
                `*▢ Anti delete :* ${set.antidelete ? "√" : "×"}\n` +
                `*▢ Anti toxic :* ${set.antitoxic ? "√" : "×"}\n` +
                `*▢ Anti hidetag :* ${set.antihidetag ? "√" : "×"}\n` +
                `*▢ Welcome :* ${set.welcome ? "√" : "×"}\n` +
                `*▢ Nsfw :* ${set.nsfw ? "√" : "×"}\n` +
                `*▢ Description:* ${groupMetadata.desc || "No description"}\n`;
            await m.reply(infoMsg, {
                contextInfo: {
                    externalAdReply: {
                        title: "G R O U P - I N F O",
                        thumbnail: thumbnail,
                        mediaType: 1,
                        previewType: "PHOTO",
                        renderLargerThumbnail: true,
                        sourceUrl: `https://chat.whatsapp.com/${await sius.groupInviteCode(m.chat)}`
                    },
                    mentionedJid: [owner]
                }
            })
        } catch (err) {
            sius.cantLoad(err);
        }
    }
});