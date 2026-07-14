# Floor 1 Playtest Mode

## Purpose

Playtest mode is for evaluating whether Floor 1 is understandable, engaging, well paced, and meaningfully reactive before permanent art production or Floor 2 development.

It is not a student analytics platform. It stores no names, accounts, class identifiers, or remote data.

## Launch

Add `?playtest` to the game URL.

Example:

```text
https://example.com/wrs-quest/?playtest
```

Playtest mode can also be enabled in the browser console:

```js
localStorage.setItem('wrs-quest-playtest-mode', 'true');
location.reload();
```

Disable it with:

```js
localStorage.removeItem('wrs-quest-playtest-mode');
location.reload();
```

A yellow **PLAYTEST MODE** badge appears whenever tracking is active.

## Data recorded locally

- session identifier
- start and finish time
- viewport size and browser user-agent string
- time spent on each game screen
- button and choice interactions
- success or failure feedback associated with challenge choices
- promotion result
- player ratings for fun, clarity, and pace
- whether the player noticed earlier decisions changing later gameplay
- optional written feedback

No data is transmitted automatically.

## End-of-floor Playtest Lab

The performance-review screen adds a Playtest Lab with:

- three 1–5 ratings
- one consequence-visibility question
- optional written feedback
- **Save Feedback** to retain the session in browser storage
- **Copy Summary** for a readable report
- **Export JSON** for detailed analysis

The browser retains up to 20 recent saved playtest sessions.

## Recommended test procedure

1. Give players no explanation beyond: “Play the first floor and try to earn a promotion.”
2. Do not coach decisions unless the game becomes unusable.
3. Record whether the player asks what XP, Trust, Credits, Time Bank, or allies mean.
4. Observe where the player pauses for more than 10 seconds.
5. Observe whether the player notices that early decisions alter challenge time, hints, allies, or routes.
6. Have the player complete the Playtest Lab immediately after the performance review.
7. Export the JSON report only with the player’s knowledge.

## Questions the first playtest must answer

- Is the game fun before considering its educational value?
- Do workplace decisions feel like gameplay rather than quiz questions?
- Are the consequences understandable without teacher explanation?
- Is Inbox Zero tense but fair?
- Does Elevator Escape feel like a climax?
- Does earning or missing promotion feel justified?
- Is the current procedural character art sufficient for the next prototype, or is permanent art now the largest weakness?
- Is Floor 1 short enough for classroom use without feeling shallow?

## Decision gate before Floor 2

Do not begin Floor 2 until the playtest shows:

- average fun rating of at least 4/5
- average clarity rating of at least 4/5
- most players answer **Yes** to noticing later gameplay consequences
- no repeated navigation blocker
- no repeated misunderstanding of the promotion requirements
- completion time generally remains within 10–15 minutes
