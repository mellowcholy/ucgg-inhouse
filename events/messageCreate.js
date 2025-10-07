const { Events } = require("discord.js");

module.exports = {
	name: Events.MessageCreate,
	execute(message) {
		const client = message.client;

		if (message.channelId != "1424956618361147432") { return; } // not inhouse channel
		if (message.member.id == "1424621192819769396") { return; } // caitlyn send the msg

		// refresh post
		client.RefreshInHousePost();
	},
};