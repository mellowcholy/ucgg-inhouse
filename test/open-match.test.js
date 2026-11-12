// Opening a match safely.
//
// OpenMatch (inhouse/queue.js) takes ten players out of the queue and then spends a moment talking
// to Discord: a text channel, the ready ping, a voice channel, a role. These tests cover what the
// rest of the bot can see and do during that moment, and what happens if Discord lets it down.
//
// The first test is the gap that has been seen on the live bot. The other three are things that
// must keep working whichever way that gap is closed.

const assert = require("node:assert/strict");
const { describe, test, beforeEach, afterEach } = require("node:test");
const { createHarness, DEFAULT_LOBBY } = require("../test-support/harness.js");

describe("while a match is being opened", () => {
	let h;

	beforeEach(async () => {
		h = await createHarness();
	});

	afterEach(() => h.finish());

	test("a player being placed in a match cannot join the queue again", async () => {
		const release = h.holdChannelCreation();
		await h.fillQueue();
		assert.equal(h.isQueued("top1"), false, "the queue has popped and its players have left it");

		assert.notEqual(await h.join("top1", "Top"), 1, "joining again while the match is being opened");
		assert.doesNotMatch(await h.clickJoin("top1", "Top"), /vote/i, "there is nothing to vote on yet");
		assert.equal(h.isQueued("top1"), false);

		await release();

		assert.equal(h.client.matches.size, 1, "the match opens as normal once Discord answers");
		assert.notEqual(await h.join("top1", "Top"), 1, "and then holds the player like any other match");
	});

	// Discord sends a voice-state event whenever a member mutes, deafens, streams or changes channel,
	// so one arriving from a player in this half-second is ordinary. On the live bot nothing catches
	// an error thrown by that event handler, so throwing here would stop the whole bot.
	test("a voice update from one of its players does not throw", async () => {
		const release = h.holdChannelCreation({ letThrough: 1 });
		await h.fillQueue();

		assert.doesNotThrow(() => h.voiceUpdate("top1", "some-other-voice-channel"));

		await release();

		const match = h.client.matches.first();
		await h.readyUp(match);
		assert.ok(match.get("teams"), "and the ready check still works afterwards");
	});

	// Channel creation can fail: Discord is down, the category is full, a permission is missing.
	// The match cannot open, and its players must not be left stuck "in a match" that does not exist.
	test("if Discord fails, the players can queue again", async () => {
		h.failNextChannelCreation();
		await h.fillQueue();
		assert.match(h.takeLoggedErrors(), /Failed to open a match lobby/);

		await h.join("top1", "Top");

		assert.equal(h.isQueued("top1"), true);
	});

	// The queue pops on the tenth join. Whatever else happens in the next instant, the match that
	// opens must contain the ten players who were in the queue at that point.
	test("a player who clicks Leave just after the pop is still in the match", async () => {
		const [lastId, lastRole] = DEFAULT_LOBBY[9];
		await h.fillQueue(DEFAULT_LOBBY.slice(0, 9));
		await h.seedPlayer(lastId);

		assert.equal(await h.client.JoinQueue(lastId, lastRole), 1, "the tenth join, which pops the queue");
		h.client.LeaveQueue("top1");
		await h.settle();

		const match = h.client.matches.first();
		assert.equal(match.get("players").length, 10);
		assert.ok(match.get("players").includes("top1"));
	});
});
