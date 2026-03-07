const { AttachmentBuilder, ContainerBuilder, ButtonStyle, ButtonBuilder, MediaGalleryBuilder, MessageFlags } = require("discord.js");
const shopItems = require('../shop.json');
const Canvas = require('@napi-rs/canvas');

module.exports = {
	name: "Shop Main",
	async getContainer(client, interaction) {
		// buttons
		async function setupButtons() {
			client.buttons.set("prevPage", PreviousPage);
			async function PreviousPage(int) {
				await int.deferReply({ flags: MessageFlags.Ephemeral });

				const state = client.leaderboards.get(int.message.id);
				const stats = client.leaderboardsStats.get(int.message.id);
				if (!state || !stats) { throw e; }

				state.num--;
				state.num = Math.max(0, state.num);
				client.leaderboards.set(int.message.id, state);

				const pnl = await DrawLeaderboard(state.num, stats);
				await int.message.edit({ components: [pnl[1], pnl[0]], flags: MessageFlags.IsComponentsV2, files: [pnl[2]] });

				await int.deleteReply();
			}

			client.buttons.set("nextPage", NextPage);
			async function NextPage(int) {
				await int.deferReply({ flags: MessageFlags.Ephemeral });

				const state = client.leaderboards.get(int.message.id);
				const stats = client.leaderboardsStats.get(int.message.id);
				if (!state || !stats) { throw e; }

				state.num++;
				state.num = Math.min(stats.maxPages - 1, state.num);
				client.leaderboards.set(int.message.id, state);

				const pnl = await DrawLeaderboard(state.num, stats);
				await int.message.edit({ components: [pnl[1], pnl[0]], flags: MessageFlags.IsComponentsV2, files: [pnl[2]] });

				await int.deleteReply();
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
				.addActionRowComponents((actionRow) => actionRow.setComponents(
					new ButtonBuilder().setCustomId("134rdfg").setLabel('<-').setStyle(ButtonStyle.Secondary),
					new ButtonBuilder().setCustomId("nextPa234erfge").setLabel('test item').setStyle(ButtonStyle.Secondary),
					new ButtonBuilder().setCustomId("next23sdfsdagPage").setLabel('test item').setStyle(ButtonStyle.Secondary),
					new ButtonBuilder().setCustomId("nextPsdfg4536age").setLabel('test item').setStyle(ButtonStyle.Secondary),
					new ButtonBuilder().setCustomId("nextP213214fdsage").setLabel('->').setStyle(ButtonStyle.Secondary),
				));

			return [container, gallery, attachment];
		}

		return DrawShop();
	},
};