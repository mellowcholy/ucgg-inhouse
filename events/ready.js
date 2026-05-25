const { Events, ActivityType } = require("discord.js");

randomQuotes = [
	"👰🏻‍♀️ I see… you must be maidenless.",
	"🤷🏻‍♀️ Who is it that will protect you from my ire?",
	"📖 Shei-fuwan-kaunmay'hai-au",
	"🤌🏻 I assure you: I am quite patient.",
	"😱 AI'MOUTAI JAI YON!",
	"🙀 AGE OF RETRIBUTION!",
	"😿 This is a reward for my sacrifice.",
	"😾I mustn't take a single breath for granted.",
];

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		client.randomQuotes = randomQuotes;

		client.user.setActivity(client.randomQuotes[Math.floor(Math.random() * client.randomQuotes.length)], { type: ActivityType.Custom });

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