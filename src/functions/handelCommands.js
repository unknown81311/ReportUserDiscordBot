const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const terminal = require('../terminal');
const { SlashCommandBuilder } = require("discord.js");

const clientId = process.env.CLIENT_ID;

module.exports = (client) => {
    client.handleCommands = async (commandFolders) => {
        client.commandArray = [];
        for (folder of commandFolders) {
            const commandFiles = fs.readdirSync(`./src/chatCommands/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../chatCommands/${folder}/${file}`);
                client.commands.set(command.data.name, command);

                if(command.data instanceof SlashCommandBuilder){
                    client.commandArray.push(command.data.toJSON());
                } else {
                    client.commandArray.push(command.data);
                }
            }
        }

        const rest = new REST({
            version: '9'
        }).setToken(process.env.DISCORD_TOKEN);

        (async () => {
            try {
                terminal.info('Started refreshing application (/) commands.');

                await rest.put(
                    Routes.applicationCommands(clientId), {
                    body: client.commandArray
                },
                );

                terminal.success('Successfully reloaded application (/) commands.');
            } catch (error) {
                terminal.error(error.stack);
            }
        })();
    };
};