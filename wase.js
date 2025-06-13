const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

console.log('Yüklenen komutlar:');
const commands = [];
for (const file of commandFiles) {
  try {
    const command = require(`./src/commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`- ${command.data.name} (${file})`);
  } catch (error) {
    console.error(`Hata: ${file} komutu yüklenirken bir sorun oluştu:`, error);
  }
}

const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));

console.log('Yüklenen eventler:');
for (const file of eventFiles) {
  try {
    const event = require(`./src/events/${file}`);
    console.log(`- ${event.name} (${file})`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  } catch (error) {
    console.error(`Hata: ${file} eventi yüklenirken bir sorun oluştu:`, error);
  }
}

client.once('ready', async () => {

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
  } catch (error) {
    console.error('Slash komutları kaydedilirken hata oluştu:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Komut çalıştırılırken hata oluştu: ${interaction.commandName}`, error);
    await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
  }
});

client.login(token);