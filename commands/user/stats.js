const { SlashCommandBuilder, InteractionContextType } = require("discord.js");


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

		const profile = require(`../../profiles/${data.profile}.js`);

		const attachment = await profile.create(target, data);

		await interaction.editReply({ files: [attachment] }).catch(console.error); return;
	},
};