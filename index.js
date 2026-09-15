const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// Store pending OTPs: userId -> { code, expires, guildId }
const pendingOtps = new Map();

// Config (set these via env vars on Render if you want to customize)
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const VERIFIED_ROLE_NAME = process.env.VERIFIED_ROLE_NAME || 'Verified';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'verify') {
    const sub = interaction.options.getSubcommand();

    if (sub === 'request') {
      // Generate OTP and DM it to the user
      if (!interaction.guild) {
        return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      }

      const otp = generateOtp();
      const expires = Date.now() + OTP_EXPIRY_MS;

      pendingOtps.set(interaction.user.id, {
        code: otp,
        expires,
        guildId: interaction.guild.id,
      });

      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('Verification Code')
          .setDescription(
            `Your one-time password (OTP) is:\n\n**\`${otp}\`**\n\n` +
            `This code expires in 5 minutes.\n` +
            `Use \`/verify submit otp:${otp}\` in the server to complete verification.`
          )
          .setColor(0x5865F2)
          .setFooter({ text: 'Do not share this code with anyone.' });

        await interaction.user.send({ embeds: [dmEmbed] });

        await interaction.reply({
          content: 'I sent you a DM with your OTP. Check your messages and then use `/verify submit`.',
          ephemeral: true,
        });
      } catch (err) {
        pendingOtps.delete(interaction.user.id);
        await interaction.reply({
          content: 'I could not send you a DM. Please enable DMs from server members and try again.',
          ephemeral: true,
        });
      }
    }

    if (sub === 'submit') {
      const providedOtp = interaction.options.getString('otp', true).trim();

      const pending = pendingOtps.get(interaction.user.id);

      if (!pending) {
        return interaction.reply({
          content: 'No pending OTP found. Use `/verify request` first to get a code.',
          ephemeral: true,
        });
      }

      if (Date.now() > pending.expires) {
        pendingOtps.delete(interaction.user.id);
        return interaction.reply({
          content: 'Your OTP has expired. Please request a new one with `/verify request`.',
          ephemeral: true,
        });
      }

      if (providedOtp !== pending.code) {
        return interaction.reply({
          content: 'Incorrect OTP. Please try again or request a new code.',
          ephemeral: true,
        });
      }

      // OTP correct – try to give the Verified role
      pendingOtps.delete(interaction.user.id);

      const guild = interaction.guild || client.guilds.cache.get(pending.guildId);
      if (!guild) {
        return interaction.reply({
          content: 'Could not find the server. Please try again inside the server.',
          ephemeral: true,
        });
      }

      const member = await guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) {
        return interaction.reply({
          content: 'Could not find your member data in this server.',
          ephemeral: true,
        });
      }

      let role = guild.roles.cache.find((r) => r.name === VERIFIED_ROLE_NAME);
      if (!role) {
        // Try to create the role if it doesn't exist (requires Manage Roles)
        try {
          role = await guild.roles.create({
            name: VERIFIED_ROLE_NAME,
            color: 0x57F287,
            reason: 'Auto-created by verify bot',
          });
        } catch {
          return interaction.reply({
            content: `OTP accepted, but I could not find or create a role named **${VERIFIED_ROLE_NAME}**. Please ask an admin to create it.`,
            ephemeral: true,
          });
        }
      }

      try {
        await member.roles.add(role);
        await interaction.reply({
          content: `✅ Verification successful! You have been given the **${VERIFIED_ROLE_NAME}** role.`,
          ephemeral: true,
        });
      } catch (err) {
        await interaction.reply({
          content: `OTP accepted, but I do not have permission to assign the **${VERIFIED_ROLE_NAME}** role. Please check my role hierarchy and permissions.`,
          ephemeral: true,
        });
      }
    }
  }
});

// Login using environment variable (set DISCORD_TOKEN on Render)
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('ERROR: DISCORD_TOKEN environment variable is not set.');
  process.exit(1);
}

client.login(token);
