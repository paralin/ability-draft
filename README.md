# Ability Draft

![Ability Draft](img.png)

An ability draft for Deadlock

## Running


- `modlock dev --watch .` starts a local server with the mod, launches Deadlock and reloads the mod on each save.
- `modlock play --host .` starts a server for a friend and prints a code. The friend joins with `modlock join <code>`.

## The Broker

The corrupted item shop, which the game removed, works again in the match. The lobby chooses when it first opens: after about 15 or 30 minutes, or never; 30 to begin with. It then restocks every 15 minutes, each time allowing one more item to be corrupted.

Bots corrupt their items on their own and for free, under the same limit, starting with the most expensive.

## Development

The code is in `src/`: `flow.ts` sets the order of the stages, and `draft/`, `lobby/`, `match/`, `broker/` and `ui/` handle their own parts.

After a Deadlock update, regenerate the hero table. The script finds the game in Steam's libraries; `--modlock` names the Modlock command line, and may be left out when `modlock` is on the PATH:

```bash
python tools/update_heroes.py --modlock path/to/modlock-windows-amd64.exe
```
