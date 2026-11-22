# YouTube Speed Scroll

A tiny Chrome/Brave/Edge extension that puts a speed button on the YouTube player. Scroll over it to change speed anywhere from **0.25x to 16x**.

It's a lightweight stand-in for the speed-scroll feature of bigger all-in-one YouTube extensions. About 100 lines of plain JavaScript, no permissions, no background script, no settings page, no tracking.

## Features

- **Speed button** on the player's control bar, next to the settings gear, showing the current speed (e.g. `2.5x`)
- **Scroll** over the button: up = faster, down = slower, in 0.25x steps
- **Shift + scroll**: 1x steps, to get to high speeds quickly
- **Click** the button: toggle between 1x and your last speed
- **Shift + `>` / Shift + `<`**: change speed by 0.25x with the keyboard, past YouTube's usual 2x limit
- **Remembers your speed** across videos, page reloads and ads
- Works with YouTube's own speed menu too (the button follows whatever you pick there)

## Installation

1. Download this repository: **Code → Download ZIP** and unzip it, or
   ```bash
   git clone https://github.com/anshitsinha/YTSpeedScrollExt.git
   ```
2. Open your browser's extensions page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
3. Turn on **Developer mode**
4. Click **Load unpacked** and select the `YTSpeedScrollExt` folder
5. Reload any open YouTube tabs

If another extension also controls playback speed, turn it off so the two don't conflict.

## Notes

- Your browser may mute audio at very high speeds (roughly above 4x). That's a browser limit, not something an extension can change.
- Works on normal videos and embedded YouTube players. Shorts are not supported.

## Files

| File            | Description                                      |
|-----------------|--------------------------------------------------|
| `manifest.json` | Extension manifest (Manifest V3)                 |
| `content.js`    | Adds the button, scroll/keyboard speed control   |
| `style.css`     | Button styling                                   |

## License

MIT
