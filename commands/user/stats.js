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

		let data = await client.keyv.get(target.id);
		if (!data) data = await client.InitialisePlayer(target.id);

		const profile_name = "terminal_green";
		const profile = require(`../../profiles/${profile_name}.js`);

		const attachment = await profile.create(target, data);

		await interaction.editReply({ files: [attachment] }).catch(console.error); return;
	},
};