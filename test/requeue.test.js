// Spec for "requeue after voting": a player who has voted for a winner may join the queue again
// once their match has been under way for a while, without waiting for everyone else to vote.
//
// What the spec relies on:
//   - the match clock starts when the wheel vote resolves and teams are posted
//     (wheelResult in inhouse/matches.js). That is before lobby setup and champion select, on purpose.
//   - the wait comes from config.requeue_after_minutes, and is 15 when that key is missing
//   - a vote counts whenever it was cast. The bot cannot see the game, so the wait stands in for
//     "the shortest a game could be", and an early vote is accepted once the wait has passed.
// It checks results at 14 and 16 minutes, so it does not care whether exactly 15:00 counts.

const assert = require("node:assert/strict");
const { describe, test, beforeEach, afterEach } = require("node:test");
const { createHarness } = require("../test-support/harness.js");

// Nine newcomers who, with one player already queued for Top, make a full lobby.
const NINE_MORE = [
	["new-top", "Top"],
	["new-jungle1", "Jungle"], ["new-jungle2", "Jungle"],
	["new-mid1", "Mid"], ["new-mid2", "Mid"],
	["new-bot1", "Bot"], ["new-bot2", "Bot"],
	["new-support1", "Support"], ["new-support2", "Support"],
];

describe("requeue after voting", () => {
	let h;

	beforeEach(async () => {
		h = await createHarness();
	});

	afterEach(() => h.finish());

	test("a player who has voted can queue again once the match is over 15 minutes old", async () => {
		const match = await h.startMatch();

		await h.advance(16);
		await h.voteWinner(match, "top1", "blue");

		assert.equal(await h.join("top1", "Top"), 1);
		assert.equal(h.isQueued("top1"), true);
		assert.equal(h.client.matches.size, 1, "the match stays open for everyone else's votes");
	});

	test("a vote for either side counts", async () => {
		const match = await h.startMatch();

		await h.advance(16);
		await h.voteWinner(match, "top1", "blue");
		await h.voteWinner(match, "mid2", "red");

		assert.equal(await h.join("top1", "Top"), 1);
		assert.equal(await h.join("mid2", "Mid"), 1);
	});

	test("a vote cast early counts once the wait has passed", async () => {
		const match = await h.startMatch();

		await h.advance(1);
		await h.voteWinner(match, "top1", "blue");
		assert.notEqual(await h.join("top1", "Top"), 1, "1 minute in is too early");

		await h.advance(15);
		assert.equal(await h.join("top1", "Top"), 1, "16 minutes in, the early vote is enough");
	});

	// The live config.json has no requeue_after_minutes yet, so this default is what production runs.
	test("with no requeue_after_minutes in the config, the wait is 15 minutes", async () => {
		assert.equal(h.config.requeue_after_minutes, undefined, "the harness must not supply the key by default");
		const match = await h.startMatch();
		await h.voteWinner(match, "top1", "blue");

		await h.advance(14);
		assert.notEqual(await h.join("top1", "Top"), 1, "14 minutes in is too early");

		await h.advance(2);
		assert.equal(await h.join("top1", "Top"), 1, "16 minutes in is long enough");
	});

	test("the wait comes from config.requeue_after_minutes", async () => {
		h.finish();
		h = await createHarness({ config: { requeue_after_minutes: 5 } });
		const match = await h.startMatch();

		await h.advance(4);
		await h.voteWinner(match, "top1", "blue");
		assert.notEqual(await h.join("top1", "Top"), 1, "4 minutes in is too early");

		await h.advance(2);
		assert.equal(await h.join("top1", "Top"), 1, "6 minutes in is long enough");
	});

	// A requeued player is still in their old match, so the usual queue rules have to keep applying:
	// clicking the same role again changes nothing, and clicking another role moves them.
	test("a requeued player takes one queue slot, however often they click", async () => {
		const match = await h.startMatch();
		await h.advance(16);
		await h.voteWinner(match, "top1", "blue");

		assert.equal(await h.join("top1", "Top"), 1, "joined");
		assert.equal(await h.join("top1", "Top"), 0, "already queued for that role");
		assert.deepEqual(h.client.queue.get("Top"), ["top1"]);

		assert.equal(await h.join("top1", "Mid"), 1, "switched role");
		assert.deepEqual(h.client.queue.get("Top"), []);
		assert.deepEqual(h.client.queue.get("Mid"), ["top1"]);
	});

	test("a player who has not voted stays locked out, however long the match has run", async () => {
		await h.startMatch();

		await h.advance(60);

		assert.notEqual(await h.join("top1", "Top"), 1);
		assert.equal(h.isQueued("top1"), false);
	});

	test("voting does not unlock the queue before the wait is up", async () => {
		const match = await h.startMatch();

		await h.advance(14);
		await h.voteWinner(match, "top1", "blue");

		assert.notEqual(await h.join("top1", "Top"), 1);
		assert.equal(h.isQueued("top1"), false);
	});

	// What a player is told when they are turned away. Before the wait is up the game is assumed to
	// be still going, so the reply only says they are in a match. After it, the one thing keeping
	// them out is their own missing vote, so the reply tells them to vote.
	test("before the wait is up, the reply only says they are still in a match", async () => {
		const match = await h.startMatch();
		await h.advance(5);

		const beforeVoting = await h.clickJoin("top1", "Top");
		assert.match(beforeVoting, /still in a match/i);
		assert.doesNotMatch(beforeVoting, /vote/i);

		await h.voteWinner(match, "top1", "blue");

		const afterVoting = await h.clickJoin("top1", "Top");
		assert.match(afterVoting, /still in a match/i);
		assert.doesNotMatch(afterVoting, /vote/i, "they have voted, so asking them to vote would be wrong");
	});

	test("after the wait, a player who has not voted is told to vote", async () => {
		await h.startMatch();
		await h.advance(16);

		assert.match(await h.clickJoin("top1", "Top"), /make sure you have voted for the winner/i);
		assert.equal(h.isQueued("top1"), false);
	});

	test("someone else's vote does not unlock you", async () => {
		const match = await h.startMatch();

		await h.advance(16);
		await h.voteWinner(match, "top2", "blue");

		assert.notEqual(await h.join("top1", "Top"), 1);
		assert.equal(h.isQueued("top1"), false);
	});

	// Before teams are posted there are no winner votes and no start time on the match.
	// The queue check must treat that as "still in the match", and must not throw.
	test("players are locked out while the match is still in the ready check or the wheel vote", async () => {
		const match = await h.popQueue();
		assert.notEqual(await h.join("top1", "Top"), 1, "during the ready check");

		await h.readyUp(match);
		assert.notEqual(await h.join("top1", "Top"), 1, "during the wheel vote");

		assert.equal(h.isQueued("top1"), false);
	});

	// A requeued player can be in two matches at once, so one match waving them
	// through must not stop the other one from holding them.
	test("a requeued player who lands in a second match is held by that one", async () => {
		const first = await h.startMatch();
		await h.advance(16);
		await h.voteWinner(first, "top1", "blue");
		assert.equal(await h.join("top1", "Top"), 1);

		const second = await h.popQueue(NINE_MORE);
		assert.ok(second.get("players").includes("top1"));
		assert.equal(h.client.matches.size, 2);

		assert.notEqual(await h.join("top1", "Fill"), 1);
		assert.equal(h.isQueued("top1"), false);
	});
});
