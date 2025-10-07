const { MessageFlags } = require("discord.js");

module.exports = {
	name: "leavequeue",
	async execute(interaction) {
		const client = interaction.client;
		const userId = interaction.user.id;

		const queue = client.queue;

		let bool = false;

		queue.each(async val => {
			const isUserId = (v) => v == userId;
			const found = val.findIndex(isUserId);

			if (found == -1) { return; }

			val.splice(found, 1);

			bool = true;

			await interaction.reply({
				content: 'You have left the queue.',
				flags: MessageFlags.Ephemeral,
			}).then(client.RefreshInHousePost());

			return;
		});

		if (bool) { return; }

		await interaction.reply({
			content: 'You are not in the queue.',
			flags: MessageFlags.Ephemeral,
		});
	},
};