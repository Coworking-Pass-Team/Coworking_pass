# Muttaka · Coworking Pass

Keep this folder together. Double-click `index.html` in Microsoft Edge or Google Chrome. Page 0 opens on the drifting map. Click once to introduce Muttaka. The defense has 14 scenes and 33 stops, including the opening.

## Pace the defense

Use one language to present each idea. The other version of the notes is available for questions. These are suggested speaking times for a 17-minute defense before Q&A.

| Pages | Minutes | Speaking cue |
| --- | --- | --- |
| 0–3 | 3 | Follow a team that needs a room for one afternoon. Tell the same story from the venue’s side. |
| 4–7 | 5 | Take that booking from search and seat selection through wallet settlement to the partner’s books. |
| 8–10 | 6 | Trace one server request, explain the ten fixes in four groups, then explain what the 129 tests establish. |
| 11–13 | 3 | Distinguish the revenue projection from an observed result. Describe the deployment gates and open the floor. |

## Rehearse

Press **D** and tap both clicker buttons. Read each key name and its action in the lower right. Press D again to hide the tester. Press **F** for full screen. To reduce the particle count from 30,000 to 10,000, append `?lite` to the file address before the hash. The browser remembers the current click in the address, so Home returns you to the beginning after a refresh.

Press **P** in the audience window. If the browser asks about pop-ups, allow the presenter window. With Windows displays set to **Extend**, move the console to your own monitor and leave the audience window on the projector. Now follows the audience timeline. Next shows the upcoming stop, or the last stop at the end. Notes include English and Arabic. The timer starts when you leave the opening. Reset timer starts it again. Refreshing the audience window starts a new timer session. The console buttons work with touch. Keep keyboard focus on the audience window for the full set of shortcuts.

| Action | Key or button |
| --- | --- |
| Next | Right, Down, Page Down, Space, N, Enter, left click |
| Back | Left, Up, Page Up, Backspace, right click |
| Full screen | F or F5 |
| Black screen | B or period |
| White screen | W or comma |
| Presenter | P |
| Overview | G or O |
| Go to a page | Type its number, then Enter |
| First or last click | Home or End |
| Help | H or ? |
| Test clicker keys | D |
| Progress line | L |
| Close an overlay | Esc |

Next or Back restores a black or white screen and keeps your place. During a transition, another click finishes that transition and acts from the new stop. Select a thumbnail in the overview to jump there. The opening has no page number or progress line.

## Refresh the overview images

The supplied JPEGs are ready to use. After editing the show, run these commands from the repository root on Windows with Node.js and Edge or Chrome installed.

```powershell
node presentation/tools/make-thumbnails.js
node presentation/tools/verify.js
```

The tools launch a temporary headless browser and open the same local file the audience sees. If the browser is in a different location, set `BROWSER_EXE` to its full executable path. The check visits every beat in reverse, checks its notes and layout, exercises the controls, and opens the presenter window. See [CLAUDE.md](CLAUDE.md) for authoring and [docs/sources.md](docs/sources.md) for claim tracking.
