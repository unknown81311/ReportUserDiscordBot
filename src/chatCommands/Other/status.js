const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder} = require("discord.js");

module.exports = {
    data: {
        name: 'Queer Status',
        type: 2,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
    },
    async execute(interaction, client){
      const user = interaction.targetUser;
    
      await interaction?.reply({
        content: client.banList.has(user.id)?'This user has been confirmed gay.':'This user is not in our database.',
        flags: 64
      });
    }
}
