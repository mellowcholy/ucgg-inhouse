const { Events } = require("discord.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		const queue = require("../queue.js");
		queue.run(client);

		// send initial queue
		client.RefreshInHousePost();
	},
};