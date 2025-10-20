const { Collection, MessageFlags, ChannelType } = require("discord.js");

const modifiers = require('../modifiers.json');

module.exports = {
	run(client) {
		const config = client.config;
		client.matches = new Collection();

		client.BeginMatch = async function(match) {
			if (match.get("begin_lock")) { return; }
			match.set("begin_lock", true);

			const teams = await BalanceTeams(match);

			match.set("teams", teams);

			WheelVote(match);
		};

		client.cancelMatch = function(number) {
			const match = client.matches.get(number);

			if (match == null) { return 0; }

			// delete text channel
			const textChannel = match.get("textChannel");
			if (textChannel != null) {
				textChannel.delete();
			}

			// delete vcs
			const waitingRoom = match.get("waitingRoom");
			if (waitingRoom != null) {
				waitingRoom.delete();
			}

			const blueVc = match.get("blueVc");
			if (blueVc != null) {
				blueVc.delete();
			}

			const redVc = match.get("redVc");
			if (redVc != null) {
				redVc.delete();
			}

			client.matches.delete(number);

			return 1;
		};

		client.cancelAfterDelay = function(number) {
			const match = client.matches.get(number);

			if (match == null) { return; }
			if (match.get("waitingRoomPing") == null) { return; }

			// not everyone joined vc after delay. cancel match.
			client.cancelMatch(number);
		};

		client.InitialisePlayer = async function(id) {
			const data = {};

			data["wins"] = 0;
			data["losses"] = 0;
			data["points"] = 0;
			data["mvps"] = 0;
			data["items"] = new Array();
			data["mmrs"] = {
				"Top": 1000,
				"Jungle": 1000,
				"Mid": 1000,
				"Bot": 1000,
				"Support": 1000,
			};

			await client.keyv.set(id, data);

			return data;
		};

		async function BalanceTeams(match) {

			const players = match.get("positions");
			const trials = 500;

			const playerMMR = new Collection();

			// assign mmrs
			for (const [k, v] of players) {
				playerMMR.set(k, new Array());
				const role = playerMMR.get(k);

				// Use Promise.all to wait for all async gets to complete
				const mmrData = await Promise.all(
					v.map(async player => {
						let data = await client.keyv.get(player);
						if (!data) data = await client.InitialisePlayer(player);

						const plyMMR = data["mmrs"];
						const mmr = k == "Fill" ? plyMMR : plyMMR[k];

						return { [player]: mmr };
					}),
				);

				role.push(...mmrData);
			}

			function PickBestFill(role, fill) {
				let best = 0;
				const names = new Array();

				fill.forEach(obj => {
					for (const key of Object.entries(obj)) {
						names.push(key[0]);
					}
				});

				for (let i = 1; i < fill.length; i++) {

					if (fill[i][names[i]][role] > fill[best][names[best]][role]) {
						best = i;
					}
				}

				const chosen = fill.splice(best, 1)[0];

				return { [names[best]]: chosen[names[best]][role] };
			}

			function MakeTeams() {
				const fill = [...playerMMR.get("Fill")];
				const rolePairs = new Collection();

				// fill missing roles
				for (const [role, rolePlayers] of playerMMR) {
					if (role == "Fill") { continue; }

					const pair = (rolePlayers);

					while (rolePlayers.length < 2) {
						const fillPlayer = PickBestFill(role, fill);
						pair.push(fillPlayer);
					}

					rolePairs[role] = pair;
				}

				// random assignment per role
				const blueSide = new Collection();
				const redSide = new Collection();

				let totalBlue = 0;
				let totalRed = 0;

				for (const [role] of playerMMR) {
					if (role == "Fill") { continue; }

					const [p1, p2] = rolePairs[role];

					if (Math.random() < 0.5) {
						blueSide.set(role, p1);
						redSide.set(role, p2);
					}
					else {
						blueSide.set(role, p2);
						redSide.set(role, p1);
					}

					totalBlue += Object.values(blueSide.get(role))[0];
					totalRed += Object.values(redSide.get(role))[0];
				}

				// greedy balancing swaps
				for (const [role] of playerMMR) {
					if (role == "Fill") { continue; }

					const a = Object.values(blueSide.get(role))[0];
					const b = Object.values(redSide.get(role))[0];

					const diffBefore = Math.abs(totalBlue - totalRed);
					const newBlue = totalBlue - a + b;
					const newRed = totalRed - b + a;
					const diffAfter = Math.abs(newBlue - newRed);

					if (diffAfter < diffBefore) {
						const swap = blueSide.get(role);

						blueSide.set(role, redSide.get(role));
						redSide.set(role, swap);

						totalBlue = newBlue;
						totalRed = newRed;
					}
				}

				return {
					blueSide,
					redSide,
					avgBlue: totalBlue / 5,
					avgRed: totalRed / 5,
					diff: Math.abs(totalBlue - totalRed),
				};
			}

			// run multiple simulations and pick the best
			let best = null;
			for (let i = 0; i < trials; i++) {
				const result = MakeTeams();

				if (!best || result.diff < best.diff) {
					best = result;
					if (best.diff == 0) { break; }
				}
			}

			return best;
		}

		client.refreshVoteWheel = function(match) {
			const key = "wheelVote" + match.get("number");

			client.enqueue(key, async () => {
				const wheelVoteMessage = match.get("wheelVoteMsg");

				// check if msg is valid
				const valid = await wheelVoteMessage.channel.messages.fetch(wheelVoteMessage.id);

				if (!valid) { return; }

				wheelVoteMessage.edit({
					components: [client.panels.get("Vote Wheel")(client, match)],
					flags: MessageFlags.IsComponentsV2,
				}).catch(console.error);
			});
		};

		client.wheelResult = function(match, result) {
			if (match.get("wheel_locked")) { return; }
			match.set("wheel_locked", true);

			const channel = match.get("textChannel");
			const wheelVoteMessage = match.get("wheelVoteMsg");

			wheelVoteMessage.delete();

			if (result) {

				channel.send(`The random modifier for this game is: ${modifiers.modifiers[modifiers.modifiers.length * Math.random() | 0]}`);
			}
			else {
				channel.send("The wheel will not be spun.");
			}

			MoveToVoice(match);
		};

		function WheelVote(match) {
			// cleanup match data
			const ping = match.get("waitingRoomPing");
			if (ping != null) {
				ping.delete();
			}
			match.delete("waitingRoomPing");
			match.delete("waitingOn");

			// vote for wheel spin.
			match.set("wheelVotesYes", new Array());
			match.set("wheelVotesNo", new Array());

			const channel = match.get("textChannel");

			channel.send({
				components: [client.panels.get("Vote Wheel")(client, match)],
				flags: MessageFlags.IsComponentsV2,
			}).then(msg => match.set("wheelVoteMsg", msg));
		}

		async function MoveToVoice(match) {
			// prevent multiple deletions
			if (match.get("move_locked")) { return; }
			match.set("move_locked", true);

			// clean up wheel data
			match.delete("wheelVotesYes");
			match.delete("wheelVotesNo");
			match.delete("wheelvote");
			match.delete("wheelVoteMsg");

			// vote for wheel spin.
			match.set("winnerVotesBlue", new Array());
			match.set("winnerVotesRed", new Array());

			const channel = match.get("textChannel");

			channel.send({
				components: [client.panels.get("Teams and Vote Winner")(client, match)],
				flags: MessageFlags.IsComponentsV2,
				allowedMentions: { parse: [] },
			}).then(msg => match.set("winnerVoteMsg", msg));

			// create team a and team b vc
			const category = client.channels.cache.get(config.inhouse_category);
			const guild = category.guild;

			const blueVc = await guild.channels.create({
				name: `Match #${match.get("number")} - Blue Side`,
				type: ChannelType.GuildVoice,
				parent: category,
			});
			match.set("blueVc", blueVc);

			const redVc = await guild.channels.create({
				name: `Match #${match.get("number")} - Red Side`,
				type: ChannelType.GuildVoice,
				parent: category,
			});
			match.set("redVc", redVc);

			// move people into there
			const teams = match.get("teams");

			for (const [, player] of teams.blueSide) {
				const id = Object.keys(player)[0];
				const member = guild.members.cache.get(id) || null;

				if (member == null) { continue; }

				member.voice.setChannel(blueVc).catch(console.error);
			}

			for (const [, player] of teams.redSide) {
				const id = Object.keys(player)[0];
				const member = guild.members.cache.get(id) || null;

				if (member == null) { continue; }

				member.voice.setChannel(redVc).catch(console.error);
			}

			// delete waiting room
			const waitingRoom = match.get("waitingRoom");
			setTimeout(async () => waitingRoom.delete(), 5000);
			match.delete("waitingRoom");
		}

		client.winnerResult = async function(match, result) {
			// result -> true = blue side | false -> red side

			// prevent multiple deletions
			if (match.get("winner_locked")) { return; }
			match.set("winner_locked", true);

			// post results
			const channel = client.channels.cache.get(config.results_channel);

			channel.send({
				components: [client.panels.get("Results")(client.config, match, result)],
				flags: MessageFlags.IsComponentsV2,
				allowedMentions: { parse: [] },
			});

			// delete vc and text and other data
			match.delete("positions");
			const textChannel = match.get("textChannel");
			textChannel.delete();

			match.delete("textChannel");
			match.delete("winnerVotesBlue");
			match.delete("winnerVotesRed");
			match.delete("winnervote");

			const blueVc = match.get("blueVc");
			blueVc.delete();
			match.delete("blueVc");

			const redVc = match.get("redVc");
			redVc.delete();
			match.delete("redVc");

			match.delete("winnerVoteMsg");

			const number = match.get("number");

			const teams = match.get("teams");
			const winner = result ? teams["blueSide"] : teams["redSide"];
			const loser = result ? teams["redSide"] : teams["blueSide"];

			await client.keyv.set("matchNum", number);

			// winner
			for (const [role, player] of winner) {
				const [id] = Object.entries(player)[0];
				const data = await client.keyv.get(id);

				data["wins"]++;
				data["points"] += config.points_win;
				data["mmrs"][role] += config.mmr_gain;

				await client.keyv.set(id, data);
			}

			// loser
			for (const [role, player] of loser) {
				const [id] = Object.entries(player)[0];
				const data = await client.keyv.get(id);

				data["losses"]++;
				data["points"] += config.points_loss;
				data["mmrs"][role] -= config.mmr_loss;

				data["mmrs"][role] = Math.max(0, data["mmrs"][role]);

				await client.keyv.set(id, data);
			}

			client.matches.delete(number);
		};

		client.refreshWinnerVote = function(match) {
			const key = "winnerVote" + match.get("number");

			client.enqueue(key, async () => {
				const winnerVoteMessage = match.get("winnerVoteMsg");

				// check if msg is valid
				const valid = await winnerVoteMessage.channel.messages.fetch(winnerVoteMessage.id);

				if (!valid) { return; }

				winnerVoteMessage.edit({
					components: [client.panels.get("Teams and Vote Winner")(client, match)],
					flags: MessageFlags.IsComponentsV2,
					allowedMentions: { parse: [] },
				}).catch(console.error);
			});
		};
	},
};