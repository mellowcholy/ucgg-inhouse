const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { Collection } = require('discord.js');
const fs = require("node:fs");
const path = require("node:path");

// load profiles
const profiles = new Collection();

const profilePath = path.join(__dirname, '../../profiles');
const files = fs.readdirSync(profilePath).filter((file) => file.endsWith('.js'));

for (const file of files) {
	const filePath = path.join(profilePath, file);
	const profile = require(filePath);

	profiles.set(file, profile);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("View your or another player's stats.")
		.addUserOption((option) => option.setName("target").setDescription("View another member's stats."))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;
		const target = interaction.options.getUser("target") || interaction.user;

		const data = await client.LoadPlayer(target.id);

		const profile = profiles.get(data.profile + ".js");

		const attachment = await profile.create(target, data);

		await interaction.editReply({ files: [attachment] }).catch(console.error); return;
	},
};