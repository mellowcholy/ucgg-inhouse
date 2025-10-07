const { MessageFlags, Collection } = require('discord.js');

module.exports = {
	run(client) {
		// setup queue
		client.queue = new Collection();
		client.queue.set("Top", new Array(1, 2, 3));
		client.queue.set("Jungle", new Array());
		client.queue.set("Mid", new Array());
		client.queue.set("Bot", new Array());
		client.queue.set("Support", new Array());
		client.queue.set("Fill", new Array());

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

		function CheckQueuePop() {
			const queue = client.queue;

			let count = 0;
			for (const key of queue.keys()) {
				currentQueue = queue.get(key);

				const val = key == "Fill" ? currentQueue.length : Math.min(2, currentQueue.length);
				count += val;
			}

			if (count == 10) {
				console.log("Queue pop!");
			}
		}

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
	},
};