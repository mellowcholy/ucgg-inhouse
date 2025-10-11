const { ContainerBuilder, ButtonStyle, ButtonBuilder, Collection, MessageFlags } = require("discord.js");

module.exports = {
	name: "In-House Queue",
	getContainer(client) {
		const queue = client.queue;

		async function setupButtons() {
			const positions = new Array("Top", "Jungle", "Mid", "Bot", "Support", "Fill");

			positions.forEach(pos => {
				client.buttons.set("join" + pos, async (interaction) => {
					const result = client.JoinQueue(interaction.user.id, pos);

					switch (result) {
					case 0:
						await interaction.reply({
							content: `You are already queued for ${pos}.`,
							flags: MessageFlags.Ephemeral,
						});
						return;

					case 1:
						await interaction.reply({
							content: `You have succesfully joined ${pos}.`,
							flags: MessageFlags.Ephemeral,
						}).then(client.RefreshInHousePost());
						return;

					case 2:
						await interaction.reply({
							content: 'You are still in a match. If it has completed, make sure everyone has voted for the winner.',
							flags: MessageFlags.Ephemeral,
						});
						return;
					}
				});
			});

			client.buttons.set("leavequeue", LeaveQueue);
			async function LeaveQueue(interaction) {
				const userId = interaction.user.id;

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
			}
		}
		setupButtons();

		// strings
		const rolePlayers = new Collection();
		const rolePlayerCount = new Collection();

		for (const key of queue.keys()) {
			const roleQueue = queue.get(key);

			let _string = "";
			roleQueue.forEach(id => {
				_string += "<@" + id + "> ";
			});

			rolePlayers.set(key, _string);
			rolePlayerCount.set(key, roleQueue.length);
		}

		// panels
		const container = new ContainerBuilder()
			.setAccentColor(0xac9cff)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent('## In-House Queue\n-# by mellowcholy'),
			)
			.addSeparatorComponents((separator) => separator)
			// top lane
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(`Top Lane: ${rolePlayerCount.get("Top")}/2\n${rolePlayers.get("Top")}`),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinTop').setLabel('Join Top').setStyle(ButtonStyle.Secondary),
				),
			)
			// jg
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(`Jungle: ${rolePlayerCount.get("Jungle")}/2\n${rolePlayers.get("Jungle")}`),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinJungle').setLabel('Join Jungle').setStyle(ButtonStyle.Secondary),
				),
			)
			// mid
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(`Mid Lane: ${rolePlayerCount.get("Mid")}/2\n${rolePlayers.get("Mid")}`),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinMid').setLabel('Join Mid').setStyle(ButtonStyle.Secondary),
				),
			)
			// bot
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(`Bot Lane: ${rolePlayerCount.get("Bot")}/2\n${rolePlayers.get("Bot")}`),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinBot').setLabel('Join Bot').setStyle(ButtonStyle.Secondary),
				),
			)
			// sup
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(`Support: ${rolePlayerCount.get("Support")}/2\n${rolePlayers.get("Support")}`),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinSupport').setLabel('Join Support').setStyle(ButtonStyle.Secondary),
				),
			)
			.addSeparatorComponents((separator) => separator)
			// fill
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(`Fill: ${rolePlayerCount.get("Fill")}/10\n${rolePlayers.get("Fill")}`),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinFill').setLabel('Join Fill').setStyle(ButtonStyle.Secondary),
				),
			)
			.addSeparatorComponents((separator) => separator)
			// leave queue
			.addActionRowComponents((actionRow) => actionRow.setComponents(new ButtonBuilder().setCustomId('leavequeue').setLabel('Leave Queue').setStyle(ButtonStyle.Danger)),
			);

		return container;
	},
};