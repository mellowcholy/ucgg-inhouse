const { Events } = require("discord.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// run queue handling
		const queue = require("../inhouse/queue.js");
		queue.run(client);

		// run match handling
		const matches = require("../inhouse/matches.js");
		matches.run(client);

		// send initial queue
		client.RefreshInHousePost();
	},
};