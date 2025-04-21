const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder} = require("discord.js");
const { getClassifier } = require('../../imageClassifier.js');

module.exports = {
    data: {
        name: 'Report Message',
        type: 3,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
    },
    async executeModal(interaction, client, modalId){
      const description = interaction?.fields.getTextInputValue('description');
      const storedInput = client.modalCache.get(modalId);//targetMessage

      await interaction?.reply({
        content: 'Thank you for your report.',
        flags: 64
      });
      
      client.reportList.set(storedInput.message.author.id,{user:storedInput.message.author,data:storedInput,description:description,AI:"N/A"});

      const classifier = await getClassifier();
      const result = await classifier(storedInput.message.author.displayAvatarURL({ dynamic: false, size: 64 }),
        ['furry', 'lgbt', 'cosplay', 'normal photo']
      );

      client.reportList.set(storedInput.message.author.id,{user:storedInput.message.author,data:storedInput,description:description,AI:result});
    },

    async execute (interaction, client){
        if(interaction.user.id=="1351066036849348670"){
        
          await interaction?.reply({
            content: 'Thank you for your report.',
            flags: 64
          });
          
          client.reportList.set(interaction.targetMessage.message.author.id,{user:interaction.targetMessage.message.author,data:interaction.targetMessage,description:"",AI:"N/A"});
    
          const classifier = await getClassifier();
          const result = await classifier(interaction.targetMessage.message.author.displayAvatarURL({ dynamic: false, size: 64 }),
            ['furry', 'lgbt', 'cosplay', 'normal photo']
          );
    
          client.reportList.set(interaction.targetMessage.message.author.id,{user:interaction.targetMessage.message.author,data:interaction.targetMessage,description:"",AI:result});
          return;
        }

        if (client.banList.has(interaction.targetMessage.author.id)) {
          await interaction?.reply({
            content: 'already in database.',
            flags: 64
          });
          return; // Do nothing if already reported
        }

        client.modalCache.set(interaction.user.id, {
          message: interaction.targetMessage
        });

        const modal = new ModalBuilder()
          .setCustomId('Report Message_' + interaction.user.id)
          .setTitle('Report Message');

        const descriptionInput = new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Description (Optional)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setPlaceholder('Why are you reporting this message?');
  
        const firstActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        modal.addComponents(firstActionRow);
  
        await interaction.showModal(modal);
    }
}
