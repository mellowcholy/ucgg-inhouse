const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require("discord.js");
const logError = require("../../utility/log-error.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ticket")
		.setDescription("[USE ONLY IN A MATCH CHANNEL] Use a ticket in your inventory.")
		.addStringOption((option) => option
			.setName("item")
			.setDescription("The name of the item you want to use.")
			.setRequired(true)
			.addChoices(
				{ name: "One-Trick Ticket", value: "One-Trick Ticket" },
				{ name: "Extra Ban Ticket", value: "Extra Ban Ticket" },
			),
		)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const client = interaction.client;
		const match = client.matchChannels?.get(interaction.channelId);

		if (match == null) {
			await interaction.reply({
				content: "Tickets can only be used in a match channel.",
				flags: MessageFlags.Ephemeral,
			}).catch((error) => logError("Failed to tell the user tickets can only be used in a match channel.", error));
			return;
		}

		if (match.get("wheelSpun") !== false) {
			const content = match.get("wheelSpun")
				? "Tickets cannot be used because the wheel was spun."
				: "Tickets can only be used after the wheel vote decides not to spin.";
			await interaction.reply({
				content,
				flags: MessageFlags.Ephemeral,
			}).catch((error) => logError("Failed to tell the user this ticket cannot be used yet.", error));
			return;
		}

		await interaction.deferReply();

		const id = interaction.user.id;

		const item = interaction.options.getString("item");

		const inventory = await client.LoadInventory(id);

		if (!inventory["tickets"].includes(item)) {
			await interaction.editReply(`You do not own a ${item} ticket.`).catch((error) => logError("Failed to tell the user they do not own that ticket.", error)); return;
		}

		inventory["tickets"] = inventory["tickets"].filter(e => e !== item);

		await client.SaveInventory(id, inventory);

		let message = `<@${id}> has used a ${item} ticket. `;

		switch (item) {
		case "One-Trick Ticket":
			message += "They will now declare which champion they get to play. (THIS CHAMPION CANNOT BE BANNED OR PICKED BY ANYONE ELSE).";
			break;
		case "Extra Ban Ticket":
			message += "They will now declare which champion they want to ban. (THIS CHAMPION CANNOT BE PICKED).";
			break;
		}

		await interaction.editReply(message).catch((error) => logError("Failed to post the used ticket.", error)); return;
	},
};
