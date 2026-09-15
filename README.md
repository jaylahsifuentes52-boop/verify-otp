# Discord Verify OTP Bot

Simple Discord bot with a `/verify` slash command that uses OTP (one-time password).

## Commands

- `/verify request` – Bot DMs you a 6-digit OTP (expires in 5 minutes)
- `/verify submit otp:123456` – Submit the OTP to get the **Verified** role

## Setup on Render

1. Create a new **Web Service** on Render.
2. Connect this repo (or upload the zip / use the files).
3. Set the following **Environment Variables**:
   - `DISCORD_TOKEN` = your bot token (from Discord Developer Portal)
   - `CLIENT_ID` = your Application ID (needed only for registering commands once)
   - (optional) `VERIFIED_ROLE_NAME` = name of the role to give (default: `Verified`)
4. Build Command: `npm install`
5. Start Command: `npm start`

### Register the slash command (one-time)

After the service is live, open the Render shell (or run locally) and execute:

```bash
CLIENT_ID=your_app_id DISCORD_TOKEN=your_token node register-commands.js
```

Or set both env vars on Render and run the register script once via the shell.

## Bot Permissions

Invite the bot with these permissions:
- Manage Roles
- Send Messages
- Use Slash Commands

Make sure the bot's role is **above** the Verified role in the server role hierarchy.

## Local testing

```bash
npm install
DISCORD_TOKEN=your_token node index.js
```
