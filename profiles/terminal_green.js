const { AttachmentBuilder } = require("discord.js");
const Canvas = require('@napi-rs/canvas');

let background;
(async () => {
	background = await Canvas.loadImage('./img/profiles/terminal_green.png');
})();

module.exports = {
	async create(target, data) {
		const canvas = Canvas.createCanvas(825, 620);
		const context = canvas.getContext("2d", { alpha: false });

		context.drawImage(background, 0, 0, canvas.width, canvas.height);

		// name
		context.font = '24px Pixel Operator 8';
		context.fillStyle = '#47e34f';
		context.fillText(target.displayName, 182, 55);

		// role mmr
		let mmrHeight = 171;

		for (const k of Object.keys(data.mmrs)) {
			context.fillText(data.mmrs[k], 182, mmrHeight);

			mmrHeight += 28;
		}

		// other stats
		context.fillText(data.wins, 197, 372);
		context.fillText(data.losses, 254, 401);

		const games = data.wins + data.losses;
		const winrate = Math.round((data.wins / games) * 100) + "%";

		context.fillText(winrate, 269, 430);
		context.fillText(data.mvps, 209, 459);
		context.fillText(data.points, 266, 487);

		const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });

		return attachment;
	},
};