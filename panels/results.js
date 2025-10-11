const { ContainerBuilder } = require("discord.js");

module.exports = {
	name: "Results",
	getContainer(match, winner) {
		const matchId = match.get("number");

		const teams = match.get("teams");

		// setup blueside string
		let blueSideString = winner ? "__" : "";
		blueSideString += `**Blue Side - [${teams.avgBlue}]**`;
		blueSideString += winner ? "__\n" : "\n";
		for (const [role, player] of teams.blueSide) {
			const [id, mmr] = Object.entries(player)[0];

			const _string = `${role}: <@${id}>: [${mmr}]`;
			blueSideString += _string;

			if (winner) {
				blueSideString += ` -> [${mmr + 20}]\n`;
			}
			else {
				blueSideString += ` -> [${mmr - 20}]\n`;
			}
		}

		// setup redside string
		let redSideString = winner ? "" : "__";
		redSideString += `**Red Side - [${teams.avgRed}]**`;
		redSideString += winner ? "\n" : "__\n";
		for (const [role, player] of teams.redSide) {
			const [id, mmr] = Object.entries(player)[0];

			const _string = `${role}: <@${id}>: [${mmr}]`;
			redSideString += _string;

			if (winner) {
				redSideString += ` -> [${mmr - 20}]\n`;
			}
			else {
				redSideString += ` -> [${mmr + 20}]\n`;
			}
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