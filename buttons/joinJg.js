const { MessageFlags } = require("discord.js");

module.exports = {
	name: "joinJg",
	async execute(interaction) {
		const client = interaction.client;

		const result = client.JoinQueue(interaction.user.id, "Jungle");

		switch (result) {
		case 0:
			await interaction.reply({
				content: 'You are already queued for jungle.',
				flags: MessageFlags.Ephemeral,
			});
			return;

		case 1:
			await interaction.reply({
				content: 'You have succesfully joined jungle.',
				flags: MessageFlags.Ephemeral,
			}).then(client.RefreshInHousePost());
			return;
		}
	},
};