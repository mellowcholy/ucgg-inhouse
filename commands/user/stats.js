const { AttachmentBuilder, SlashCommandBuilder, InteractionContextType } = require("discord.js");
const Canvas = require('@napi-rs/canvas');
const { request } = require('undici');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("View your or another player's stats.")
		.addUserOption((option) => option.setName("target").setDescription("View another member's stats."))
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		await interaction.deferReply();

		const client = interaction.client;

		const target = interaction.options.getUser("target") || interaction.user;

		let data = await client.keyv.get(target.id);
		if (!data) data = await client.InitialisePlayer(target.id);

		const { body } = await request(target.displayAvatarURL({ extension: 'jpg' }));
		const avatar = await Canvas.loadImage(await body.arrayBuffer());

		const canvas = Canvas.createCanvas(825, 620);
		const context = canvas.getContext("2d");
		const background = await Canvas.loadImage('./img/profile_black.png');

		context.drawImage(background, 0, 0, canvas.width, canvas.height);
		context.drawImage(avatar, 95, 22, 133, 133);

		// name
		context.font = '60px Cyber Soulja';
		context.fillStyle = '#eeeeee';
		context.fillText(target.displayName, 264, 128);

		// role mmr
		context.font = '40px Static Surge';
		context.fillStyle = '#eeeeee';

		let mmrHeight = 340;

		for (const k of Object.keys(data.mmrs)) {
			context.fillText(data.mmrs[k], 236, mmrHeight);

			mmrHeight += 48;
		}

		// other stats
		context.font = '36px Cyber Angel';
		context.fillStyle = '#eeeeee';
		context.textAlign = 'right';

		context.fillText(data.wins, canvas.width - 162, 335);
		context.fillText(data.losses, canvas.width - 209, 385);

		const games = data.wins + data.losses;
		const winrate = (data.wins / games) * 100 + "%";

		context.fillText(winrate, canvas.width - 248, 433);
		context.fillText(data.mvps, canvas.width - 174, 482);
		context.fillText(data.points, canvas.width - 234, 531);

		const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });

		await interaction.editReply({ files: [attachment] }).catch(console.error); return;
	},
};