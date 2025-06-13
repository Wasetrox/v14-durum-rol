const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'presenceUpdate',
  execute(oldPresence, newPresence, client) {
    // Ayarlar dosyasını kontrol et
    if (!fs.existsSync(path.join(__dirname, '../database/settings.json'))) return;

    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/settings.json')));
    } catch (error) {
      console.error('Ayarlar dosyası okunurken hata oluştu:', error.message);
      return;
    }

    const { kelime, rolId, tamEslesme, logKanalId } = settings;
    const member = newPresence.member;
    const guild = member.guild;
    const role = guild.roles.cache.get(rolId);
    const logChannel = guild.channels.cache.get(logKanalId);

    // Rol veya log kanalı yoksa işlemi durdur
    if (!role || !logChannel) {
      console.warn(`Rol (${rolId}) veya log kanalı (${logKanalId}) bulunamadı.`);
      return;
    }

    const status = newPresence.activities[0]?.state || '';
    const hasKeyword = tamEslesme
      ? status.toLowerCase() === kelime.toLowerCase()
      : status.toLowerCase().includes(kelime.toLowerCase());

    // Rol ekleme işlemi
    if (hasKeyword && !member.roles.cache.has(rolId)) {
      member.roles.add(rolId).then(() => {
        const addEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Rol Eklendi')
          .setDescription(`${member.user.tag} kullanıcısına "${kelime}" kelimesi tespit edildiği için rol verildi.`)
          .addFields(
            { name: '👤 Kullanıcı', value: `<@${member.id}>`, inline: true },
            { name: '🎭 Verilen Rol', value: `<@&${rolId}>`, inline: true },
            { name: '🔍 Tespit Edilen Durum', value: `\`${status}\``, inline: false },
            { name: '📏 Eşleşme Türü', value: tamEslesme ? 'Tam Eşleşme' : 'Kısmi Eşleşme', inline: true },
            { name: '🕒 Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp()
          .setFooter({ text: guild.name, iconURL: guild.iconURL() });

        logChannel.send({ embeds: [addEmbed] }).catch(error => {
          console.error('Log mesajı gönderilirken hata oluştu:', error.message);
        });
      }).catch(error => {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Rol Ekleme Hatası')
          .setDescription('Rol eklenirken bir hata oluştu.')
          .addFields(
            { name: 'Kullanıcı', value: `<@${member.id}>`, inline: true },
            { name: 'Rol', value: `<@&${rolId}>`, inline: true },
            { name: 'Hata Detayı', value: `\`\`\`${error.message}\`\`\`` }
          )
          .setTimestamp()
          .setFooter({ text: guild.name, iconURL: guild.iconURL() });

        logChannel.send({ embeds: [errorEmbed] }).catch(err => {
          console.error('Hata logu gönderilirken hata oluştu:', err.message);
        });
      });
    }
    // Rol kaldırma işlemi
    else if (!hasKeyword && member.roles.cache.has(rolId)) {
      member.roles.remove(rolId).then(() => {
        const removeEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('🗑️ Rol Kaldırıldı')
          .setDescription(`${member.user.tag} kullanıcısından "${kelime}" kelimesi bulunmadığı için rol alındı.`)
          .addFields(
            { name: '👤 Kullanıcı', value: `<@${member.id}>`, inline: true },
            { name: '🎭 Kaldırılan Rol', value: `<@&${rolId}>`, inline: true },
            { name: '🔍 Mevcut Durum', value: status ? `\`${status}\`` : 'Durum boş', inline: false },
            { name: '📏 Eşleşme Türü', value: tamEslesme ? 'Tam Eşleşme' : 'Kısmi Eşleşme', inline: true },
            { name: '🕒 Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp()
          .setFooter({ text: guild.name, iconURL: guild.iconURL() });

        logChannel.send({ embeds: [removeEmbed] }).catch(error => {
          console.error('Log mesajı gönderilirken hata oluştu:', error.message);
        });
      }).catch(error => {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Rol Kaldırma Hatası')
          .setDescription('Rol kaldırılırken bir hata oluştu.')
          .addFields(
            { name: 'Kullanıcı', value: `<@${member.id}>`, inline: true },
            { name: 'Rol', value: `<@&${rolId}>`, inline: true },
            { name: 'Hata Detayı', value: `\`\`\`${error.message}\`\`\`` }
          )
          .setTimestamp()
          .setFooter({ text: guild.name, iconURL: guild.iconURL() });

        logChannel.send({ embeds: [errorEmbed] }).catch(err => {
          console.error('Hata logu gönderilirken hata oluştu:', err.message);
        });
      });
    }
  },
};