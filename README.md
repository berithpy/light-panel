# Light Panel

A React-based web app that turns your phone into an RGB light panel for light painting and photography.

## Features

- **Full-screen RGB panel** - Your entire phone screen becomes a light source
- **Preset colors** - Quick access to common colors (Red, Green, Blue, Yellow, etc.)
- **Color picker** - Native color picker for precise color selection
- **RGB sliders** - Individual control for Red, Green, and Blue channels (0-255)
- **Brightness control** - Adjust light intensity from 0-100%
- **Blink mode** - Multiple blink speeds for strobe effects
- **Auto-hiding controls** - Controls hide after 3 seconds, tap to show
- **Fullscreen mode** - Maximize your light panel

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

### Option 1: Using Wrangler CLI

```bash
# Build and deploy
pnpm deploy
```

### Option 2: Using Cloudflare Dashboard

1. Push your code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Click "Create a project"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `pnpm build`
   - Build output directory: `dist`
6. Click "Save and Deploy"

## Usage

1. Open the app on your phone
2. Select a color using presets, color picker, or RGB sliders
3. Adjust brightness as needed
4. Optional: Enable blink mode for strobe effects
5. Tap to show/hide controls
6. Use fullscreen mode for maximum light output
7. Use your phone as a light source for photography or light painting!

## Tips for Light Painting

- Use a tripod for your camera with long exposure settings
- Lower brightness for subtle effects
- Higher brightness for bold colors
- Use blink mode for creative strobe effects
- Experiment with different colors and movements

## License

MIT
