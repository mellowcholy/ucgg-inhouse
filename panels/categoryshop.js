const { AttachmentBuilder, ContainerBuilder, ButtonStyle, ButtonBuilder, MediaGalleryBuilder, MessageFlags } = require("discord.js");
const shopItems = require('../shop.json');
const Canvas = require('@napi-rs/canvas');

module.exports = {
	name: "Category Shop",
	async getContainer(client, category, interaction) {
		// buttons
		const buttons = [];
		buttons.push(new ButtonBuilder().setCustomId("categoryshop_prevPage").setLabel("<-").setStyle(ButtonStyle.Secondary));
		async function setupButtons() {
			for (const [name, item] of Object.entries(shopItems[category])) {
				const buttonName = `${name}_button`;

				// TODO: REMOVE
				if (name == "Terminal Green") { return; }

				buttons.push(new ButtonBuilder().setCustomId(buttonName).setLabel(name).setStyle(ButtonStyle.Primary));

				async function Button(int) {
					await int.deferReply({ flags: MessageFlags.Ephemeral });

					const id = int.user.id;
					const data = await client.LoadPlayer(id);
					const inventory = await client.LoadInventory(id);

					// check if they have it
					if (inventory[category].includes(name)) {
						await int.editReply("You already own this item!").catch(console.error);
						return;
					}

					// check if they have enough credits
					if (data.points < item.cost) {
						await int.editReply("You do not have enough credits to buy this item!").catch(console.error);
						return;
					}

					inventory[category].push(name);
					data.points -= item.cost;

					await client.SavePlayer(id, data);
					await client.SaveInventory(id, inventory);

					await int.editReply(`You have purchased ${name} for ${item.cost} credits!`).catch(console.error);
				}

				client.buttons.set(buttonName, Button);
			}
		}
		await setupButtons();
		buttons.push(new ButtonBuilder().setCustomId("categoryshop_nextPage").setLabel("->").setStyle(ButtonStyle.Secondary));

		async function DrawShop() {
			// create shop image
			const canvas = Canvas.createCanvas(825, 620);
			const context = canvas.getContext("2d");
			context.imageSmoothingEnabled = true;
			context.imageSmoothingQuality = "low";
			const [background, slot] = await Promise.all([
				Canvas.loadImage('./img/category_shop.png'),
				Canvas.loadImage('./img/category_shop_slot.png'),
			]);

			context.drawImage(background, 0, 0, canvas.width, canvas.height);

			async function drawItem(name, cost, description, y) {
				// background
				context.drawImage(slot, 27, y);

				// name
				context.font = '36px Cyber Angel';
				context.textAlign = "left";

				context.strokeStyle = '#3c4278';
				context.lineWidth = 10;
				context.strokeText(`${name}`, 59, y + 56);

				const width = context.measureText(name).width;

				const gradient = context.createLinearGradient(59, y + 30, 59 + width, y + 56);
				gradient.addColorStop(0, "white");
				gradient.addColorStop(0.45, "#b7caff");
				gradient.addColorStop(0.55, "#dcc0ff");
				gradient.addColorStop(1.0, "white");

				context.fillStyle = gradient;
				context.fillText(`${name}`, 59, y + 56);

				// description
				context.font = '24px Bahnschrift';
				context.fillStyle = '#1b2159';

				const lines = client.getLines(context, description, 743 - 59);
				for (let i = 0; i < lines.length; i++) {
					context.fillText(lines[i], 59, y + 90 + (i * 24));
				}

				// cost
				context.font = '24px Cyber Angel';
				context.textAlign = "right";

				context.strokeStyle = '#1b2159';
				context.strokeText(`${cost}c`, 743, y + 56);

				context.fillStyle = "white";
				context.fillText(`${cost}c`, 743, y + 56);
			};

			const drawPromises = [];
			let yPos = 45;

			for (const [name, item] of Object.entries(shopItems[category])) {
				drawPromises.push(drawItem(name, item.cost, item.description, yPos));

				yPos += (176 + 12);
			}

			await Promise.all(drawPromises);

			// panels
			const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'shop.png' });
			const gallery = new MediaGalleryBuilder().addItems(mediaGalleryItem => mediaGalleryItem.setURL("attachment://shop.png"));
			const container = new ContainerBuilder()
				.setAccentColor(0xac9cff)
				.addActionRowComponents((actionRow) => actionRow.setComponents(buttons));

			return [container, gallery, attachment];
		}

		return DrawShop();
	},
};