# Light Panel

[![Live Demo](https://img.shields.io/badge/Live%20Demo-light--panel.berith.moe-orange?style=for-the-badge)](https://light-panel.berith.moe/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://light-panel.berith.moe/)

A React-based web app that turns your phone into an RGB light panel for light painting and photography. Perfect for photographers and creatives doing light painting with long exposure shots.

## Features

- 🎨 **Full-screen RGB panel** - Your entire phone screen becomes a light source
- 🎯 **Preset colors** - Quick access to common colors (Red, Green, Blue, Yellow, etc.)
- 🌈 **Color picker** - Native color picker for precise color selection
- 🎚️ **RGB sliders** - Individual control for Red, Green, and Blue channels (0-255)
- 💡 **Brightness control** - Adjust light intensity from 0-100%
- ⚡ **Blink mode** - Multiple blink speeds for strobe effects
- 👆 **Auto-hiding controls** - Controls hide after 3 seconds, tap to show
- 📱 **Fullscreen mode** - Maximize your light panel
- 📲 **Mobile-optimized** - Designed specifically for phone screens

## Built With

- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Cloudflare Pages](https://pages.cloudflare.com/) - Hosting

## Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deploy to Cloudflare Pages

This project is configured for automatic deployment to Cloudflare Pages. Any push to the main branch will automatically trigger a new deployment.

For manual deployment using Wrangler CLI:

```bash
# Build and deploy in one command
pnpm deploy
```

**Build settings:**
- **Build command:** `pnpm build`
- **Build output directory:** `dist`

## Usage

1. **Open** the app on your phone at [light-panel.berith.moe](https://light-panel.berith.moe/)
2. **Select a color** using presets, color picker, or RGB sliders
3. **Adjust brightness** as needed for your lighting conditions
4. **Enable blink mode** (optional) for strobe effects
5. **Tap the screen** to show/hide controls
6. **Enter fullscreen** for maximum light output
7. **Start creating** amazing light painting photos!

## Tips for Light Painting

- 📷 Use a tripod for your camera with long exposure settings (5-30 seconds)
- 🌙 Shoot in a dark environment for best results
- 🔅 Lower brightness for subtle, soft light effects
- 🔆 Higher brightness for bold, vivid colors
- ⚡ Use blink mode for creative strobe effects
- 🎨 Experiment with different colors and hand movements
- 🤝 Work with a partner - one person moves the phone while the other operates the camera

## License

MIT
