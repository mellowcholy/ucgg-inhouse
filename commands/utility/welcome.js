const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("welcome")
		.setDescription("Welcome a new user to inhouses.")
		.addUserOption((option) => option.setName("target").setDescription("The member to message.").setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		const target = interaction.options.getUser("target");

		await interaction.reply(`Hello <@${target.id}>, and welcome to UCGGLoL inhouses!

**Before you can play, please leave a message with your username#tag/op.gg/rank, and ping the moderators.** This well help balance the queue out for everyone.
Also, if you believe you have differing levels of skills for different roles, contact a moderator and they will help sort it out for you!
-# e.g. I play like a Diamond 4 on ADC but Emerald 2 on Midlane.

Furthermore, make sure to check out the in-house and server rules: https://discord.com/channels/1075695611812261919/1278077121801097337

We hope you enjoy your stay, and we'll see you on summoner's rift!`).catch(console.error);
		return;
	},
};