const { AttachmentBuilder } = require("discord.js");
const Canvas = require('@napi-rs/canvas');
const { request } = require('undici');

let background;
(async () => {
	background = await Canvas.loadImage('./img/profiles/champions/renekton.png');
})();


module.exports = {
	async create(target, data) {
		const { body } = await request(target.displayAvatarURL({ extension: 'jpg' }));
		const avatar = await Canvas.loadImage(await body.arrayBuffer());

		const canvas = Canvas.createCanvas(825, 620);
		const context = canvas.getContext("2d", { alpha: false });

		context.drawImage(background, 0, 0, canvas.width, canvas.height);

		// name
		context.font = 'bold 48px Bahnschrift';
		context.fillStyle = '#1e1d1b';
		context.fillText(target.displayName, 236, 129);

		// role mmr
		context.font = '36px Bahnschrift';
		context.fillStyle = '#464542';

		let mmrHeight = 341;

		for (const k of Object.keys(data.mmrs)) {
			context.fillText(data.mmrs[k], 154, mmrHeight);

			mmrHeight += 51;
		}

		// other stats
		context.fillText(data.wins, 578, 341);
		context.fillText(data.losses, 578, 392);

		const games = data.wins + data.losses;
		const winrate = Math.round((data.wins / games) * 100) + "%";

		context.fillText(winrate, 578, 443);
		context.fillText(data.mvps, 578, 494);
		context.fillText(data.points, 578, 545);

		// avatar
		context.beginPath();
		context.arc(129, 118, 76, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();
		context.drawImage(avatar, 53, 41, 152, 152);

		const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });

		return attachment;
	},
};