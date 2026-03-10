const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("test")
		.setDescription("View your or another player's inventory.")
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;

		const panel = client.panels.get("Modifier Vote")(client);

		await interaction.editReply({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(console.error); return;
	},
};