# Devpost submission — copy/paste sheet

## Project name (60 chars max)
Playbook

## Elevator pitch (tagline)
Turn any unit into a game you can only win by understanding it. Upload your notes, then crack a case, escape a room, or catch the impostor.

---

## About the project (paste into "About the project" — Markdown)

## Inspiration

I play varsity soccer and take AP Biology. Between practice, college applications, and school, most of my studying is rereading notes the night before a test. The tools that are supposed to make studying fun — Blooket, Gimkit, Kahoot — mostly wrap the same multiple-choice questions in a minigame that has nothing to do with the subject. You answer a question, earn coins, then play something unrelated. Learning researchers have a name for this: *chocolate-covered broccoli*. Students see through it.

I wanted the opposite: a game where **the concept is the mechanic**. You don't answer a question to earn a turn; you catch the culprit, open the lock, or spot the liar *because* you applied the idea.

## What it does

You upload your own notes, slides, or photos of a unit. Playbook builds a **concept map** — the key ideas, where each one shows up in your notes, and the mistakes students usually make — and then generates a game from that exact material:

- **Case Files** — a courtroom game inspired by *Ace Attorney*. Witnesses testify and one line in each testimony is a lie. Press lines for detail and new evidence, then present the evidence that breaks the lie — it only works if you apply the concept. Five lives, points, streaks, and a final verdict where you name the culprit *and* present the proof.
- **Escape Room** — a point-and-click room against a 20-minute clock. Click glowing objects for clues; locks open when you compute, predict, or put a process in order. Every lock drops a fragment into your inventory, and the sealed exit is a final puzzle that combines them.
- **Impostor** — a party game for 3–10 players on their phones. Everyone gets a fact card; one is subtly wrong, built from a real misconception. You read your fact and explain *why* it's true, so the impostor has to bluff a reason. Secret vouching pairs and scoring for misdirection keep it tense.
- **Boss Fight** — your test date becomes a boss. Weak concepts are its shields, correct answers deal damage, and review questions come back on a spaced schedule before test day.

Every game opens with a hook question, has three-step hints that explain the idea but never give the answer, and ends with a debrief that connects what you did to the textbook concept.

**Try it without uploading anything:** the home page has three ready-made AP Biology games.

## How I built it

- **Next.js + TypeScript** on **Vercel**, **Supabase** (Postgres + storage), and **Render Workflows** for the long-running generation jobs (a full game takes 1–3 minutes, longer than a normal serverless request).
- **Claude (Anthropic API)** reads the material, builds the concept map, designs each game as structured data, and reviews it.
- **Quality gates before a student sees a game:**
  1. Rule checks in code — every numeric answer is recomputed from its formula, every choice has feedback for each wrong option, and mode rules hold (every lie in a testimony is disproved by evidence the player already holds, one exit lock fed by every other lock, a fake fact that can't be spotted by its length, and short 8th-grade wording).
  2. An **AI playtester** that independently re-derives every answer, tries to solve puzzles without the concept, and flags anything confusing, unfair, or "quiz in costume." Problems go back to the generator for up to two repair rounds; if a game still fails, it isn't shown.
- **During play, answers are checked in code, never by AI.** Answer keys, which line is the lie, and locked evidence never reach the browser; clues are released only after a lock opens.
- **Art** comes from a reusable, auto-tagged image library (hand-made with Codex plus generated images), so most games cost nothing extra to illustrate.
- 110 automated tests cover the answer checking, validation rules, game engines, and secret redaction.

## Challenges

- **Making generated games actually fun.** My first version worked but felt like worksheets. I researched game design — intrinsic integration (Habgood & Ainsworth), the Three Clue Rule from mystery design, escape-room puzzle rules, social deduction — and rebuilt all three modes around it. Then I had AI agents playtest the prompts and found real problems (motive alone could solve a case, the last clue gave away the culprit, fake facts were longer than true ones) and fixed each with a rule.
- **It still didn't feel like a game.** My first detective mode (chatting with AI suspects and filling a case board) worked but felt like homework. I studied Ace Attorney, Duolingo, and Blooket and rebuilt it as a courtroom game: short lines, lives, streaks, "Objection!" moments, and a contradiction you can only spot by applying the science. As a bonus, play needs no AI at all, so it's instant and free.
- **Limits.** Large schemas exceeded the API's structured-output limits, so big games are generated as JSON and validated in code. Serverless time limits pushed generation onto Render Workflows.
- **Cost and abuse.** A public link can burn an AI budget, so there are per-unit game caps, an hourly generation budget, and upload size limits.

## Accomplishments I'm proud of

- Three complete game modes plus Boss Fight, live multiplayer on phones, and a quality pipeline that refuses to show a broken game.
- Answers are always checked deterministically, so a student is never told "correct" by a model that might be wrong.
- [ADD AFTER TESTING: e.g. "6 classmates tested it: average score on 3 application questions went from X/3 to Y/3; 5 of 6 said it made them think about *why* more than Quizlet."]

## What I learned

- The difference between a game about a subject and a game *made of* a subject — and how much research exists on exactly this.
- How to design with AI safely: let the model be creative, but keep correctness in code (answer keys, validation, redaction).
- Building a real full-stack product: databases, background jobs, cost limits, deployment, and testing.
- [ADD one personal lesson in your own words.]

## What's next

- A teacher view that shows which misconceptions a class fell for during Impostor.
- Co-op Escape Room, voiced characters, and more modes (Heist, Keep It Alive, Card Battler).
- Testing with more classes and tuning difficulty to each student's mastery.

## AI use disclosure

- **Inside the product:** Claude generates the concept maps and games and reviews them as a playtester. FLUX (via Vercel AI Gateway) generated some artwork; Codex generated the base art library.
- **To build it:** I used Claude Code as my coding partner — it wrote most of the code and helped research, under my direction. I chose the problem and the game concept, decided which modes to build, set the learning design and quality rules, reviewed and tested every feature on the live site, and made the calls when research or playtests showed something wasn't working. The full log of what AI did and what I decided is in `AI_USE.md` in the repo.

---

## Built with (tags, up to 25)
next.js, react, typescript, tailwindcss, node.js, vercel, supabase, postgresql, render, anthropic, claude, vercel-ai-gateway, flux, zod, mathjs, vitest, qrcode, claude-code, codex

## "Try it out" links
- https://playbook-brown-psi.vercel.app
- https://github.com/yutakodama1124/playbook

## Image gallery (upload in this order; all 1500×1000, 3:2)
1. `01-home.png` — "Turn any unit into a game."
2. `02-case-briefing.png` — every game opens with a hook question
3. `03-case-investigate.png` — press or present: catch the lie with evidence
4. `04-escape-room.png` — numbered locks on the scene; each needs a concept
5. `05-impostor-lobby.png` — class joins by QR code
6. `06-impostor-round.png` — explain your fact; one card is fake
7. `07-unit-boss.png` — concept map and Boss Fight mastery

## Video demo (1–2 min) — record with QuickTime (File → New Screen Recording) + your voice, upload to YouTube (unlisted is fine), paste the link.

| Time | Show | Say |
|---|---|---|
| 0:00–0:08 | You, or the home page | "Blooket makes you answer questions to play a game. I made the game the question." |
| 0:08–0:20 | Paste notes → concept map (cut the wait) | "Upload your notes. Playbook maps the key concepts and the mistakes students usually make." |
| 0:20–0:45 | Case Files: witness line → Press (new evidence) → Present → OBJECTION! → wrong guess loses a heart | "Witnesses lie. You catch them with the science. Guess wrong and you lose a life." |
| 0:45–0:58 | Escape Room: click a lock, wrong answer shows feedback, solve it, fragment unlocks | "Every lock needs a concept, and the fragments combine into the final exit." |
| 0:58–1:10 | Impostor: QR code, phones, vote, reveal | "In class, everyone explains their fact. One is fake — you only catch it if you understand it." |
| 1:10–1:18 | Boss panel | "Your test is the boss. Weak concepts are its shields." |
| 1:18–1:28 | README diagram or quick code view | "Answers are checked in code, and an AI playtester blocks unfair puzzles before anyone sees them." |
| 1:28–1:35 | Home page | "Playbook. Turn any unit into a game." |
