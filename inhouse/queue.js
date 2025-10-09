const { MessageFlags, Collection, ChannelType } = require('discord.js');

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

		// create inhouse post func
		client.RefreshInHousePost = function() {
			const channel = client.channels.cache.get("1424956618361147432");

			if (client.latestInhousePost != null) {
				client.latestInhousePost.delete();
			}

			channel.send({
				components: [client.panels.get("In-House Queue")(client)],
				flags: MessageFlags.IsComponentsV2,
				allowedMentions: { parse: [] },
			}).then(msg => client.latestInhousePost = msg);
		};

		// create join queue func
		client.JoinQueue = function(userId, position) {
			const queue = client.queue;
			const queuePos = queue.get(position);

			/* TODO: RE-ENABLE THIS
			for (const key of queue.keys()) {
				const currentQueue = queue.get(key);
				const isUserId = (v) => v == userId;
				const found = currentQueue.findIndex(isUserId);

				if (found == -1) { continue; }
				if (key == position) { return 0; } // you are already queing for this role

				currentQueue.splice(found, 1);
			}*/

			queuePos.push(userId);

			CheckQueuePop();
			return 1;
		};

		function CheckQueuePop() {
			const queue = client.queue;

			let count = 0;
			for (const key of queue.keys()) {
				currentQueue = queue.get(key);

				const val = key == "Fill" ? currentQueue.length : Math.min(2, currentQueue.length);
				count += val;
			}

			if (count == 1) {
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

			let pingString = "A match is ready. Please join the match voice channel: ";

			for (const key of queue.keys()) {
				const queuePos = queue.get(key);
				const matchPos = match.get("positions").get(key);
				const matchWaiting = match.get("waitingOn");
				const num = key == "Fill" ? queuePos.length : Math.min(2, queuePos.length);

				for (let i = 0; i < num; i++) {
					const player = queuePos.shift();

					pingString += `<@${player}> `;

					matchPos.push(player);
					matchWaiting.push(player);
				}
			}

			// populate match with data
			// TODO: peristent match numbers
			match.set("number", 1);

			// make text channel and vcs
			const category = client.channels.cache.get("1425074429297168516");
			const guild = category.guild;

			const textChannel = await guild.channels.create({
				name: `match-${match.get("number")}`,
				type: ChannelType.GuildText,
				parent: category,
			});

			const waitingRoom = await guild.channels.create({
				name: `Match #${match.get("number")}`,
				type: ChannelType.GuildVoice,
				parent: category,
			});

			match.set("textChannel", textChannel);
			match.set("waitingRoom", waitingRoom);

			// alert players of match
			const waitingRoomPing = await textChannel.send(pingString);

			match.set("waitingRoomPing", waitingRoomPing);

			client.matches.push(match);

			console.log(match);
		}
	},
};