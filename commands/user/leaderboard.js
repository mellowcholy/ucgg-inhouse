const { SlashCommandBuilder, InteractionContextType } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("View everyone's stats.")
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;

		const leaderboard = [];
		for await (const [key, value] of client.keyv.iterator()) {
			if (!value.wins) { continue; }

			leaderboard.push([key, value]);
    	};

		let key = "points";

		const sorted = leaderboard.sort(([, a], [, b]) => b[key] - a[key]);

		let tempstring = "";

		for (let i = 0; i < sorted.length; i++) {
			tempstring += `${sorted[i][0]} - ${key}: ${sorted[i][1][key]}\n`;
		}

		await interaction.editReply(tempstring).catch(console.error); return;
	},
};