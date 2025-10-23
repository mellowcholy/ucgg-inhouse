const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("View everyone's stats.")
		.addStringOption((option) => option.setName("stat").setDescription("What stat to sort players by.").setRequired(true)
			.addChoices(
				{ name: "Wins", value: "wins" },
				{ name: "Losses", value: "losses" },
				{ name: "Credits", value: "points" },
				{ name: "MVPs", value: "mvps" },
				{ name: "Top MMR", value: "Top" },
				{ name: "Jungle MMR", value: "Jungle" },
				{ name: "Mid MMR", value: "Mid" },
				{ name: "Bot MMR", value: "Bot" },
				{ name: "Support MMR", value: "Support" },

			))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;
		const stat = interaction.options.getString("stat");
		const pageNum = 0;

		const panel = await client.panels.get("Leaderboard")(client, stat, pageNum, interaction);
		await interaction.editReply({ components: [panel[1], panel[0]], flags: MessageFlags.IsComponentsV2, files: [panel[2]] }).catch(console.error); return;
	},
};