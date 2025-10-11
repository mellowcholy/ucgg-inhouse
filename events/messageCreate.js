const { Events } = require("discord.js");
const { clientId } = require('../configdev.json'); // DEV MODE

module.exports = {
	name: Events.MessageCreate,
	execute(message) {
		if (message.channelId != "1424956618361147432") { return; } // not inhouse channel
		if (message.member.id == clientId) { return; } // caitlyn sent the msg

		const client = message.client;

		// refresh post
		client.RefreshInHousePost();
	},
};