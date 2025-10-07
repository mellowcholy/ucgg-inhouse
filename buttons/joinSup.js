const { MessageFlags } = require("discord.js");

module.exports = {
	name: "joinSup",
	async execute(interaction) {
		const client = interaction.client;

		const result = client.JoinQueue(interaction.user.id, "Support");

		switch (result) {
		case 0:
			await interaction.reply({
				content: 'You are already queued for support.',
				flags: MessageFlags.Ephemeral,
			});
			return;

		case 1:
			await interaction.reply({
				content: 'You have succesfully joined support.',
				flags: MessageFlags.Ephemeral,
			}).then(client.RefreshInHousePost());
			return;
		}
	},
};