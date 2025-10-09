const { Collection } = require("discord.js");

module.exports = {
	run(client) {
		client.matches = new Array();

		client.BeginMatch = function(match) {
			console.log("let the games begin");

			BalanceTeams(match);
		};

		const mmrs = new Collection([
			["default", new Collection([
				["Top", 1000],
				["Jungle", 1000],
				["Mid", 1000],
				["Bot", 1000],
				["Support", 1000],
			])],
			["259167676902014987", new Collection([
				["Top", 500],
				["Jungle", 1000],
				["Mid", 2000],
				["Bot", 1361],
				["Support", 2000],
			])],
			["1", new Collection([
				["Top", 2350],
				["Jungle", 1000],
				["Mid", 2000],
				["Bot", 2400],
				["Support", 2000],
			])],
			["2", new Collection([
				["Top", 2456],
				["Jungle", 1000],
				["Mid", 2000],
				["Bot", 2400],
				["Support", 2000],
			])],
			["3", new Collection([
				["Top", 500],
				["Jungle", 2106],
				["Mid", 2000],
				["Bot", 2400],
				["Support", 2000],
			])],
			["4", new Collection([
				["Top", 500],
				["Jungle", 2292],
				["Mid", 2000],
				["Bot", 2400],
				["Support", 2000],
			])],
			["5", new Collection([
				["Top", 500],
				["Jungle", 1000],
				["Mid", 2721],
				["Bot", 2400],
				["Support", 2000],
			])],
			["6", new Collection([
				["Top", 500],
				["Jungle", 1000],
				["Mid", 2000],
				["Bot", 1332],
				["Support", 2000],
			])],
			["7", new Collection([
				["Top", 500],
				["Jungle", 1000],
				["Mid", 2000],
				["Bot", 2400],
				["Support", 1477],
			])],
			["8", new Collection([
				["Top", 500],
				["Jungle", 1000],
				["Mid", 2000],
				["Bot", 2400],
				["Support", 618],
			])],
			["9", new Collection([
				["Top", 500],
				["Jungle", 1000],
				["Mid", 2183],
				["Bot", 2400],
				["Support", 2000],
			])],
		]);

		function BalanceTeams(match) {

			const players = match.get("positions");
			const trials = 500;

			const playerMMR = new Collection();

			// assign mmrs
			for (const [k, v] of players) {
				playerMMR.set(k, new Array());
				const role = playerMMR.get(k);

				v.forEach(player => {
					const plyMMR = mmrs.get(player) || mmrs.get("default");
					const mmr = k == "Fill" ? plyMMR : plyMMR.get(k);

					role.push({ [player]: mmr });
				});
			}

			function PickBestFill(role, fill) {
				let best = 0;
				const names = new Array();

				fill.forEach(obj => {
					for (const key of Object.entries(obj)) {
						names.push(key[0]);
					}
				});

				for (let i = 1; i < fill.length; i++) {

					if (fill[i][names[i]].get(role) > fill[best][names[best]].get(role)) {
						best = i;
					}
				}

				const chosen = fill.splice(best, 1)[0];

				return { [names[best]]: chosen[names[best]].get(role) };
			}

			function MakeTeams() {
				const fill = [...playerMMR.get("Fill")];
				const rolePairs = new Collection();

				// fill missing roles
				for (const [role, rolePlayers] of playerMMR) {
					if (role == "Fill") { continue; }

					const pair = (rolePlayers);

					while (rolePlayers.length < 2) {
						const fillPlayer = PickBestFill(role, fill);
						pair.push(fillPlayer);
					}

					rolePairs[role] = pair;
				}

				// random assignment per role
				const blueSide = new Collection();
				const redSide = new Collection();

				let totalBlue = 0;
				let totalRed = 0;

				for (const [role] of playerMMR) {
					if (role == "Fill") { continue; }

					const [p1, p2] = rolePairs[role];

					if (Math.random() < 0.5) {
						blueSide.set(role, p1);
						redSide.set(role, p2);
					}
					else {
						blueSide.set(role, p2);
						redSide.set(role, p1);
					}

					totalBlue += Object.values(blueSide.get(role))[0];
					totalRed += Object.values(redSide.get(role))[0];
				}

				// greedy balancing swaps
				for (const [role] of playerMMR) {
					if (role == "Fill") { continue; }

					const a = Object.values(blueSide.get(role))[0];
					const b = Object.values(redSide.get(role))[0];

					const diffBefore = Math.abs(totalBlue - totalRed);
					const newBlue = totalBlue - a + b;
					const newRed = totalRed - b + a;
					const diffAfter = Math.abs(newBlue, newRed);

					if (diffAfter < diffBefore) {
						const swap = blueSide.get(role);

						blueSide.set(role, redSide.get(role));
						redSide.set(role, swap);

						totalBlue = newBlue;
						totalRed = newRed;
					}
				}

				return {
					blueSide,
					redSide,
					avgBlue: totalBlue / 5,
					avgRed: totalRed / 5,
					diff: Math.abs(totalBlue - totalRed),
				};
			}

			// run multiple simulations and pick the best
			let best = null;
			for (let i = 0; i < trials; i++) {
				const result = MakeTeams();

				if (!best || result.diff < best.diff) {
					best = result;
					if (best.diff == 0) { break; }
				}
			}

			console.log(best);

			return best;
		}
	},
};