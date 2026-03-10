const { ContainerBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const modifiers = require('../modifiers.json');

module.exports = {
	name: "Modifier Vote",
	getContainer(client) {
		const modifier1 = client.PickModifier(modifiers.modifiers);
		const modifier2 = client.PickModifier(modifiers.modifiers);
		const modifier3 = client.PickModifier(modifiers.modifiers);

		const container = new ContainerBuilder().setAccentColor(0xac9cff)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`## Vote for a modifier`))
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# First to 4 votes`))
			.addSeparatorComponents((separator) => separator)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### 1️⃣  ${modifier1}`))
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# 0 votes`))
			.addSeparatorComponents((separator) => separator)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### 2️⃣  ${modifier2}`))
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# 0 votes`))
			.addSeparatorComponents((separator) => separator)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### 3️⃣  ${modifier3}`))
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# 0 votes`))
			.addSeparatorComponents((separator) => separator)
			.addActionRowComponents((actionRow) => actionRow.setComponents(
				new ButtonBuilder().setCustomId("modifier_vote_1").setLabel('1️⃣').setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setCustomId("modifier_vote_2").setLabel('2️⃣').setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setCustomId("modifier_vote_3").setLabel('3️⃣').setStyle(ButtonStyle.Secondary),
			));

		return container;
	},
};