const { MessageFlags } = require("discord.js");

module.exports = {
	name: "joinTop",
	async execute(interaction) {
		const client = interaction.client;

		const result = client.JoinQueue(interaction.user.id, "Top");

		switch (result) {
		case 0:
			await interaction.reply({
				content: 'You are already queued for top lane.',
				flags: MessageFlags.Ephemeral,
			});
			return;

		case 1:
			await interaction.reply({
				content: 'You have succesfully joined top lane.',
				flags: MessageFlags.Ephemeral,
			}).then(client.RefreshInHousePost());
			return;
		}
	},
};