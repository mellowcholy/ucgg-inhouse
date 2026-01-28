const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("unban")
		.setDescription("Unban someone from the queue")
		.addUserOption((option) => option.setName("target").setDescription("The member to unban.").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;
		const db = client.keyv;

		const target = interaction.options.getUser("target");
		const userId = target.id;

		const banInfo = await db.get(`ban_${userId}`);

		if (banInfo) {
			await db.delete(`ban_${userId}`);

			await interaction.editReply({
				content: `<@${target.id}> has been unbanned.`,
			}).catch(console.error);
			return;
		}
		else {
			await interaction.editReply({
				content: `<@${target.id}> is not banned.`,
			}).catch(console.error);
			return;
		}
	},
};