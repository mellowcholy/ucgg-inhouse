module.exports = {
	run(client) {
		const db = client.keyv;

		client.InitialisePlayer = async function(id) {
			const data = {};

			data["wins"] = 0;
			data["losses"] = 0;
			data["points"] = 0;
			data["mvps"] = 0;
			data["items"] = new Array();
			data["mmrs"] = {
				"Top": 0,
				"Jungle": 0,
				"Mid": 0,
				"Bot": 0,
				"Support": 0,
			};
			data["profile"] = "modern_white";

			await client.keyv.set(id, data);

			return data;
		};

		client.SavePlayer = async function(id, data) {
			await db.set(id, data);
		};

		client.LoadPlayer = async function(id) {
			let data = await db.get(id);
			if (!data) { data = await client.InitialisePlayer(id); }

			// setup later vars here;
			let shouldSave = false;
			if (!data.profile) { data["profile"] = "modern_white"; shouldSave = true; }

			if (shouldSave) {
				client.SavePlayer(id, data);
			}

			return data;
		};
	},
};