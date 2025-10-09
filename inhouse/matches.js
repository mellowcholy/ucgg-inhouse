module.exports = {
	run(client) {
		client.matches = new Array();

		client.BeginMatch = function() {
			console.log("let the games begin");
		};

		function BalanceTeams(match) {
			const players = match.get("positions");
			const trials = 500;

			function MakeTeams() {
				const fill = players.get("Fill");
			}
		}
	},
};