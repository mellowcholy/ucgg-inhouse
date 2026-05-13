const { Events } = require("discord.js");

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const client = message.client;
		const config = client.config;

		// keep queue at bottom
		if (message.channelId == config.inhouse_channel) {
			if (message.member.id == config.clientId) { return; } // it IS the queue

			client.RefreshInHousePost();
		}

		// keep vote at bottom
		const match = client.matchChannels.get(message.channelId);
		if (match != undefined) {
			if (match.get("votePosting")) { return; } // it IS the vote

			client.refreshWinnerVote(match);
		}
	},
};