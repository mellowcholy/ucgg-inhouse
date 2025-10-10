const { ContainerBuilder, ButtonStyle, ButtonBuilder, MessageFlags } = require("discord.js");

module.exports = {
	name: "Teams and Vote Winner",
	getContainer(client, match) {
		const matchId = match.get("number");

		let winnerVotesBlue = match.get("winnerVotesBlue");
		let winnerVotesRed = match.get("winnerVotesRed");

		// buttons
		async function setupButtons() {
			client.buttons.set('winnervoteblue_' + matchId, VoteBlue);
			async function VoteBlue(interaction) {
				const userId = interaction.user.id;

				winnerVotesBlue = match.get("winnerVotesBlue");
				winnerVotesRed = match.get("winnerVotesRed");

				if (match.get("players").includes(userId)) {
					if (winnerVotesBlue.includes(userId)) {
						await interaction.reply({
							content: 'You have already voted for Blue.',
							flags: MessageFlags.Ephemeral,
						});

						return;
					}

					// they originally voted red
					const votedRed = winnerVotesRed.indexOf(userId);
					if (votedRed != -1) {
						winnerVotesRed.splice(votedRed, 1);
					}

					winnerVotesBlue.push(userId);

					await interaction.reply({
						content: 'You voted for Blue.',
						flags: MessageFlags.Ephemeral,
					});

					// TODO: change back to 6
					if (winnerVotesBlue.length == 1) {
						client.winnerResult(match, true);
					}
					else {
						client.refreshWinnerVote(match);
					}
				}
				else {
					await interaction.reply({
						content: 'You are not in this match.',
						flags: MessageFlags.Ephemeral,
					});
				}
			}

			client.buttons.set('winnervotered_' + matchId, VoteRed);
			async function VoteRed(interaction) {
				const userId = interaction.user.id;

				winnerVotesBlue = match.get("winnerVotesBlue");
				winnerVotesRed = match.get("winnerVotesRed");

				if (match.get("players").includes(userId)) {
					if (winnerVotesRed.includes(userId)) {
						await interaction.reply({
							content: 'You have already voted for Red.',
							flags: MessageFlags.Ephemeral,
						});

						return;
					}

					// they originally voted blue
					const votedBlue = winnerVotesBlue.indexOf(userId);
					if (votedBlue != -1) {
						winnerVotesBlue.splice(votedBlue, 1);
					}

					winnerVotesRed.push(userId);

					await interaction.reply({
						content: 'You voted for Red.',
						flags: MessageFlags.Ephemeral,
					});

					// TODO: change back to 6
					if (winnerVotesRed.length == 1) {
						client.winnerResult(match, false);
					}
					else {
						client.refreshWinnerVote(match);
					}
				}
				else {
					await interaction.reply({
						content: 'You are not in this match.',
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		}
		setupButtons();

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

		// panels
		const container = new ContainerBuilder()
			.setAccentColor(0xac9cff)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`### Teams for Match #${matchId}`),
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
			)
			.addSeparatorComponents((separator) => separator)
			.addActionRowComponents((actionRow) => actionRow.setComponents(
				new ButtonBuilder().setCustomId('winnervoteblue_' + matchId).setLabel('Vote Blue Winner').setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId('winnervotered_' + matchId).setLabel('Vote Red Winner').setStyle(ButtonStyle.Danger),
			))
			.addSeparatorComponents((separator) => separator)
			// blue side voters
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`-# Blue Side Votes: ${winnerVotesBlue.length}`),
			)
			// red side voters
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`-# Red Side Votes: ${winnerVotesRed.length}`),
			);

		match.set("winnervote", container);

		return container;
	},
};