const { MessageFlags } = require("discord.js");

module.exports = {
	name: "joinFill",
	async execute(interaction) {
		const client = interaction.client;

		const result = client.JoinQueue(interaction.user.id, "Fill");

		switch (result) {
		case 0:
			await interaction.reply({
				content: 'You are already queued for fill.',
				flags: MessageFlags.Ephemeral,
			});
			return;

		case 1:
			await interaction.reply({
				content: 'You have succesfully joined fill.',
				flags: MessageFlags.Ephemeral,
			}).then(client.RefreshInHousePost());
			return;
		}
	},
};