const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("sendattachment")
		.setDescription("Send an attachment")
		.addChannelOption((option) => option.setName("channel").setDescription("The channel to send the message to").setRequired(true))
		.addAttachmentOption((option) => option.setName("attachment").setDescription("The attachment.").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const attachment = interaction.options.getAttachment("attachment");
		const channel = interaction.options.getChannel("channel");

		await interaction.reply(`<@${interaction.member.id}> has sent an attachment to <#${channel.id}>`).catch(console.error);

		await channel.send({
			files: [attachment],
		});

		return;
	},
};