const { ChannelType } = require("discord.js");
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require("@discordjs/voice");
const logError = require("../utility/log-error.js");

const REJOIN_WAIT = 5000;

function playerCount(client) {
	let count = 0;

	for (const players of client.queue.values()) {
		count += players.length;
	}

	return count;
}

function statusText(count) {
	const word = count == 1 ? "player" : "players";
	return `${count} ${word} in queue`;
}

async function updateQueueVoiceStatus(client) {
	const channelId = client.config.queue_voice_channel;
	if (!channelId || client.queue == null) { return; }

	try {
		const status = statusText(playerCount(client));
		await client.rest.put(`/channels/${channelId}/voice-status`, {
			body: { status },
		});
		client.queueVoiceStatusText = status;
	}
	catch (error) {
		logError("Failed to set the queue voice channel status.", error);
	}
}

function bindConnection(connection, client) {
	if (connection.queueVoiceBound) { return; }
	connection.queueVoiceBound = true;

	connection.on("error", (error) => logError("The queue voice connection failed.", error));

	connection.on(VoiceConnectionStatus.Ready, () => {
		updateQueueVoiceStatus(client);
	});

	connection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			await Promise.race([
				entersState(connection, VoiceConnectionStatus.Signalling, REJOIN_WAIT),
				entersState(connection, VoiceConnectionStatus.Connecting, REJOIN_WAIT),
			]);
		}
		catch (error) {
			logError("The queue voice connection dropped. Rejoining.", error);

			if (connection.state.status != VoiceConnectionStatus.Destroyed) {
				connection.destroy();
			}

			client.queueVoiceConnection = null;
			joinQueueVoice(client);
		}
	});
}

async function joinQueueVoice(client) {
	const channelId = client.config.queue_voice_channel;
	if (!channelId) {
		logError("Failed to join the queue voice channel because queue_voice_channel is not set.");
		return;
	}

	const now = Date.now();
	if (now - client.queueVoiceJoinAt < REJOIN_WAIT) { return; }
	client.queueVoiceJoinAt = now;

	try {
		const channel = await client.channels.fetch(channelId);
		if (channel == null || (channel.type != ChannelType.GuildVoice && channel.type != ChannelType.GuildStageVoice)) {
			logError("Failed to join the queue voice channel because that channel is not a voice channel.");
			return;
		}

		const connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
			selfDeaf: true,
			selfMute: true,
		});

		client.queueVoiceConnection = connection;
		bindConnection(connection, client);
	}
	catch (error) {
		logError("Failed to join the queue voice channel.", error);
	}
}

function watchVoiceState(client) {
	client.on("voiceStateUpdate", (_oldState, newState) => {
		if (newState.id != client.user?.id) { return; }

		const channelId = client.config.queue_voice_channel;
		if (!channelId || newState.channelId == channelId) { return; }

		joinQueueVoice(client);
	});
}

module.exports = {
	run(client) {
		client.queueVoiceJoinAt = 0;
		client.updateQueueVoiceStatus = () => updateQueueVoiceStatus(client);
		watchVoiceState(client);
		joinQueueVoice(client);
	},
};
