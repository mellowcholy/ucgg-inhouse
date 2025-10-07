const { Events, MessageFlags } = require("discord.js");

let lastMessage;

module.exports = {
	name: Events.MessageCreate,
	execute(message) {
		const client = message.client;

		if (lastMessage == null) { lastMessage = client.latestInhousePost; }

		if (message.channelId != "1424956618361147432") { return; } // not inhouse channel
		if (message.member.id == "1424621192819769396") { return; } // caitlyn send the msg

		// delete previous msg
		if (lastMessage != null) {
			lastMessage.delete();
		}

		message.channel.send({
			components: [client.panels.get("In-House Queue")()],
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] },
		}).then(msg => lastMessage = msg);
	},
};