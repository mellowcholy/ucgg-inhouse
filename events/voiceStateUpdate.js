const { Events } = require("discord.js");

module.exports = {
	name: Events.VoiceStateUpdate,
	execute(oldState, newState) {
		const client = newState.client;
		const person = newState.member.id;

		client.matches.forEach(match => {
			const waitingOn = match.get("waitingOn");
			const players = match.get("players");

			if (waitingOn.length == 0) { return; } // no people left

			if (!players.includes(person)) { return; } // not in the queue

			const playerIndex = waitingOn.indexOf(person);

			// joined match vc
			if (newState.channelId == match.get("waitingRoom").id) {
				if (playerIndex != -1) {
					waitingOn.splice(playerIndex, 1);
				}
			}
			else {
				// left match vc
				waitingOn.push(person);
			}

			// update ping message
			let pingString = "A match is ready. Please join the match voice channel: ";

			waitingOn.forEach(ply => {
				pingString += `<@${ply}> `;
			});

			match.get("waitingRoomPing").edit(pingString);

			if (waitingOn.length == 0) { client.BeginMatch(); }
		});
	},
};