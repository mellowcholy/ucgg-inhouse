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

			await db.set(id, data);

			return data;
		};

		client.InitialiseInventory = async function(id) {
			const inventory = {};

			inventory["profiles"] = ["Modern White"];
			inventory["roles"] = [];
			inventory["tickets"] = [];
			inventory["black market"] = [];
			inventory["equipped_profile"] = "Modern White";
			inventory["equipped_role"] = "none";
			inventory["equipped_icon"] = "none";

			await db.set(`${id}_inventory`, inventory);

			return inventory;
		};

		client.SavePlayer = async function(id, data) {
			await db.set(id, data);
		};

		client.SaveInventory = async function(id, data) {
			await db.set(`${id}_inventory`, data);
		};

		client.LoadPlayer = async function(id) {
			let data = await db.get(id);
			if (!data) { data = await client.InitialisePlayer(id); }

			return data;
		};

		client.LoadInventory = async function(id) {
			let data = await db.get(`${id}_inventory`);
			if (!data) { data = await client.InitialiseInventory(id); }

			return data;
		};
	},
};