const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require("discord.js");
const shopItems = require('../../shop.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("equip")
		.setDescription("Equip something from your inventory.")
		.addStringOption((option) => option
			.setName("category")
			.setDescription("The category of item you want to use.")
			.setRequired(true)
			.addChoices(
				{ name: 'Profile', value: "profiles" },
				{ name: 'Role', value: "roles" },
			),
		)
		.addStringOption((option) => option
			.setName("item")
			.setDescription("The name of the item you want to use.")
			.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const client = interaction.client;
		const id = interaction.user.id;

		const category = interaction.options.getString("category");
		const item = interaction.options.getString("item");

		const inventory = await client.LoadInventory(id);

		if (!inventory[category].includes(item)) {
			await interaction.editReply(`${item} either does not exist, or you do not own it.`).catch(console.error); return;
		}

		switch (category) {
		case "profiles": inventory.equipped_profile = item; break;
		case "roles":
			// if has icon, equip icon
			if (shopItems[category][item].icon) {
				inventory.equipped_icon = item;
			}
			else {
				inventory.equipped_role = item;
			}
			break;
		}

		await client.SaveInventory(id, inventory);

		await interaction.editReply(`You have equipped ${item}.`).catch(console.error); return;
	},
};