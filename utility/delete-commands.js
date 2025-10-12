const { REST, Routes } = require('discord.js');

require("dotenv/config");
const env = process.env.APP_ENV || "main";
const { clientId, guildId, token } = env === "dev" ? require('../configdev.json') : require('../config.json');

const rest = new REST().setToken(token);


// for guild-based commands
/*
rest
	.delete(Routes.applicationGuildCommand(clientId, guildId, commandID))
	.then(() => console.log('Successfully deleted guild command'))
	.catch(console.error);*/

// for global commands

/*
rest
	.delete(Routes.applicationCommand(clientId, commandID))
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);*/

// for guild-based commands - DELETE ALL
rest
	.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);