# YT History Delete BTN

A small userscript for **Tampermonkey / Violentmonkey** that adds a **big red “Remove from watch history” button** next to every entry on YouTube’s watch history page!

Clean up your watch history fast.

## Features

- Adds a **large red delete button** next to each history item
- One-click removal from YouTube watch history
- Works with YouTube’s **SPA navigation & lazy loading**
- Automatically handles newly loaded entries while scrolling
- No external dependencies

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
Make sure you enable the extension in the browser. 

2. Create a new userscript and paste in the contents of `YT_History_Delete_BTN.user.js`
3. Save the script and ensure it's ON
4. Visit:  
   👉 `https://www.youtube.com/feed/history`

## ⚙️ Configuration

You can tweak a couple settings at the very top of the settings, the existing values should work best though.

```js
const BTN_SIZE = 138; // size of the delete button in pixels
const ADD_DELAY = 500; // re-scan interval for lazy-loaded items
```

## License:
GPL-3.0 - do whatever you want (fork, modify, redistribute, improve, experiment) - i'm not your parent. Just don’t blame me if YouTube randomly changes their entire site layout again. Also if something breaks on your PC it's not my fault. 
