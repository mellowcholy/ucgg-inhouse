const { Events } = require("discord.js");

require("dotenv/config");
const env = process.env.APP_ENV || "main";
const { clientId, inhouse_channel } = env === "dev" ? require('../configdev.json') : require('../config.json');

module.exports = {
	name: Events.MessageCreate,
	execute(message) {
		if (message.channelId != inhouse_channel) { return; } // not inhouse channel
		if (message.member.id == clientId) { return; } // caitlyn sent the msg

		const client = message.client;

		// refresh post
		client.RefreshInHousePost();
	},
};