const { ContainerBuilder, ButtonStyle, ButtonBuilder, Collection, MessageFlags } = require("discord.js");

module.exports = {
	name: "In-House Queue",
	getContainer(client) {
		const queue = client.queue;

		async function setupButtons() {
			const positions = new Array("Top", "Jungle", "Mid", "Bot", "Support", "Fill");

			positions.forEach(pos => {
				client.buttons.set("join" + pos, async (interaction) => {
					const result = await client.JoinQueue(interaction.user.id, pos);

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

					case 3:
						await interaction.reply({
							content: 'You have been banned from the in-house queue. Please make a ticket to appeal this ban.',
							flags: MessageFlags.Ephemeral,
						});
						return;

					case 4: {
						const db = client.keyv;
						const banInfo = await db.get(`ban_${interaction.user.id}`);

						await interaction.reply({
							content: `You have been banned from the in-house queue until <t:${banInfo}:R>. Please make a ticket to appeal this ban.`,
							flags: MessageFlags.Ephemeral,
						});
						return;
					}

					case 5:
						await interaction.reply({
							content: 'Your MMR has not been set. Please contact a moderator if you would like to play!',
							flags: MessageFlags.Ephemeral,
						});
						return;
					}
				});
			});

			client.buttons.set("leavequeue", LeaveQueue);
			async function LeaveQueue(interaction) {
				const result = client.LeaveQueue(interaction.user.id);

				switch (result) {
				case 0:
					await interaction.reply({
						content: 'You have left the queue.',
						flags: MessageFlags.Ephemeral,
					}).then(client.RefreshInHousePost());
					return;

				case 1:
					await interaction.reply({
						content: 'You are not in the queue.',
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
			}
		}
		setupButtons();

		// strings
		const rolePlayers = new Collection();
		const rolePlayerCount = new Collection();

		let playerCount = 0;

		for (const key of queue.keys()) {
			const roleQueue = queue.get(key);

			let _string = "";
			roleQueue.forEach(id => {
				_string += "<@" + id + "> ";
				playerCount++;
			});

			rolePlayers.set(key, _string);
			rolePlayerCount.set(key, roleQueue.length);
		}

		// panels
		const container = new ContainerBuilder()
			.setAccentColor(0xac9cff)
			.addMediaGalleryComponents((mediaGallery) =>
				mediaGallery.addItems((item) =>
					item.setURL("attachment://queue_banner.png").setDescription('Queue Banner'),
				),
			)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`-# ${playerCount} players in queue`),
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