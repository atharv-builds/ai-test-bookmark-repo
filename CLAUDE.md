CLAUDE.md – Bookmark Organizer (Chrome extension) – Prototype 1
How to work with me
Never assume. If something is not written in this file, or is listed under OPEN, ask me before deciding. Give 2–3 options with your recommendation, then wait.
Small steps. One milestone at a time. Tell me the plan before each milestone and wait for my OK. After it, tell me exactly how to test it.
Explain as you go. I know Python but I am new to JavaScript and Chrome extensions. Explain new concepts briefly, compare to Python where it helps.
Do not change decisions in this file on your own. If you disagree, say why, but keep the decision until I agree.
Do not add features, permissions, libraries or files that are not described here without asking me.
Prototype first. Build the simplest version that works. We will enhance it step by step later. No extra features "just in case".
When I make a decision, add it to this file.
What we are building (Prototype 1)

A Chrome extension that tidies messy bookmarks with one click, using Chrome's on-device AI (Gemini Nano).

The user flow
The user bookmarks websites the normal way (Chrome's star). They end up in whatever folder Chrome puts them in — the extension does nothing at this point.
Later, the user opens the extension popup and clicks "Organize now".
The extension uses Gemini Nano to decide the category of each link and moves it into the matching main folder (e.g. a bank link -> "Money").
If a main folder has multiple links from the same website (domain), the extension uses Gemini Nano again to create a subfolder for that website inside the main folder and moves all those links into it.
The popup shows a short summary of what was done.
Example result
Money
  ICICI – money transfer page
  HDFC                    <- subfolder created automatically
    HDFC login
    HDFC credit card
    HDFC statements
Work
  ...
Structure limit

Main folder -> website subfolder -> link. Nothing deeper.

AI: Gemini Nano (Prompt API)
Use Chrome's built-in on-device AI through the Prompt API (LanguageModel). It runs entirely on the user's computer.
Use constrained output (responseConstraint with a JSON schema / enum) so every AI answer is in a format the code can trust.
Before writing AI code, check the current Chrome documentation and tell me:
minimum Chrome version for extensions and hardware requirements,
any manifest entries or permissions needed,
where in an extension the Prompt API can run (popup, service worker, offscreen document, side panel). This matters: the popup closes when the user clicks away, which would stop a long "Organize now" run.
how the first-time model download works and how long it takes.
If Gemini Nano is not available on the computer, the prototype shows a clear message in the popup and changes nothing.
AI is not the only option (decided 2026-10-26): the extension must always check whether Gemini Nano can be used on the user's PC (spec requirement). If it cannot, a non-AI fallback must still sort the bookmarks. The user will explain the fallback later. Build the AI prototype first; until the fallback is specified, the "clear message, change nothing" behaviour above stays.
Privacy (fixed)
Everything runs on the user's computer. No server, no backend, no analytics, no cloud AI.
Minimum permissions (start with bookmarks). Ask me before adding any other permission.
Tech stack (fixed)
Manifest V3, plain JavaScript (ES modules). No framework, no bundler.
Popup: plain HTML + CSS + JS.
Background service worker if needed. It can sleep at any time: keep important state in chrome.storage.local, not in variables.
Tests: Vitest for pure logic (e.g. extracting the website/domain from a URL).
Rules the extension never breaks
Never deletes a bookmark. Organizing only moves (and creates folders).
Never goes deeper than main folder -> website subfolder -> link.
Only runs when the user clicks "Organize now".
DECISIONS (decided 2026-10-26)
Main folder names: fixed list — Work, Docs, Money, Shopping, Learning, Personal, Other. Gemini Nano must pick one (enum in responseConstraint); it never invents folder names.
Main folders are created in "Other bookmarks".
Which bookmarks are organized: only loose links directly in Bookmarks bar, Other bookmarks and Mobile bookmarks. Folders the user made themselves are skipped.
Website subfolder is created when a main folder has 3 or more links from the same website.
Subfolder name: decided by Gemini Nano (given the website and link titles; short name like "HDFC").
"Same website" means the same hostname, ignoring "www." (mail.google.com and docs.google.com are different websites; Docs and Sheets share docs.google.com).
Renaming links to a short "Website – what it does" title: IN this prototype.
Undo: a simple Undo for the last "Organize now" run, in this prototype. It restores each link's original folder, position and title. Folders the extension created stay (never delete).
Links the AI is unsure about go to the "Other" main folder.
Running "Organize now" again: only links not yet organized (loose links, same scope as above). Links already in the main folders stay put; subfolder rule is re-checked for main folders that receive new links.
Speed: one AI call per link. Popup shows progress (e.g. "Organizing 12 / 80"), stored in chrome.storage.local so it survives closing the popup.
Extension name: "Bookmark Organizer", with a simple icon.

OPEN – ask me before deciding
Where the "Organize now" work runs: background service worker (recommended) or offscreen document (needs the extra "offscreen" permission). Decide after Milestone 1 tests whether the Prompt API works in the service worker.
Non-AI fallback sorting (when Gemini Nano is unavailable): how it works — the user will explain later.
Later enhancements (do NOT build now)

Automatic filing on save, hardcoded rules before AI, learning from user moves, archive for unused links, search box, handling of very large collections (10,000+ links).

Testing
Always test in a separate Chrome profile with sync OFF, with a copy of messy bookmarks imported. Never on a real profile.
Write Vitest tests for pure functions before connecting them to Chrome.
After each milestone, give me step-by-step manual test instructions (chrome://extensions -> Developer mode -> Load unpacked -> reload -> inspect).
