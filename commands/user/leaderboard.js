const { SlashCommandBuilder, InteractionContextType, AttachmentBuilder } = require("discord.js");
const Canvas = require('@napi-rs/canvas');
const { request } = require('undici');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("View everyone's stats.")
		.addStringOption((option) => option.setName("stat").setDescription("What stat to sort players by.").setRequired(true))
		.addIntegerOption((option) => option.setName("pagenumber").setDescription("What page to view"))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;

		// sort by key
		const leaderboard = [];
		for await (const [key, value] of client.keyv.iterator()) {
			if (!value.wins) { continue; }

			leaderboard.push([key, value]);
    	};

		const key = interaction.options.getString("stat");
		const pageNum = interaction.options.getInteger("pagenumber") ?? 0;

		const sorted = leaderboard.sort(([, a], [, b]) => b[key] - a[key]);
		const pages = [];

		let page = [];
		let counter = 1;
		for (let i = 0; i < sorted.length; i++) {
			page.push(sorted[i]);

			if (counter == 6) {
				pages.push(page);
				page = [];
				counter = 0;
			}

			// TODO: ADD PLACEMENT NUMBER TO ARRAY
		}

		if (page.length > 0) { pages.push(page); }

		for (let i = 0; i < pages.length; i++) {
			console.log(pages[i]);
		}

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
		context.fillText(`In House - ${key.charAt(0).toUpperCase() + key.slice(1)}`, 413, 60);

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
		};

		let yPos = 92;
		for (let i = 0; i < pages[pageNum].length; i++) {
			await drawUser(pages[pageNum][i][0], yPos, i + 1, pages[pageNum][i][1][key]);

			yPos += 3 + 82;
		}

		const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'leaderboard.png' });

		await interaction.editReply({ files: [attachment] }).catch(console.error); return;
	},
};