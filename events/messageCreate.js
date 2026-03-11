const { Events } = require("discord.js");

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const client = message.client;
		const config = client.config;

		if (message.channelId != config.inhouse_channel) { return; } // not inhouse channel
		if (message.member.id == config.clientId) { return; } // caitlyn sent the msg
		if (message.member.id == "370275530823565312" && (message.mentions.has("164986330080739329") || message.mentions.has("259167676902014987") || message.mentions.has("1248559159117484102"))) { // pethy pinging mods
			// pethy
			await message.channel.send({
				content: `<@370275530823565312>`,
			}).catch(console.error);
		}

		// refresh post
		client.RefreshInHousePost();
	},
};