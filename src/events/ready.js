const { joinVoiceChannel } = require('@discordjs/voice');
const { ActivityType, ChannelType } = require('discord.js');
const { guildId, channelId } = require('../../config.json');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
    client.user.setActivity('✨ Wasetrox Was Here', { type: ActivityType.Streaming, url: 'https://www.twitch.tv/wasetrox' });

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.error(`Sunucu bulunamadı! ID: ${guildId}`);
      return;
    }

    const voiceChannel = guild.channels.cache.get(channelId);
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      console.error(`Ses kanalı bulunamadı veya geçersiz! ID: ${channelId}`);
      return;
    }

    if (!voiceChannel.permissionsFor(client.user).has(['Connect', 'Speak'])) {
      console.error('Botun ses kanalına bağlanma veya konuşma izni yok!');
      return;
    }

    try {
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });
    } catch (error) {
      console.error(`Ses kanalına bağlanırken hata oluştu: ${error.message}`);
    }
  },
};