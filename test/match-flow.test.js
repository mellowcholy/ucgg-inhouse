// How the queue and a match behave today. These pass before any new feature is written,
// which is the evidence that the harness drives the real code correctly.

const assert = require("node:assert/strict");
const { describe, test, beforeEach, afterEach } = require("node:test");
const { createHarness } = require("../test-support/harness.js");

describe("queue and match flow as it works today", () => {
	let h;

	beforeEach(async () => {
		h = await createHarness();
	});

	afterEach(() => h.finish());

	test("joining the queue: MMR must be set, and picking another role moves you", async () => {
		assert.equal(await h.join("newcomer", "Top"), 5, "no MMR set yet");

		await h.seedPlayer("newcomer");
		assert.equal(await h.join("newcomer", "Top"), 1, "joined");
		assert.equal(await h.join("newcomer", "Top"), 0, "already queued for that role");

		assert.equal(await h.join("newcomer", "Mid"), 1, "switched role");
		assert.deepEqual(h.client.queue.get("Top"), []);
		assert.deepEqual(h.client.queue.get("Mid"), ["newcomer"]);
	});

	test("the queue pops when ten players are in", async () => {
		const match = await h.popQueue();

		assert.equal(match.get("number"), 1);
		assert.equal(match.get("players").length, 10);
		assert.equal(h.isQueued("top1"), false, "popped players leave the queue");
		assert.ok(match.get("waitingRoom"), "a match voice channel was made for the ready check");
	});

	test("after the ready check and the wheel vote, teams are posted and the winner vote opens", async () => {
		const match = await h.startMatch();
		const teams = match.get("teams");

		assert.deepEqual([...teams.blueSide.keys()], ["Top", "Jungle", "Mid", "Bot", "Support"]);
		assert.deepEqual([...teams.redSide.keys()], ["Top", "Jungle", "Mid", "Bot", "Support"]);
		assert.ok(h.client.buttons.has("winnervoteblue_1"));
		assert.ok(h.client.buttons.has("winnervotered_1"));
	});

	test("a player in a live match is turned away from the queue", async () => {
		await h.startMatch();

		assert.equal(await h.join("top1", "Top"), 6, "in a match that is still going");
		assert.equal(h.isQueued("top1"), false);
	});

	test("an unanswered ready check cancels the match after three minutes", async () => {
		const match = await h.popQueue();

		await h.advance(3);

		assert.equal(h.client.matches.size, 0);
		assert.equal(match.get("textChannel").deleted, true);
		assert.equal(h.isQueued("top1"), false, "today the ten players are not put back in the queue");
	});

	// The live bot runs without the GuildMembers intent, so a player is often missing from its member
	// cache. It cannot give that player the match role or move them between voice channels, but the
	// match has to carry on for everyone else.
	test("a match still starts when a player is missing from the bot's member cache", async () => {
		h.finish();
		h = await createHarness({ uncachedMembers: ["top1"] });

		const match = await h.startMatch();

		assert.ok(match.get("players").includes("top1"));
		assert.ok(h.client.buttons.has("winnervoteblue_1"), "the winner vote opened");

		const teamChannels = [match.get("blueVc"), match.get("redVc")];
		const top2Channel = h.guild.members.cache.get("top2").voiceChannel;
		assert.ok(teamChannels.includes(top2Channel), "cached players are still moved to their team channel");
	});

	test("enough winner votes finish the match, record the result and free the players", async () => {
		const match = await h.startMatch();
		const blueTop = Object.keys(match.get("teams").blueSide.get("Top"))[0];

		for (const id of match.get("players").slice(0, h.config.winner_vote)) {
			await h.voteWinner(match, id, "blue");
		}

		assert.equal(h.client.matches.size, 0);
		assert.equal((await h.client.LoadPlayer(blueTop)).wins, 1);
		assert.equal(await h.join("top1", "Top"), 1);
	});
});
