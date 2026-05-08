const { Events } = require("discord.js");

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const client = message.client;
		const config = client.config;

		if (message.channelId != config.inhouse_channel) { return; } // not inhouse channel
		if (client.inhousePosting) { return; } // it IS the queue

		// refresh post
		client.RefreshInHousePost();
	},
};