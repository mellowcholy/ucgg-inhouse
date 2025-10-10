const { ContainerBuilder } = require("discord.js");

module.exports = {
	name: "Results",
	getContainer(match, winner) {
		const matchId = match.get("number");

		const teams = match.get("teams");

		// setup blueside string
		let blueSideString = `**Blue Side - [${teams.avgBlue}]**\n`;
		for (const [role, player] of teams.blueSide) {
			const [id, mmr] = Object.entries(player)[0];

			const _string = `${role}: <@${id}> - [${mmr}]\n`;
			blueSideString += _string;
		}

		// setup redside string
		let redSideString = `**Red Side - [${teams.avgRed}]**\n`;
		for (const [role, player] of teams.redSide) {
			const [id, mmr] = Object.entries(player)[0];

			const _string = `${role}: <@${id}> - [${mmr}]\n`;
			redSideString += _string;
		}

		let accentColour = 0xac9cff;

		if (winner) {
			accentColour = 0x3498db; // blue
		}
		else {
			accentColour = 0xed4245; // red
		}

		// panels
		const container = new ContainerBuilder()
			.setAccentColor(accentColour)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`### Results for Match #${matchId}`),
			)
			.addSeparatorComponents((separator) => separator)
			// blue side
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(blueSideString),
			)
			.addSeparatorComponents((separator) => separator)
			// red side
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(redSideString),
			);

		return container;
	},
};