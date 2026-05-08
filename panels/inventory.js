const { ContainerBuilder } = require("discord.js");

module.exports = {
	name: "Inventory",
	getContainer(client, name, inventory) {
		const container = new ContainerBuilder().setAccentColor(0x64f2c8)
			.addMediaGalleryComponents((mediaGallery) =>
				mediaGallery.addItems((item) =>
					item.setURL("attachment://inventory_banner.png").setDescription('Inventory Banner'),
				),
			)
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`-# ${name}`));

		// populate inventory
		for (const [category, items] of Object.entries(inventory)) {
			if (category == "equipped_profile") { continue; }
			if (category == "equipped_role") { continue; }
			if (category == "equipped_icon") { continue; }
			if (items.length == 0) { continue; }

			// header
			container.addSeparatorComponents((separator) => separator)
				.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`### ${category.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ')}`))
				.addSeparatorComponents((separator) => separator);

			// items
			let itemsString = "";

			for (let i = 0; i < items.length; i++) {
				let equipped = false;
				if (inventory.equipped_profile == items[i]) { equipped = true; }
				if (inventory.equipped_role == items[i]) { equipped = true; }
				if (inventory.equipped_icon == items[i]) { equipped = true; }

				itemsString += equipped ? `* **${items[i]} <--**\n` : `* ${items[i]}\n`;
			}

			container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(itemsString));
		}

		return container;
	},
};