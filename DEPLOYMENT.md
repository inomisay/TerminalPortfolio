# Terminal Deployment Guide

This portfolio is intentionally a terminal experience. It is not meant to be deployed as a normal browser website.

Local use is free:

```bash
npm install
npm start
ssh -p 2222 localhost
```

## Public Deployment

To make it public, you need a host that supports long-running Node.js apps and raw TCP/SSH-style connections. Browser-only hosts such as GitHub Pages and Vercel are not a good fit for this exact version because they serve HTTP websites, not SSH terminal sessions.

The prepared deployment config uses Fly.io:

```bash
flyctl auth login
flyctl apps create inomisay
flyctl deploy
```

After deployment, visitors connect with:

```bash
ssh -p 31337 inomisay.fly.dev
```

Fly may require billing/payment verification for public apps. If you do not want to pay right now, do not deploy yet. The files are ready for later:

- `Dockerfile`
- `.dockerignore`
- `fly.toml`

## Free For Now

Until you choose a public TCP host, keep using it locally:

```bash
npm start
ssh -p 2222 localhost
```

You can still share the GitHub repository so people can clone and run the terminal portfolio on their own machines.

## Future Free-ish Options

If you want a no-cost public demo later, possible paths are:

- Run it on a free personal machine and expose it temporarily with a tunnel that supports TCP.
- Use a student/free cloud credit if available.
- Keep this SSH version as the special version and make a separate browser terminal emulator later for free static hosting.

The last option would look terminal-style in the browser, but it would not be the real SSH experience.
