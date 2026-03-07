const { AttachmentBuilder, ContainerBuilder, ButtonStyle, ButtonBuilder, MediaGalleryBuilder, MessageFlags } = require("discord.js");
const shopItems = require('../shop.json');
const Canvas = require('@napi-rs/canvas');

module.exports = {
	name: "Shop Main",
	async getContainer(client, interaction) {
		// buttons
		const buttons = [];
		async function setupButtons() {
			for (const [key] of Object.entries(shopItems)) {
				const buttonName = `${key}_button`;

				buttons.push(new ButtonBuilder().setCustomId(buttonName).setLabel(key.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ')).setStyle(ButtonStyle.Secondary));

				async function Button(int) {
					await int.deferReply({ flags: MessageFlags.Ephemeral });

					const panel = await client.panels.get("Category Shop")(client, key, int);
					await int.editReply({ components: [panel[1], panel[0]], flags: MessageFlags.IsComponentsV2, files: [panel[2]] }).catch(console.error);
				}

				client.buttons.set(buttonName, Button);
			}
		}
		setupButtons();

		async function DrawShop() {
			// create shop image
			const canvas = Canvas.createCanvas(825, 620);
			const context = canvas.getContext("2d");
			context.imageSmoothingEnabled = true;
			context.imageSmoothingQuality = "low";
			const [background, slot] = await Promise.all([
				Canvas.loadImage('./img/shop.png'),
				Canvas.loadImage('./img/shop_slot.png'),
			]);

			context.drawImage(background, 0, 0, canvas.width, canvas.height);

			async function drawItem(name, y) {
				// background
				context.drawImage(slot, 27, y);

				context.font = '36px Cyber Angel';
				context.fillStyle = '#5a3c78';

				context.textAlign = "left";
				context.fillText(`${name}`, 72, y + 52);
			};

			const drawPromises = [];
			let yPos = 129;

			for (const [key] of Object.entries(shopItems)) {

				drawPromises.push(drawItem(key, yPos));

				yPos += 88;
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