const { Events } = require("discord.js");

module.exports = {
	name: Events.MessageCreate,
	execute(message) {
		const client = message.client;
		const config = client.config;

		if (message.channelId != config.inhouse_channel) { return; } // not inhouse channel
		if (message.member.id == config.clientId) { return; } // caitlyn sent the msg

		// refresh post
		client.RefreshInHousePost();
	},
};