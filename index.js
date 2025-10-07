// Require the necessary discord.js classes
const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, MessageFlags } = require('discord.js');
const { token } = require('./config.json');

// create client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// load commands
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// load panels
client.panels = new Collection();

const panelsPath = path.join(__dirname, 'panels');
const panelsFiles = fs.readdirSync(panelsPath).filter((file) => file.endsWith('.js'));

for (const file of panelsFiles) {
	const filePath = path.join(panelsPath, file);
	const panel = require(filePath);

	client.panels.set(panel.name, panel.getContainer);
}

// load buttons
client.buttons = new Collection();

const buttonsPath = path.join(__dirname, 'buttons');
const buttonsFiles = fs.readdirSync(buttonsPath).filter((file) => file.endsWith('.js'));

for (const file of buttonsFiles) {
	const filePath = path.join(buttonsPath, file);
	const button = require(filePath);

	client.buttons.set(button.name, button);
}

// load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// handle cooldowns
client.cooldowns = new Collection();

// random other functions
client.RefreshInHousePost = function() {
	const channel = client.channels.cache.get("1424956618361147432");

	if (client.latestInhousePost != null) {
		client.latestInhousePost.delete();
	}

	channel.send({
		components: [client.panels.get("In-House Queue")(client)],
		flags: MessageFlags.IsComponentsV2,
		allowedMentions: { parse: [] },
	}).then(msg => client.latestInhousePost = msg);
};

client.JoinQueue = function(userId, position) {
	const queue = client.queue;
	const queuePos = queue.get(position);

	for (const key of queue.keys()) {
		const currentQueue = queue.get(key);
		const isUserId = (v) => v == userId;
		const found = currentQueue.findIndex(isUserId);

		if (found == -1) { continue; }
		if (key == position) { return 0; } // you are already queing for this role

		currentQueue.splice(found, 1);
	}

	queuePos.push(userId);
	return 1;
};

// login
client.login(token);