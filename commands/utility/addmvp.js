const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("addmvp")
		.setDescription("Give a member a MVP")
		.addUserOption((option) => option.setName("target").setDescription("The member to give the MVP to").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;

		const target = interaction.options.getUser("target");

		const data = await client.LoadPlayer(target.id);

		data.mvps += 1;

		await client.SavePlayer(target.id, data);

		await interaction.editReply({
			content: `<@${target.id}> has been given a MVP award!`,
		}).catch(console.error);
		return;
	},
};