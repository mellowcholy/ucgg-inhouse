const { Events, MessageFlags } = require("discord.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// setup inhouse queue screen
		const container = require("../panels/queue.js").getContainer();

		client.inhouseContainer = container;

		// send initial queue
		const channel = client.channels.cache.get("1424956618361147432");
		channel.send({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] },
		}).then(msg => client.latestInhousePost = msg);
	},
};