const { MessageFlags, Collection, ChannelType, time, TimestampStyles, Colors, AttachmentBuilder } = require('discord.js');

module.exports = {
	run(client) {
		// setup queue
		client.queue = new Collection([
			["Top", new Array()],
			["Jungle", new Array()],
			["Mid", new Array()],
			["Bot", new Array()],
			["Support", new Array()],
			["Fill", new Array()],
		]);

		const config = client.config;

		const file = new AttachmentBuilder("./img/queue_banner.png");

		// create inhouse post func
		client.RefreshInHousePost = function() {
			client.inhousePosting = true;
			client.enqueue(config.inhouse_channel, async () => {
				try {
					const channel = client.channels.cache.get(config.inhouse_channel);
					if (client.latestInhousePost != null) {
						await client.latestInhousePost.delete().catch(console.error);
					}
					client.resetInactivityTimer();
					const msg = await channel.send({
						components: [client.panels.get("In-House Queue")(client)],
						files: [file],
						flags: MessageFlags.IsComponentsV2,
						allowedMentions: { parse: [] },
					});
					client.latestInhousePost = msg;
				}
 				finally {
					client.inhousePosting = false;
				}
			});
		};

		// create join queue func
		client.JoinQueue = async function(userId, position) {
			const queue = client.queue;
			const queuePos = queue.get(position);

			// check if they are banned
			const db = client.keyv;
			const banInfo = await db.get(`ban_${userId}`);

			if (banInfo) {
				if (banInfo == true) {
					return 3;
				}
				else {
					return 4;
				}
			}

			// check if mmr needs to be set
			const ply = await client.LoadPlayer(userId);
			if (ply.mmrs["Top"] == 0) {
				return 5;
			}

			// check if they are in a match
			for (const [, match] of client.matches) {
				const players = match.get("players");
				for (let i = 0; i < players.length; i++) {
					if (players[i] == userId) {
						return 2;
					}
				}
			}

			for (const key of queue.keys()) {
				const currentQueue = queue.get(key);
				const isUserId = (v) => v == userId;
				const found = currentQueue.findIndex(isUserId);

				if (found == -1) { continue; }
				if (key == position) { return 0; } // you are already queing for this role

				currentQueue.splice(found, 1);
			}

			queuePos.push(userId);
			client.resetInactivityTimer();

			CheckQueuePop();

			return 1;
		};

		client.inactivityTimer = null;

		client.resetInactivityTimer = async function() {
			clearTimeout(client.inactivityTimer);

			const queue = client.queue;

			client.inactivityTimer = setTimeout(async () => {
				let empty = true;

				for (const key of queue.keys()) {
					const queuePos = queue.get(key);
					const num = key == "Fill" ? queuePos.length : Math.min(2, queuePos.length);

					for (let i = 0; i < num; i++) {
						const player = queuePos.shift();
						empty = false;

						await client.InactivityLeave(player);
					}
				}

				if (empty) { return; }

				console.log("CLEARING QUEUE FOR INACTIVITY");
				client.RefreshInHousePost();
			}, 18000 * 1000);
		};

		client.InactivityLeave = async function(userId) {
			let target = client.users.cache.get(userId);

			if (!target) {
				try {
					target = await client.users.fetch(userId);
				}
				catch (error) {
					console.error('User not found:', error);
					return;
				}
			}

			target.send(`-# Automated Message:\nYou have been removed from the queue as there has been no queue activity for five hours.`).catch(console.error);
			client.LeaveQueue(userId);
		};

		client.LeaveQueue = function(userId) {
			const queue = client.queue;
			let bool = false;

			queue.each(async val => {
				const isUserId = (v) => v == userId;
				const found = val.findIndex(isUserId);

				if (found == -1) { return; }

				val.splice(found, 1);

				bool = true;
			});

			return bool ? 0 : 1;
		};

		function CheckQueuePop() {
			const queue = client.queue;

			let count = 0;
			for (const key of queue.keys()) {
				currentQueue = queue.get(key);

				const val = key == "Fill" ? currentQueue.length : Math.min(2, currentQueue.length);
				count += val;
			}

			if (count == 10) {
				QueuePop();
			}
		}

		// queue pop
		async function QueuePop() {
			// consolidate players into a match object
			const queue = client.queue;
			const match = new Collection();
			match.set("positions", new Collection([
				["Top", new Array()],
				["Jungle", new Array()],
				["Mid", new Array()],
				["Bot", new Array()],
				["Support", new Array()],
				["Fill", new Array()],
			]));

			match.set("waitingOn", new Array());
			match.set("players", new Array());

			let pingString = "A match is ready. Please join the match voice channel: ";

			const matchWaiting = match.get("waitingOn");
			const players = match.get("players");

			for (const key of queue.keys()) {
				const queuePos = queue.get(key);
				const matchPos = match.get("positions").get(key);
				const num = key == "Fill" ? queuePos.length : Math.min(2, queuePos.length);

				for (let i = 0; i < num; i++) {
					const player = queuePos.shift();

					pingString += `<@${player}> `;

					matchPos.push(player);
					matchWaiting.push(player);
					players.push(player);
				}
			}

			const date = new Date();
			date.setSeconds(date.getSeconds() + 180);
			const timeString = time(date, TimestampStyles.RelativeTime);

			pingString += `. If not everyone has joined ${timeString}, the match will be cancelled.`;

			// populate match with data
			const matchId = await client.keyv.get("matchNum") + 1 || 1;
			match.set("number", matchId);
			await client.keyv.set("matchNum", matchId);

			// make text channel and vcs
			const category = client.channels.cache.get(config.inhouse_category);
			const guild = category.guild;

			const textChannel = await guild.channels.create({
				name: `match-${match.get("number")}`,
				type: ChannelType.GuildText,
				parent: category,
			});

			// alert players of match
			const waitingRoomPing = await textChannel.send(pingString);

			match.set("waitingRoomPing", waitingRoomPing);

			const waitingRoom = await guild.channels.create({
				name: `Match #${match.get("number")}`,
				type: ChannelType.GuildVoice,
				parent: category,
			});

			match.set("textChannel", textChannel);
			match.set("votePosting", true);
			match.set("waitingRoom", waitingRoom);

			// make a new pingable role for all the players in this queue
			const role = await guild.roles.create({
				name: `Match ${matchId}`,
				reason: "Pingable roles for this match",
				colors: {
					primaryColor: Colors.Blue,
				},
			}).catch(console.error);

			match.set("role", role);

			for (let i = 0; i < players.length; i++) {
				const member = guild.members.cache.get(players[i]) || null;

				if (member == null) { continue; }
				member.roles.add(role);
			}

			setTimeout(() => client.cancelAfterDelay(matchId), 180 * 1000);
			client.matches.set(matchId, match);
		}
	},
};