# AI use disclosure

The CSC Back-to-School Hackathon allows AI tools if their use is disclosed. This is how AI was used in Playbook.

## Inside the product

| What | Tool | Role |
|---|---|---|
| Concept maps | Claude (Anthropic API) | Reads uploaded notes and extracts key concepts, where they appear, and common misconceptions. |
| Game generation | Claude | Designs each game (case, escape room, impostor cards) as structured data from the concept map. |
| AI playtester | Claude | Independently re-derives answers and flags unfair, guessable, or confusing puzzles before a game is shown. |
| Artwork | Codex (base library), FLUX via Vercel AI Gateway | Portraits and scenes. Most games reuse the tagged library. |

**What AI does *not* do:** grade answers during play. Every answer, contradiction, and verdict is checked by deterministic code, and answer keys never reach the browser.

## Building the project

I used **Claude Code** as a coding partner. It wrote most of the code and helped with research, under my direction.

**What I decided and did:**
- Chose the problem (studying is passive; "gamified" tools are quizzes in costume) and the core idea: the concept is the game mechanic.
- Chose the modes and cut ideas that didn't work (a homework "show your work" tool; a chat-and-case-board detective mode that felt like homework, rebuilt as an Ace Attorney-style courtroom).
- Set the learning design and quality rules: short wording, lives and streaks, hints that explain instead of answering, answers checked in code.
- Pushed for research on real games (Ace Attorney, Duolingo, Blooket, escape rooms, social deduction) and on learning science.
- Reviewed and tested every feature on the live site and made the calls when something wasn't fun or didn't make sense.

**What AI did:** wrote and refactored code and tests, drafted prompts and sample games (which I reviewed), researched game design, and set up deployment scripts.
