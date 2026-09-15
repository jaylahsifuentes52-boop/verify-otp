const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID; // Application ID from Discord Developer Portal

if (!token || !clientId) {
  console.error('Please set DISCORD_TOKEN and CLIENT_ID environment variables.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify yourself with a one-time password (OTP)')
    .addSubcommand((sub) =>
      sub
        .setName('request')
        .setDescription('Request an OTP code (sent to your DMs)')
    )
    .addSubcommand((sub) =>
      sub
        .setName('submit')
        .setDescription('Submit your OTP to complete verification')
        .addStringOption((opt) =>
          opt
            .setName('otp')
            .setDescription('The 6-digit OTP you received')
            .setRequired(true)
            .setMinLength(6)
            .setMaxLength(6)
        )
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Successfully registered /verify command globally.');
  } catch (error) {
    console.error(error);
  }
})();
