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
				"Top": 1000,
				"Jungle": 1000,
				"Mid": 1000,
				"Bot": 1000,
				"Support": 1000,
			};
			data["profile"] = "modern_white";

			await client.keyv.set(id, data);

			return data;
		};

		client.LoadPlayer = async function(id) {
			let data = await db.get(id);
			if (!data) { data = await client.InitialisePlayer(id); }

			// setup later vars here;
			if (!data.profile) { data["profile"] = "modern_white"; }

			return data;
		};

		client.SavePlayer = async function(id, data) {
			await db.set(id, data);
		};
	},
};