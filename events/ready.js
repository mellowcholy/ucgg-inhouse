const { Events, MessageFlags } = require("discord.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// setup inhouse queue screen
		// TODO: f

		// send initial queue
		const channel = client.channels.cache.get("1424956618361147432");
		channel.send({
			components: [client.panels.get("In-House Queue")()],
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] },
		}).then(msg => client.latestInhousePost = msg);
	},
};