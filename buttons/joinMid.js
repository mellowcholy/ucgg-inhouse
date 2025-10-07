const { MessageFlags } = require("discord.js");

module.exports = {
	name: "joinMid",
	async execute(interaction) {
		const client = interaction.client;

		const result = client.JoinQueue(interaction.user.id, "Mid");

		switch (result) {
		case 0:
			await interaction.reply({
				content: 'You are already queued for mid lane.',
				flags: MessageFlags.Ephemeral,
			});
			return;

		case 1:
			await interaction.reply({
				content: 'You have succesfully joined mid lane.',
				flags: MessageFlags.Ephemeral,
			}).then(client.RefreshInHousePost());
			return;
		}
	},
};