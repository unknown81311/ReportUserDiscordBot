const terminal = require('../terminal')

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if(interaction?.isModalSubmit()){
            const [modalName, modalId] = interaction?.customId.split("_");
            
            if (!modalId) return;

            const command = client.commands.get(modalName);

            if (!command) return;

            try {
                await command.executeModal(interaction, client, modalId);
            } catch (error) {
                terminal.error(error);
                await interaction?.reply({
                    content: 'There was an error while executing this command!',
                    flags: 64
                });
            }
        }else if(interaction?.isCommand()){
            const command = client.commands.get(interaction?.commandName);

            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                terminal.error(error);
                await interaction?.reply({
                    content: 'There was an error while executing this command!',
                    flags: 64
                });
            }
        }
    },
};