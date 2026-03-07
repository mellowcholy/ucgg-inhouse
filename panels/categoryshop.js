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
			for (let i = 0; i < shopItems[category].length; i++) {
				const buttonName = `${shopItems[category][i].name}_button`;

				buttons.push(new ButtonBuilder().setCustomId(buttonName).setLabel(shopItems[category][i].name).setStyle(ButtonStyle.Secondary));

				async function Button(int) {
					await int.deferReply({ flags: MessageFlags.Ephemeral });

					await int.editReply("Yeah it works").catch(console.error);
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
				context.font = 'bold 36px Bahnschrift';
				context.fillStyle = '#3c4278';

				context.textAlign = "left";
				context.fillText(`${name}`, 59, y + 56);

				// description
				context.font = '24px Bahnschrift';
				context.fillStyle = '#1b2159';

				const lines = client.getLines(context, description, 743 - 59);
				for (let i = 0; i < lines.length; i++) {
					context.fillText(lines[i], 59, y + 88 + (i * 24));
				}

				// cost
				context.font = '24px Cyber Angel';
				context.textAlign = "right";
				context.fillText(`${cost}c`, 743, y + 56);
			};

			const drawPromises = [];
			let yPos = 45;

			for (let i = 0; i < shopItems[category].length; i++) {
				const entry = shopItems[category][i];

				drawPromises.push(drawItem(entry.name, entry.cost, entry.description, yPos));

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