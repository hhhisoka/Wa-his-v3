export default {
	name: "anti-tagsw",
	exec: async ({ sius, m }) => {
		const isOwner = config.owner.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
		
		// Ignore if message is from the bot, not in a group, from admin, bot isn't admin, or from the owner
		if (m.key.fromMe || !m.isGroup || m.isAdmin || !m.isBotAdmin || isOwner) return false;
		
		const groupSettings = db.groups[m.chat] || {}
		
		const isStatusMention =
			m.type === "groupStatusMentionMessage" ||
			m.message?.groupStatusMentionMessage ||
			m.message?.protocolMessage?.type === 25 ||
			(Object.keys(m.message).length === 1 &&
				Object.keys(m.message)[0] === "messageContextInfo")
		
		if (isStatusMention && groupSettings.antitagsw) {
			groupSettings.tagsw = groupSettings.tagsw || {}
			
			if (!groupSettings.tagsw[m.sender]) {
				groupSettings.tagsw[m.sender] = 1
				
				await m.reply(
					`This group has been detected in a WhatsApp Status mention.\n@${m.sender.split("@")[0]}, please do not tag the group in WhatsApp Status.\nWarning ${groupSettings.tagsw[m.sender]}/5 – You will be removed if you reach the limit. ❗`
				)
				
				await sius.sendMessage(m.chat, {
					delete: {
						remoteJid: m.chat,
						fromMe: false,
						id: m.id,
						participant: m.sender
					}
				})
				
				return true
			} else if (groupSettings.tagsw[m.sender] >= 5) {
				await sius.groupParticipantsUpdate(m.chat, [m.sender], "remove")
					.catch(() => m.reply("Failed to remove the user!"))
				
				await m.reply(
					`@${m.sender.split("@")[0]} has been removed from the group\nfor tagging the group in WhatsApp Status 5 times.`
				)
				
				await sius.sendMessage(m.chat, {
					delete: {
						remoteJid: m.chat,
						fromMe: false,
						id: m.id,
						participant: m.sender
					}
				})
				
				delete groupSettings.tagsw[m.sender]
				return true
			} else {
				groupSettings.tagsw[m.sender] += 1
				
				await m.reply(
					`This group has been detected in a WhatsApp Status mention.\n@${m.sender.split("@")[0]}, please do not tag the group in WhatsApp Status.\nWarning ${groupSettings.tagsw[m.sender]}/5 – You will be removed when the limit is reached. ❗`
				)
				
				await sius.sendMessage(m.chat, {
					delete: {
						remoteJid: m.chat,
						fromMe: false,
						id: m.id,
						participant: m.sender
					}
				})
				
				return true
			}
		}
		
		return false
	}
}