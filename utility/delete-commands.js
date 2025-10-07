const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('../config.json');

const rest = new REST().setToken(token);

const commandID = "1424652434197843998";

// for guild-based commands
rest
	.delete(Routes.applicationGuildCommand(clientId, guildId, commandID))
	.then(() => console.log('Successfully deleted guild command'))
	.catch(console.error);

// for global commands

/*
rest
	.delete(Routes.applicationCommand(clientId, commandID))
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);*/