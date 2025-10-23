const { AttachmentBuilder, ContainerBuilder, ButtonStyle, ButtonBuilder, MediaGalleryBuilder, MessageFlags } = require("discord.js");
const Canvas = require('@napi-rs/canvas');
const { request } = require('undici');

module.exports = {
	name: "Leaderboard",
	async getContainer(client, stat, pagenumber = 0, interaction) {

		// buttons
		let num = pagenumber;

		async function setupButtons() {
			client.buttons.set("prevPage", PreviousPage);
			async function PreviousPage(int) {
				num--;
				num = Math.max(0, num);

				const pnl = await DrawLeaderboard(num);
				await int.message.edit({ components: [pnl[1], pnl[0]], flags: MessageFlags.IsComponentsV2, files: [pnl[2]] });

				await int.reply("You have changed the page.");
				int.deleteReply();
			}

			client.buttons.set("nextPage", NextPage);
			async function NextPage(int) {
				num++;
				num = Math.min(maxPages - 1, num);

				const pnl = await DrawLeaderboard(num);
				await int.message.edit({ components: [pnl[1], pnl[0]], flags: MessageFlags.IsComponentsV2, files: [pnl[2]] });

				await int.reply("You have changed the page.");
				int.deleteReply();
			}
		}
		setupButtons();

		// DATA
		let maxPages = 0;
		async function DrawLeaderboard(pn) {
			// sort by key
			const leaderboard = [];
			for await (const [key, value] of client.keyv.iterator()) {
				if (!value.wins) { continue; }

				leaderboard.push([key, value]);
    	};

			const key = stat;
			let label = "";
			let mmr = false;

			switch (stat) {
			case "wins":
			case "losses":
			case "mvps":
				label = stat.charAt(0).toUpperCase() + stat.slice(1);
				break;
			case "points":
				label = "Credits";
				break;
			case "Top":
			case "Jungle":
			case "Mid":
			case "Bot":
			case "Support":
				label = stat;
				mmr = true;
				break;
			}

			const sorted = leaderboard.sort(([, a], [, b]) => mmr ? b["mmrs"][key] - a["mmrs"][key] : b[key] - a[key]);
			const pages = [];

			let page = [];
			let counter = 1;
			for (let i = 0; i < sorted.length; i++) {
				page.push([i + 1, sorted[i]]);

				if (counter == 6) {
					pages.push(page);
					page = [];
					counter = 0;
				}

				counter++;
			}

			if (page.length > 0) { pages.push(page); }

			maxPages = pages.length;

			// create leaderboard image
			const canvas = Canvas.createCanvas(825, 620);
			const context = canvas.getContext("2d");
			const background = await Canvas.loadImage('./img/leaderboard.png');
			const slot = await Canvas.loadImage('./img/leaderboard_slot.png');

			context.drawImage(background, 0, 0, canvas.width, canvas.height);

			// title bar
			context.font = 'bold 30px Bahnschrift';
			context.fillStyle = '#1e1d1b';
			context.textAlign = "center";
			context.fillText(`In House - ${label}`, 413, 60);

			async function drawUser(id, y, position, value) {
			// background
				context.drawImage(slot, 27, y);

				context.font = '30px Bahnschrift';
				context.fillStyle = '#1e1d1b';

				// position
				context.textAlign = "center";
				context.fillText(`${position}.`, 69, y + 48);

				// name
				/*
			let member = interaction.guild.members.cache.get(id);

			if (!member) {
				member = await interaction.guild.members.fetch(id);
			}

			const name = member.displayname;
			*/
				const name = id;
				context.textAlign = "left";
				context.fillText(`${name}`, 182, y + 48);

				// value
				context.textAlign = "right";
				context.fillText(`${value}`, canvas.width - 57, y + 48);

				// avatar
				// TODO: REMOVE:
				const target = interaction.guild.members.cache.get("259167676902014987");
				const { body } = await request(target.displayAvatarURL({ extension: 'jpg' }));
				const avatar = await Canvas.loadImage(await body.arrayBuffer());

				context.save();
				context.beginPath();
				context.arc(131, y + 38, 27, 0, Math.PI * 2, true);
				context.closePath();
				context.clip();
				context.drawImage(avatar, 104, y + 11, 54, 54);
				context.restore();
			};

			let yPos = 92;
			for (let i = 0; i < pages[pn].length; i++) {
				const entry = pages[pn][i];
				const position = entry[0];
				const id = entry[1][0];
				const value = mmr ? entry[1][1]["mmrs"][key] : entry[1][1][key];

				await drawUser(id, yPos, position, value);

				yPos += 3 + 82;
			}

			// panels
			const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'leaderboard.png' });
			const gallery = new MediaGalleryBuilder().addItems(mediaGalleryItem => mediaGalleryItem.setURL("attachment://leaderboard.png"));
			const container = new ContainerBuilder()
				.setAccentColor(0xac9cff)
				.addActionRowComponents((actionRow) => actionRow.setComponents(
					new ButtonBuilder().setCustomId("prevPage").setLabel('<- Page').setStyle(ButtonStyle.Secondary).setDisabled(num == 0 ? true : false),
					new ButtonBuilder().setCustomId("nextPage").setLabel('Page ->').setStyle(ButtonStyle.Secondary).setDisabled(num == maxPages - 1 ? true : false),
				));

			return [container, gallery, attachment];
		}

		return DrawLeaderboard(pagenumber);
	},
};