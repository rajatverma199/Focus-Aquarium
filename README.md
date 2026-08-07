# Focus Aquarium

Focus Aquarium is a calm focus timer that turns completed work sessions into a living collection of aquatic creatures and curious underwater finds.

[Try the live app](https://focus-aquarium.rajver.chatgpt.site)

## Features

- 10, 15, and 25-minute focus dives
- Optional task labels
- Random collectible rewards grouped by common, unique, and rare tiers
- Animated water, bubbles, plants, and swimming tank inhabitants
- A persistent collection saved locally in each visitor's browser
- A compact pop-out timer
- Responsive desktop and mobile layouts

## Reward tiers

- **10 minutes — Common finds:** goldfish, miniature koi, hermit crab, and ruby cherry shrimp
- **15 minutes — Unique finds:** diver helmet, lost dive boot, sunken hamster wheel, and ship in a bottle
- **25 minutes — Rare finds:** moonfin angelfish, parrotfish, regal blue tang, seahorse, lobster, sea turtle, and antlerfish

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
```

The deployment build is written to `dist/`.

## Persistence

Aquarium progress is stored in browser `localStorage`. Each browser profile has its own independent collection. Clearing site data, using a private window, or switching devices starts a new aquarium.

## Publish to GitHub

This folder is initialized as a standalone Git repository on the `main` branch. Add it to GitHub Desktop and choose **Publish repository** to create the remote project.
