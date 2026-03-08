const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("inventory")
		.setDescription("View your or another player's inventory.")
		.addUserOption((option) => option.setName("target").setDescription("View another member's inventory."))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;
		const target = interaction.options.getUser("target") || interaction.user;

		const inventory = await client.LoadInventory(target.id);

		const panel = client.panels.get("Inventory")(client, target.displayName, inventory);

		await interaction.editReply({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(console.error); return;
	},
};