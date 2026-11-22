# YouTube Speed Scroll

**Watch YouTube at any speed from 0.25x to 16x, with a speed button you control by scrolling.**

This adds a small speed label to the YouTube player's control bar. Hover over it and scroll to go faster or slower, or use Shift + `<` / `>` on your keyboard. It goes well past YouTube's usual 2x limit.

It does one thing and stays out of the way. The whole extension is about 6 KB, asks for no permissions, and has no background process, settings page or tracking. Use it instead of a big all-in-one YouTube extension if speed control is the only feature you want.

## Controls

| Action | What it does |
|---|---|
| Scroll up / down over the speed label | Faster / slower, in 0.25x steps |
| Shift + scroll over the label | Faster / slower, in 1x steps |
| Click the label | Switch between 1x and your last speed |
| Shift + `>` / Shift + `<` | Faster / slower, in 0.25x steps, shown in YouTube's own speed popup |

- Speed range is **0.25x to 16x**.
- **Your speed is remembered** for the next video, after a reload, and through ads.
- If you pick a speed from YouTube's own settings menu, the label follows it.
- Scrolling only updates the label. Nothing pops up over the video.

## Install

It isn't on the Chrome Web Store, so you load it yourself. This takes about a minute and works in Chrome, Brave, Edge and other Chromium browsers.

1. **Download** this repository: click **Code → Download ZIP** above and unzip it. Or clone it:
   ```bash
   git clone https://github.com/anshitsinha/YTSpeedScrollExt.git
   ```
2. **Open your extensions page:** `chrome://extensions`, `brave://extensions` or `edge://extensions`.
3. Turn on **Developer mode** (switch in the top right).
4. Click **Load unpacked** and select the unzipped `YTSpeedScrollExt` folder.
5. **Reload** any YouTube tabs you have open.

Keep the folder where it is afterwards. The browser runs the extension from that folder, so deleting or moving it removes the extension.

**To update:** download the new version over the old folder, then click the reload arrow on the extension's card in your extensions page.

## Troubleshooting

- **The speed label doesn't appear.** Reload the YouTube tab. If it still isn't there, YouTube may have changed its player layout. Please [open an issue](https://github.com/anshitsinha/YTSpeedScrollExt/issues).
- **Speed keeps jumping back.** Another extension is probably also controlling speed. Turn its speed feature off, or turn that extension off.
- **No sound at high speeds.** Browsers mute audio at very high playback speeds (roughly above 4x). Extensions can't change that.
- **Shorts don't have the label.** Shorts aren't supported, only normal videos and embedded YouTube players.

## Privacy

The extension only runs on `youtube.com`. It makes no network requests and collects nothing. Your chosen speed is saved in your own browser. You can read all of it in [`content.js`](content.js).

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension setup (Manifest V3), no permissions requested |
| `content.js` | The speed label, scroll and keyboard controls, and speed memory |
| `style.css` | Styling for the label |

## License

[MIT](LICENSE). Free to use, change and share.
