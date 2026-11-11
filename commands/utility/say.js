const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("say")
		.setDescription("Send a message in this channel.")
		.addStringOption((option) => option.setName("message").setDescription("The message to send.").setRequired(true).setMaxLength(2000))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const message = interaction.options.getString("message");

		try {
			await interaction.channel.send({
				content: message,
				allowedMentions: { parse: ["users", "roles", "everyone"] },
			});
		}
		catch (error) {
			console.error(error);
			await interaction.reply({
				content: "Failed to send that message.",
				flags: MessageFlags.Ephemeral,
			}).catch(console.error);
			return;
		}

		await interaction.reply({
			content: "Message sent.",
			flags: MessageFlags.Ephemeral,
		});

		return;
	},
};
