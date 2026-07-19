const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("addattachment")
		.setDescription("Adds an attachment to Yunara's message")
		.addChannelOption((option) => option.setName("channel").setDescription("The channel to send the message to").setRequired(true))
		.addStringOption((option) => option.setName("id").setDescription("The message ID to edit").setRequired(true))
		.addAttachmentOption((option) => option.setName("attachment").setDescription("The attachment.").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const attachment = interaction.options.getAttachment("attachment");
		const channel = interaction.options.getChannel("channel");
		const msgID = interaction.options.getString("id");

		const message = await channel.messages.fetch(msgID);

		if (message.author.id != interaction.client.user.id) {
			await interaction.reply(`I did not write that message, so I can't edit it!`).catch(console.error);
			return;
		}

		await interaction.reply(`<@${interaction.member.id}> has edited a message in <#${channel.id}>`).catch(console.error);

		await message.edit({
			files: [attachment],
			flags: MessageFlags.IsComponentsV2,
		});

		return;
	},
};