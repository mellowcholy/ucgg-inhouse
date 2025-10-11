const { Events } = require("discord.js");
const { clientId } = require('../config.json'); // DEV MODE

module.exports = {
	name: Events.MessageCreate,
	execute(message) {
		if (message.channelId != "1426467987178655786") { return; } // not inhouse channel
		if (message.member.id == clientId) { return; } // caitlyn sent the msg

		const client = message.client;

		// refresh post
		client.RefreshInHousePost();
	},
};