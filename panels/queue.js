const { ContainerBuilder, ButtonStyle, ButtonBuilder, Collection } = require("discord.js");

module.exports = {
	name: "In-House Queue",
	getContainer(client) {
		const queue = client.queue;

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
			.setAccentColor(0x0099ff)
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
					button.setCustomId('joinJg').setLabel('Join Jungle').setStyle(ButtonStyle.Secondary),
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
					button.setCustomId('joinSup').setLabel('Join Support').setStyle(ButtonStyle.Secondary),
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