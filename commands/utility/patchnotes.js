const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ContainerBuilder, MessageFlags } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("patchnotes")
		.setDescription("Command to display patch notes. You probably shouldn't use this if you are not mellow.")
		.addAttachmentOption((option) => option.setName("msg").setDescription("The message.").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const config = interaction.client.config;
		const attachment = interaction.options.getAttachment("msg");

		if (!attachment.contentType?.startsWith("text/")) { await interaction.reply(`Please don't use this command if you don't know what you are doing.`).catch(console.error); return; }

		const response = await fetch(attachment.url);
		const msg = await response.text();

		await interaction.reply(`<@${interaction.member.id}> has created a new patch note. It can be found in the #feedback channel`).catch(console.error);

		const channel = interaction.client.channels.cache.get(config.feedback_channel);

		const container = new ContainerBuilder()
			.setAccentColor(0xac9cff)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(msg),
			);

		await channel.send({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		return;
	},
};