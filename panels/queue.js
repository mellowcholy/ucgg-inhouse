const { ContainerBuilder, ButtonStyle, ButtonBuilder } = require("discord.js");

module.exports = {
	name: "In-House Queue",
	getContainer() {
		const container = new ContainerBuilder()
			.setAccentColor(0x0099ff)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent('## In-House Queue\n-# by mellowcholy'),
			)
			.addSeparatorComponents((separator) => separator)
			// top lane
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent('Top Lane: 0/2\n<@259167676902014987>,<@1424621192819769396>'),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinTop').setLabel('Join Top').setStyle(ButtonStyle.Secondary),
				),
			)
			// jg
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent('Jungle: 0/2'),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinJg').setLabel('Join Jungle').setStyle(ButtonStyle.Secondary),
				),
			)
			// mid
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent('Mid Lane: 0/2'),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinMid').setLabel('Join Mid').setStyle(ButtonStyle.Secondary),
				),
			)
			// bot
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent('Bot Lane: 0/2'),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinBot').setLabel('Join Bot').setStyle(ButtonStyle.Secondary),
				),
			)
			// sup
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent('Support: 0/2'),
				)
				.setButtonAccessory((button) =>
					button.setCustomId('joinSup').setLabel('Join Support').setStyle(ButtonStyle.Secondary),
				),
			)
			.addSeparatorComponents((separator) => separator)
			// fill
			.addSectionComponents((section) => section
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent('Fill: 0/10'),
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