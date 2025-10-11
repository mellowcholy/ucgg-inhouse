const { ContainerBuilder, ButtonStyle, ButtonBuilder, MessageFlags } = require("discord.js");

module.exports = {
	name: "Vote Wheel",
	getContainer(client, match) {
		const matchId = match.get("number");

		let wheelVotesYes = match.get("wheelVotesYes");
		let wheelVotesNo = match.get("wheelVotesNo");

		// buttons
		async function setupButtons() {
			client.buttons.set('wheelvoteyes_' + matchId, VoteYes);
			async function VoteYes(interaction) {
				const userId = interaction.user.id;

				wheelVotesYes = match.get("wheelVotesYes");
				wheelVotesNo = match.get("wheelVotesNo");

				if (match.get("players").includes(userId)) {
					if (wheelVotesYes.includes(userId)) {
						await interaction.reply({
							content: 'You have already voted yes.',
							flags: MessageFlags.Ephemeral,
						});

						return;
					}

					// they originally voted no
					const votedNo = wheelVotesNo.indexOf(userId);
					if (votedNo != -1) {
						wheelVotesNo.splice(votedNo, 1);
					}

					wheelVotesYes.push(userId);

					await interaction.reply({
						content: 'You voted to spin the wheel.',
						flags: MessageFlags.Ephemeral,
					});

					// TODO: change back to 6
					if (wheelVotesYes.length == 6) {
						client.wheelResult(match, true);
					}
					else {
						client.refreshVoteWheel(match);
					}
				}
				else {
					await interaction.reply({
						content: 'You are not in this match.',
						flags: MessageFlags.Ephemeral,
					});
				}
			}

			client.buttons.set('wheelvoteno_' + matchId, VoteNo);
			async function VoteNo(interaction) {
				const userId = interaction.user.id;

				wheelVotesYes = match.get("wheelVotesYes");
				wheelVotesNo = match.get("wheelVotesNo");

				if (match.get("players").includes(userId)) {
					if (wheelVotesNo.includes(userId)) {
						await interaction.reply({
							content: 'You have already voted no.',
							flags: MessageFlags.Ephemeral,
						});

						return;
					}

					// they originally voted yes
					const votedYes = wheelVotesYes.indexOf(userId);
					if (votedYes != -1) {
						wheelVotesYes.splice(votedYes, 1);
					}

					wheelVotesNo.push(userId);

					await interaction.reply({
						content: 'You voted to not spin the wheel.',
						flags: MessageFlags.Ephemeral,
					});

					// TODO: change back to 5
					if (wheelVotesNo.length == 5) {
						client.wheelResult(match, false);
					}
					else {
						client.refreshVoteWheel(match);
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

		// panels
		const container = new ContainerBuilder()
			.setAccentColor(0xac9cff)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent('### Vote for modifier wheel spin\n-# The modifier wheel adds a random effect to the game. e.g. Demacia vs Noxus\n-# 6 votes are required to spin the wheel'),
			)
			.addSeparatorComponents((separator) => separator)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`${wheelVotesYes.length} votes to spin the wheel\n${wheelVotesNo.length} votes to not spin the wheel`),
			)
			.addActionRowComponents((actionRow) => actionRow.setComponents(
				new ButtonBuilder().setCustomId('wheelvoteyes_' + matchId).setLabel('Vote Yes').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId('wheelvoteno_' + matchId).setLabel('Vote No').setStyle(ButtonStyle.Danger),
			));

		match.set("wheelvote", container);

		return container;
	},
};