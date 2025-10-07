const { Events, Collection } = require("discord.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// setup queue
		client.queue = new Collection();
		client.queue.set("Top", new Array());
		client.queue.set("Jungle", new Array());
		client.queue.set("Mid", new Array());
		client.queue.set("Bot", new Array());
		client.queue.set("Support", new Array());
		client.queue.set("Fill", new Array());

		// send initial queue
		client.RefreshInHousePost();
	},
};