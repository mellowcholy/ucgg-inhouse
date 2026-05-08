const { ContainerBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");

module.exports = {
	name: "Modifier Vote",
	getContainer(client, match, modifier1, modifier2, modifier3) {
		const config = client.config;
		const matchId = match.get("number");
		let modVotes1 = match.get("modifierVotes1");
		let modVotes2 = match.get("modifierVotes2");
		let modVotes3 = match.get("modifierVotes3");

		async function setupButtons() {
			client.buttons.set('modifier_vote_1' + matchId, Vote1);
			async function Vote1(interaction) {
				const userId = interaction.user.id;

				modVotes1 = match.get("modifierVotes1");
				modVotes2 = match.get("modifierVotes2");
				modVotes3 = match.get("modifierVotes3");

				if (match.get("players").includes(userId)) {
					if (modVotes1.includes(userId)) {
						await interaction.reply({
							content: 'You have already voted for modifier 1.',
							flags: MessageFlags.Ephemeral,
						});

						return;
					}

					// they originally voted something else
					const voted2 = modVotes2.indexOf(userId);
					if (voted2 != -1) { modVotes2.splice(voted2, 1); }
					const voted3 = modVotes3.indexOf(userId);
					if (voted3 != -1) { modVotes3.splice(voted3, 1); }

					modVotes1.push(userId);

					await interaction.reply({
						content: 'You voted for modifier 1.',
						flags: MessageFlags.Ephemeral,
					});

					if (modVotes1.length >= config.modifier_vote) {
						client.wheelResult(match, true, modifier1);
					}
					else {
						client.refreshVoteModifier(match);
					}
				}
				else {
					await interaction.reply({
						content: 'You are not in this match.',
						flags: MessageFlags.Ephemeral,
					});
				}
			}

			client.buttons.set('modifier_vote_2' + matchId, Vote2);
			async function Vote2(interaction) {
				const userId = interaction.user.id;

				modVotes1 = match.get("modifierVotes1");
				modVotes2 = match.get("modifierVotes2");
				modVotes3 = match.get("modifierVotes3");

				if (match.get("players").includes(userId)) {
					if (modVotes2.includes(userId)) {
						await interaction.reply({
							content: 'You have already voted for modifier 2.',
							flags: MessageFlags.Ephemeral,
						});

						return;
					}

					// they originally voted something else
					const voted1 = modVotes1.indexOf(userId);
					if (voted1 != -1) { modVotes1.splice(voted1, 1); }
					const voted3 = modVotes3.indexOf(userId);
					if (voted3 != -1) { modVotes3.splice(voted3, 1); }

					modVotes2.push(userId);

					await interaction.reply({
						content: 'You voted for modifier 2.',
						flags: MessageFlags.Ephemeral,
					});

					if (modVotes2.length >= config.modifier_vote) {
						client.wheelResult(match, true, modifier2);
					}
					else {
						client.refreshVoteModifier(match);
					}
				}
				else {
					await interaction.reply({
						content: 'You are not in this match.',
						flags: MessageFlags.Ephemeral,
					});
				}
			}

			client.buttons.set('modifier_vote_3' + matchId, Vote3);
			async function Vote3(interaction) {
				const userId = interaction.user.id;

				modVotes1 = match.get("modifierVotes1");
				modVotes2 = match.get("modifierVotes2");
				modVotes3 = match.get("modifierVotes3");

				if (match.get("players").includes(userId)) {
					if (modVotes3.includes(userId)) {
						await interaction.reply({
							content: 'You have already voted for modifier 3.',
							flags: MessageFlags.Ephemeral,
						});

						return;
					}

					// they originally voted something else
					const voted2 = modVotes2.indexOf(userId);
					if (voted2 != -1) { modVotes2.splice(voted2, 1); }
					const voted1 = modVotes1.indexOf(userId);
					if (voted1 != -1) { modVotes1.splice(voted1, 1); }

					modVotes3.push(userId);

					await interaction.reply({
						content: 'You voted for modifier 3.',
						flags: MessageFlags.Ephemeral,
					});

					if (modVotes3.length >= config.modifier_vote) {
						client.wheelResult(match, true, modifier3);
					}
					else {
						client.refreshVoteModifier(match);
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

		const container = new ContainerBuilder().setAccentColor(0xac9cff)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`## Vote for a modifier`))
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# First to ${config.modifier_vote} votes`))
			.addSeparatorComponents((separator) => separator)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### 1️⃣  ${modifier1.value}`))
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# ${modVotes1.length} votes`))
			.addSeparatorComponents((separator) => separator)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### 2️⃣  ${modifier2.value}`))
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# ${modVotes2.length} votes`))
			.addSeparatorComponents((separator) => separator)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### 3️⃣  ${modifier3.value}`))
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# ${modVotes3.length} votes`))
			.addSeparatorComponents((separator) => separator)
			.addActionRowComponents((actionRow) => actionRow.setComponents(
				new ButtonBuilder().setCustomId('modifier_vote_1' + matchId).setLabel('1️⃣').setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setCustomId('modifier_vote_2' + matchId).setLabel('2️⃣').setStyle(ButtonStyle.Secondary),
				new ButtonBuilder().setCustomId('modifier_vote_3' + matchId).setLabel('3️⃣').setStyle(ButtonStyle.Secondary),
			));

		return container;
	},
};