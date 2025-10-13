const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require("discord.js");

require("dotenv/config");
const env = process.env.APP_ENV || "main";
const { results_channel } = env === "dev" ? require('../../configdev.json') : require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("cancel")
		.setDescription("Cancel a match with it's number.")
		.addIntegerOption((option) => option.setName("number").setDescription("The match number").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const number = interaction.options.getInteger("number");
		const result = await interaction.client.cancelMatch(number);

		switch (result) {
		case 0:
			await interaction.editReply({
				content: `Match #${number} does not exist!`,
				flags: MessageFlags.Ephemeral,
			}).catch(console.error);
			return;

		case 1:
			await interaction.client.channels.cache.get(results_channel).send({
				content: `${interaction.user.username} has cancelled Match #${number}`,
			}).catch(console.error);
			return;
		}
	},
};