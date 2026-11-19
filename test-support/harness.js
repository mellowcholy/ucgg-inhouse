// An in-memory stand-in for Discord, so the real queue and match code can run under `node --test`
// with no bot token, no server and no network.
//
// It wires up a fake client the way index.js and events/ready.js wire up the real one, then drives
// the bot through the same doors Discord uses: client.JoinQueue, the voiceStateUpdate event, and the
// button handlers that the panels register in client.buttons. Nothing in here knows about any one
// feature, and none of the bot's own logic is replaced.
//
// If the wiring in index.js or events/ready.js changes, mirror it in createHarness().
//
// This file lives outside test/ on purpose: `node --test` treats every .js file under test/ as a
// test file, and keeping the harness out of there lets `npm test` run with no file pattern.

const assert = require("node:assert/strict");
const { format } = require("node:util");
const { mock } = require("node:test");
const { Keyv } = require("keyv");
const { Collection } = require("discord.js");

const databaseManager = require("../database_manager.js");
const queue = require("../inhouse/queue.js");
const matches = require("../inhouse/matches.js");
const voiceStateUpdate = require("../events/voiceStateUpdate.js");

const PANEL_FILES = ["queue.js", "votewheel.js", "modifiervote.js", "teamsvotewinner.js", "results.js"];
const ROLES = ["Top", "Jungle", "Mid", "Bot", "Support"];

// Test values, not the live ones (config.json is not in the repo).
// Tests can override any of these: createHarness({ config: { winner_vote: 3 } }).
const BASE_CONFIG = {
	inhouse_channel: "inhouse-channel",
	inhouse_category: "inhouse-category",
	results_channel: "results-channel",
	feedback_channel: "feedback-channel",
	// how many players may still be missing from the match voice channel for the ready check to pass
	waiting_on: 0,
	wheel_vote_yes: 6,
	// one "no" skips the wheel, so tests reach the game quickly
	wheel_vote_no: 1,
	modifier_vote: 4,
	winner_vote: 6,
	points_win: 10,
	points_loss: 5,
	mmr_gain: 20,
	mmr_loss: 20,
	// requeue_after_minutes is left out on purpose. The live config.json does not have it yet, so the
	// bot's built-in default is what runs in production, and leaving it out here means the tests run
	// that default too. A test that wants another value passes it: createHarness({ config: { ... } }).
};

// Two players per role, the simplest lobby that pops the queue.
const DEFAULT_LOBBY = ROLES.flatMap((role) => [
	[`${role.toLowerCase()}1`, role],
	[`${role.toLowerCase()}2`, role],
]);

// A Wednesday, so the weekend credit boost never changes a result.
const CLOCK_START = Date.UTC(2026, 0, 7, 12);

let nextId = 1;

function fakeMessage(channel, payload) {
	const message = {
		id: `message-${nextId++}`,
		channel,
		payload,
		author: { id: "bot" },
		createdTimestamp: Date.now(),
		deleted: false,
		edit: async (newPayload) => {
			message.payload = newPayload;
			return message;
		},
		delete: async () => {
			message.deleted = true;
			return message;
		},
	};

	channel.sent.push(message);
	return message;
}

function fakeChannel(name, guild) {
	const channel = {
		id: `channel-${nextId++}`,
		name,
		guild,
		deleted: false,
		// every message the bot posted here, oldest first
		sent: [],
		send: async (payload) => fakeMessage(channel, payload),
		delete: async () => {
			channel.deleted = true;
			return channel;
		},
		messages: {
			// like Discord, fetching a message that is gone rejects
			fetch: async (query) => {
				if (typeof query !== "string") {
					return new Collection(channel.sent.filter((m) => !m.deleted).map((m) => [m.id, m]));
				}

				const found = channel.sent.find((m) => m.id == query && !m.deleted);
				if (!found) { throw new Error("Unknown Message"); }
				return found;
			},
		},
	};

	return channel;
}

// uncachedMembers: ids the member cache has never seen. The real bot runs without the GuildMembers
// intent, so its cache often has no entry for a player, and the bot has to cope with that.
function fakeGuild(uncachedMembers) {
	const members = new Map();

	const guild = {
		id: "guild",
		channels: {
			created: [],
			// Set by holdChannelCreation(): { promise, letThrough }. Creating a channel waits for the
			// promise, after the first `letThrough` creations have gone through as normal.
			hold: null,
			// Set by failNextChannelCreation(): the next creation rejects, as a Discord outage would.
			failNext: false,
			create: async ({ name }) => {
				if (guild.channels.failNext) {
					guild.channels.failNext = false;
					throw new Error("Discord is unavailable");
				}

				const hold = guild.channels.hold;
				if (hold != null) {
					if (hold.letThrough > 0) { hold.letThrough--; }
					else { await hold.promise; }
				}

				const channel = fakeChannel(name, guild);
				guild.channels.created.push(channel);
				return channel;
			},
		},
		roles: {
			create: async ({ name }) => ({ id: `role-${nextId++}`, name, delete: async () => null }),
		},
		members: {
			cache: {
				get: (id) => {
					if (uncachedMembers.includes(id)) { return undefined; }

					if (!members.has(id)) {
						const member = {
							id,
							voiceChannel: null,
							roles: { add: async () => member },
							voice: {
								setChannel: async (channel) => {
									member.voiceChannel = channel;
									return member;
								},
							},
						};
						members.set(id, member);
					}

					return members.get(id);
				},
			},
		},
	};

	return guild;
}

// Lets everything the bot kicked off (promises it did not await) run to completion.
// setImmediate is deliberately left real when the clock is faked, so this still works.
async function settle(turns = 10) {
	for (let i = 0; i < turns; i++) {
		await new Promise((resolve) => setImmediate(resolve));
	}
}

async function createHarness({ config = {}, uncachedMembers = [] } = {}) {
	// The clock is fake: timers only fire, and Date.now() only moves, when a test calls advance().
	mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"], now: CLOCK_START });

	// The bot reports most failures through utility/log-error.js (console.error) and carries on.
	// Collect them, so a swallowed error fails the test instead of passing unnoticed.
	const errors = [];
	const consoleError = mock.method(console, "error", (...args) => {
		errors.push(format(...args));
	});

	// What the bot logged, as text for a failure message. The bot often catches an error, logs it
	// and stops part-way, so the logged error is usually the real cause of whatever the test saw.
	function loggedErrors() {
		if (errors.length == 0) { return ""; }
		return `\n\nThe bot logged this, which is the likely cause:\n${errors.join("\n")}`;
	}

	async function waitFor(check, description) {
		for (let i = 0; i < 100; i++) {
			const value = check();
			if (value) { return value; }
			await settle(1);
		}

		assert.fail(`Timed out waiting for ${description}.${loggedErrors()}`);
	}

	const guild = fakeGuild(uncachedMembers);

	const client = {
		config: { ...BASE_CONFIG, ...config },
		// in-memory, and like the real store it hands back a fresh copy on every read
		keyv: new Keyv(),
		panels: new Collection(),
		buttons: new Collection(),
		spamQueue: new Collection(),
		randomQuotes: ["test quote"],
		user: { id: "bot", setActivity: () => null },
		users: {
			cache: new Collection(),
			fetch: async (id) => ({ id, send: async () => null }),
		},
		channels: { cache: new Collection() },
	};

	client.channels.cache.set(client.config.inhouse_category, { id: client.config.inhouse_category, guild });
	client.channels.cache.set(client.config.inhouse_channel, fakeChannel("inhouse", guild));
	client.channels.cache.set(client.config.results_channel, fakeChannel("results", guild));

	// same as index.js
	client.enqueue = function(key, task) {
		const prev = client.spamQueue.get(key) || Promise.resolve();
		const next = prev.finally(() => task());
		client.spamQueue.set(key, next);
		return next;
	};

	databaseManager.run(client);

	for (const file of PANEL_FILES) {
		const panel = require(`../panels/${file}`);
		client.panels.set(panel.name, panel.getContainer);
	}

	// same order as events/ready.js
	queue.run(client);
	matches.run(client);

	// The queue panel registers its Join and Leave buttons when it is drawn. The real bot draws it
	// on startup, so draw it once here too.
	await client.panels.get("In-House Queue")(client);

	// Gives a player an MMR in every role. The queue turns away anyone whose MMR is unset.
	async function seedPlayer(id, mmr = 1200) {
		const data = await client.LoadPlayer(id);
		if (data.mmrs.Top != 0) { return data; }

		for (const role of ROLES) { data.mmrs[role] = mmr; }
		await client.SavePlayer(id, data);
		return data;
	}

	// The same call the queue panel's buttons make. Returns JoinQueue's result code:
	// 0 already in that role, 1 joined, 2 in a match that looks finished but they have not voted,
	// 3 banned, 4 timed ban, 5 MMR not set, 6 in a match that is still going or still being set up.
	async function join(id, role) {
		const result = await client.JoinQueue(id, role);
		await settle();
		return result;
	}

	// Clicks a Join button on the queue panel as a user, and returns the reply they see.
	// role is one of ROLES, or "Fill".
	function clickJoin(id, role) {
		return press(`join${role}`, id);
	}

	function isQueued(id) {
		return [...client.queue.values()].some((players) => players.includes(id));
	}

	// Presses a button as a user and returns what the bot replied to them.
	// Button ids are whatever the panels registered, e.g. "winnervoteblue_1".
	async function press(customId, userId) {
		const handler = client.buttons.get(customId);
		assert.ok(handler, `No handler is registered for the button "${customId}".`);

		const replies = [];
		const reply = async (payload) => {
			replies.push(payload.content);
		};

		await handler({ customId, client, user: { id: userId }, reply, followUp: reply });
		await settle();

		return replies.join("\n");
	}

	// Seeds and queues the given [id, role] pairs, and does not wait for a match to come of it.
	// Anyone already queued counts towards the ten.
	async function fillQueue(entries = DEFAULT_LOBBY) {
		for (const [id, role] of entries) {
			await seedPlayer(id);
			const result = await client.JoinQueue(id, role);
			assert.equal(result, 1, `${id} could not join ${role} (JoinQueue returned ${result}).`);
		}

		await settle();
	}

	// Fills the queue, then waits for the match it opens.
	async function popQueue(entries = DEFAULT_LOBBY) {
		const known = new Set(client.matches.keys());

		await fillQueue(entries);

		return waitFor(() => client.matches.find((match) => !known.has(match.get("number"))), "the queue to pop");
	}

	// Freezes the bot part-way through opening a match, at a channel creation, until the function
	// this gives back is called. On the live bot the same pause is just network time.
	//
	// Opening a match creates the text channel first, posts the ready ping in it, then creates the
	// voice channel. letThrough: 0 freezes before the text channel exists; letThrough: 1 freezes
	// after the ping has gone out but before the voice channel exists.
	function holdChannelCreation({ letThrough = 0 } = {}) {
		let open;
		const promise = new Promise((resolve) => {
			open = resolve;
		});
		guild.channels.hold = { promise, letThrough };

		return async function release() {
			guild.channels.hold = null;
			open();
			await settle();
		};
	}

	// Makes the next channel creation fail, as it would if Discord were down or the category were full.
	// The bot logs that failure, so the test should collect it with takeLoggedErrors().
	function failNextChannelCreation() {
		guild.channels.failNext = true;
	}

	// Hands back what the bot has logged so far and forgets it, for tests where an error is expected.
	// Anything logged after this still fails the test in finish().
	function takeLoggedErrors() {
		return errors.splice(0).join("\n");
	}

	// Delivers a voice-state event, as Discord does whenever a member joins, leaves or moves between
	// voice channels, or mutes, deafens or starts streaming. channelId is where they are now.
	function voiceUpdate(userId, channelId) {
		voiceStateUpdate.execute(null, { member: { id: userId }, client, channelId });
	}

	// Every player joins the match voice channel, which passes the ready check:
	// teams get balanced and the wheel vote is posted.
	async function readyUp(match) {
		const waitingRoom = match.get("waitingRoom");

		for (const id of [...match.get("players")]) {
			voiceUpdate(id, waitingRoom.id);
		}

		await waitFor(() => match.get("wheelVoteMsg"), "the wheel vote to be posted");
	}

	// Votes "no" on the wheel until it is skipped. Teams are posted, team voice channels are made
	// and the winner vote opens: from here the game counts as under way.
	async function skipWheel(match) {
		const number = match.get("number");

		for (const id of match.get("players")) {
			if (!match.has("wheelVotesNo")) { break; }
			await press(`wheelvoteno_${number}`, id);
		}

		await waitFor(() => match.get("winnerVoteMsg") && match.get("redVc"), "the winner vote to be posted");
	}

	// Queue pop, ready check and wheel skip in one go. Returns the match, with the game under way.
	async function startMatch(entries = DEFAULT_LOBBY) {
		const match = await popQueue(entries);
		await readyUp(match);
		await skipWheel(match);
		return match;
	}

	// side is "blue" or "red". Returns the bot's reply to the voter.
	function voteWinner(match, userId, side) {
		return press(`winnervote${side}_${match.get("number")}`, userId);
	}

	// Moves the fake clock forward, firing any timers that fall due.
	async function advance(minutes) {
		mock.timers.tick(minutes * 60 * 1000);
		await settle();
	}

	// Call from afterEach. Puts the clock and console back, then fails the test if the bot logged an error.
	function finish() {
		consoleError.mock.restore();
		mock.timers.reset();

		assert.equal(errors.length, 0, `The bot logged errors during this test.${loggedErrors()}`);
	}

	return {
		client,
		config: client.config,
		guild,
		errors,
		seedPlayer,
		join,
		clickJoin,
		isQueued,
		press,
		fillQueue,
		popQueue,
		holdChannelCreation,
		failNextChannelCreation,
		takeLoggedErrors,
		voiceUpdate,
		readyUp,
		skipWheel,
		startMatch,
		voteWinner,
		advance,
		settle,
		finish,
	};
}

module.exports = { createHarness, DEFAULT_LOBBY, ROLES };
