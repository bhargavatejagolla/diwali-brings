# 🪔 The Diya That Stayed Lit — For Dharji Shravya

A bespoke, sensory-driven cinematic Diwali greeting web experience engineered exclusively for **Dharji Shravya**.

---

## ✨ Features & Magic

1. **Microphone Breath Ignition**:
   - Blow gently onto the device microphone to ignite the earthen diya wick.
   - Built with Web Audio API `AnalyserNode` with smooth one-tap fallback for any device.

2. **Persistent Browser Memory (`localStorage`)**:
   - Remembers if she has visited before!
   - On repeat visits, the diya is already burning and greets her: *"You came back, Shravya. I kept it burning for you."*

3. **Celestial Starlight Constellation**:
   - Stars converge across the cosmos to spell **`DHARJI SHRAVYA`** in shimmering starlight filaments and rotating sacred golden mandala geometry.

4. **The Catenary Golden Thread**:
   - Two distant diyas ("You" and "Shravya") tethered by a dynamic golden string of light calculated with real catenary physics ($y = a \cdot \cosh(x/a)$).
   - Responds to phone tilt and mouse movement with pendulum inertia.

5. **Scratch-Off Gold Foil Letter**:
   - A golden metallic veil covers the personal message.
   - She scratches the gold foil away with her finger or mouse before the heartfelt message reveals.

6. **Photorealistic Canvas Fireworks Symphony**:
   - Realistic rockets with smoke trails, white-hot core flashes, willow golden rain, and mathematical heart-curve bursts.
   - Synchronized procedural sub-bass booms, sparkler crackle, and mobile haptic vibrations (`navigator.vibrate`).
   - Voice trigger: Say *"Happy Diwali"* to trigger the sky finale!

7. **The Sacred Sky Lantern (Eternal Time Capsule)**:
   - Type a personal Diwali wish and release a glowing sky lantern into the cosmos.
   - Saves across sessions so she can revisit her floating lanterns whenever she returns.

8. **Hidden Starlight Easter Egg**:
   - A subtle glowing star in the bottom right corner reveals a private note and secret code: `AMBER-SPARK-SHRAVYA`.

---

## 🚀 Instant Vercel Deployment

### Method 1: Vercel CLI (Recommended)
From the project folder:
```bash
npm install -g vercel
vercel
```
Follow the 3 quick prompts:
- Set up and deploy? **Yes (`y`)**
- Which scope? **Select your account**
- Link to existing project? **No (`n`)**
- Project name: **`diwali-for-shravya`** (or your choice)
- Output directory: **`dist`** (auto-detected)

Your live HTTPS link will be ready in 15 seconds! (e.g. `https://diwali-for-shravya.vercel.app`)

### Method 2: GitHub + Vercel Dashboard
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "The Diya That Stayed Lit — For Dharji Shravya"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com), click **Add New Project**, import the GitHub repo, and hit **Deploy**.

---

## 💻 Local Testing
To preview locally:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.
