const { Events } = require("discord.js");

module.exports = {
	name: Events.VoiceStateUpdate,
	execute(_, newState) {
		const client = newState.client;
		const person = newState.member.id;

		client.matches.forEach(match => {
			const waitingOn = match.get("waitingOn");
			const waitingRoomPing = match.get("waitingRoomPing");
			const players = match.get("players");

			if (waitingOn == null || waitingRoomPing == null) { return; }
			if (waitingOn.length == 0) { return; } // no people left

			if (!players.includes(person)) { return; } // not in the queue

			const playerIndex = waitingOn.indexOf(person);

			// joined match vc
			if (newState.channelId == match.get("waitingRoom").id) {
				if (playerIndex != -1) {
					waitingOn.splice(playerIndex, 1);
				}
			}
			else if (playerIndex == -1) {
				// left match vc
				waitingOn.push(person);
			}

			// update ping message
			let pingString = "A match is ready. Please join the match voice channel: ";

			waitingOn.forEach(ply => {
				pingString += `<@${ply}> `;
			});

			waitingRoomPing.edit(pingString).catch(error => console.error(error));

			if (waitingOn.length == 9) { client.BeginMatch(match); }
		});
	},
};