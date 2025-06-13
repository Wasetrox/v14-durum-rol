const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol-setup')
    .setDescription('Rol atama ayarlarını yapılandırır.')
    .addStringOption(option =>
      option
        .setName('kelime')
        .setDescription('Mesajlarda kontrol edilecek kelime')
        .setRequired(true))
    .addRoleOption(option =>
      option
        .setName('rol')
        .setDescription('Eşleşme durumunda verilecek rol')
        .setRequired(true))
    .addBooleanOption(option =>
      option
        .setName('tam-eslesme')
        .setDescription('Sadece tam kelime eşleşmesi mi kontrol edilsin?')
        .setRequired(true))
    .addChannelOption(option =>
      option
        .setName('log-kanali')
        .setDescription('Log mesajlarının gönderileceği kanal')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    // Owner kontrolü
    if (interaction.user.id !== config.ownerId) {
      const noPermissionEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Yetki Hatası')
        .setDescription('Bu komutu yalnızca bot sahibi kullanabilir!')
        .addFields({ name: 'Kullanıcı', value: `<@${interaction.user.id}>`, inline: true })
        .setTimestamp()
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

      return await interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
    }

    const kelime = interaction.options.getString('kelime');
    const rol = interaction.options.getRole('rol');
    const tamEslesme = interaction.options.getBoolean('tam-eslesme');
    const logKanali = interaction.options.getChannel('log-kanali');

    // Ayarları JSON dosyasına kaydet
    const settings = {
      guildId: interaction.guild.id,
      kelime,
      rolId: rol.id,
      tamEslesme,
      logKanalId: logKanali.id,
    };

    try {
      fs.writeFileSync(path.join(__dirname, '../database/settings.json'), JSON.stringify(settings, null, 2));
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Hata Oluştu')
        .setDescription('Ayarlar kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
        .addFields({ name: 'Hata Detayı', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp()
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Başarılı embed oluştur
    const successEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Rol Atama Ayarları Kaydedildi')
      .setDescription('Rol atama sistemi başarıyla yapılandırıldı! Aşağıda ayarların özetini bulabilirsiniz.')
      .addFields(
        { name: '🔍 Kontrol Edilecek Kelime', value: `\`${kelime}\``, inline: true },
        { name: '🎭 Verilecek Rol', value: `<@&${rol.id}>`, inline: true },
        { name: '📏 Tam Eşleşme', value: tamEslesme ? 'Evet ✅' : 'Hayır ❌', inline: true },
        { name: '📜 Log Kanalı', value: `<#${logKanali.id}>`, inline: true },
        { name: '🖥️ Sunucu', value: interaction.guild.name, inline: true },
        { name: '👤 Ayarı Yapan', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setThumbnail(interaction.guild.iconURL())
      .setTimestamp()
      .setFooter({ text: 'Rol Atama Sistemi', iconURL: interaction.client.user.displayAvatarURL() });

    // Log kanalına gönderilecek embed
    const logEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('📝 Yeni Rol Atama Ayarı')
      .setDescription('Bir yönetici tarafından rol atama ayarları güncellendi.')
      .addFields(
        { name: 'Kelime', value: `\`${kelime}\``, inline: true },
        { name: 'Rol', value: `<@&${rol.id}>`, inline: true },
        { name: 'Tam Eşleşme', value: tamEslesme ? 'Evet' : 'Hayır', inline: true },
        { name: 'Log Kanalı', value: `<#${logKanali.id}>`, inline: true },
        { name: 'Ayarlayan', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

    // Log kanalına mesaj gönder
    try {
      await logKanali.send({ embeds: [logEmbed] });
    } catch (error) {
      const logErrorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⚠️ Log Gönderme Hatası')
        .setDescription('Log kanalına mesaj gönderilemedi. Lütfen kanal izinlerini kontrol edin.')
        .addFields({ name: 'Hata Detayı', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp()
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

      await interaction.reply({ embeds: [logErrorEmbed], ephemeral: true });
    }

    // Kullanıcıya yanıt gönder
    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
  },
};