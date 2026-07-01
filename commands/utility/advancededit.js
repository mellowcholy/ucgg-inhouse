const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ContainerBuilder, MessageFlags, TextDisplayBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("advancededit")
		.setDescription("Edits a Yunara message")
		.addChannelOption((option) => option.setName("channel").setDescription("The channel to send the message to").setRequired(true))
		.addStringOption((option) => option.setName("id").setDescription("The message ID to edit").setRequired(true))
		.addAttachmentOption((option) => option.setName("msg").setDescription("The message.").setRequired(true))
		.addNumberOption((option) => option.setName("col").setDescription("The colour of the container, provide nothing for no container"))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const attachment = interaction.options.getAttachment("msg");
		const channel = interaction.options.getChannel("channel");
		const msgID = interaction.options.getString("id");
		const colour = interaction.options.getNumber("col");

		if (!attachment.contentType?.startsWith("text/")) { await interaction.reply(`Please don't use this command if you don't know what you are doing.`).catch(console.error); return; }

		const response = await fetch(attachment.url);
		const msg = await response.text();

		const message = await channel.messages.fetch(msgID);

		if (message.author.id != interaction.client.user.id) {
			await interaction.reply(`I did not write that message, so I can't edit it!`).catch(console.error);
			return;
		}

		await interaction.reply(`<@${interaction.member.id}> has edited a message in <#${channel.id}>`).catch(console.error);

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

		await message.edit({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		return;
	},
};