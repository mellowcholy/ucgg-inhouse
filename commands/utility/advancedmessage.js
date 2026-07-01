const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ContainerBuilder, MessageFlags, TextDisplayBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("advancedmessage")
		.setDescription("Send a message from Yunara with custom options")
		.addChannelOption((option) => option.setName("channel").setDescription("The channel to send the message to").setRequired(true))
		.addAttachmentOption((option) => option.setName("msg").setDescription("The message.").setRequired(true))
		.addNumberOption((option) => option.setName("col").setDescription("The colour of the container, provide nothing for no container"))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const attachment = interaction.options.getAttachment("msg");
		const channel = interaction.options.getChannel("channel");
		const colour = interaction.options.getNumber("col");

		if (!attachment.contentType?.startsWith("text/")) { await interaction.reply(`Please don't use this command if you don't know what you are doing.`).catch(console.error); return; }

		const response = await fetch(attachment.url);
		const msg = await response.text();

		await interaction.reply(`<@${interaction.member.id}> has sent a message to <#${channel.id}>`).catch(console.error);

		let container;

		if (colour) {
			container = new ContainerBuilder()
				.setAccentColor(colour)
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(msg),
				);
		}
		else {
			container = new TextDisplayBuilder().setContent(msg);
		}

		await channel.send({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		return;
	},
};