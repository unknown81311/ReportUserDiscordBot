const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder} = require("discord.js");
const { getClassifier } = require('../../imageClassifier.js');

module.exports = {
  data: {
    name: 'Report User',
    type: 2,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  },
  async executeModal(interaction, client, modalId){
    const description = interaction?.fields.getTextInputValue('description');
    const storedInput = client.modalCache.get(modalId);//targetUser

    await interaction?.reply({
      content: 'Thank you for your report.',
      flags: 64
    });

    client.reportList.set(storedInput.targetUser.id,{user:storedInput.targetUser,description:description,AI:"N/A"});

    const classifier = await getClassifier();
    const result = await classifier(storedInput.targetUser.displayAvatarURL({ dynamic: false, size: 64 }),
      ['furry', 'lgbt', 'cosplay', 'normal photo']
    );

    client.reportList.set(storedInput.targetUser.id,{user:storedInput.targetUser,description:description,AI:result});
  },

  async execute(interaction, client){
    if (client.banList.has(interaction.targetUser.id)) {
      await interaction?.reply({
        content: 'already in database.',
        flags: 64
      });
        return; // Do nothing if already reported
    }
    if(interaction.user.id=="1351066036849348670"){
    
      await interaction?.reply({
        content: 'Thank you for your report.',
        flags: 64
      });
  
      client.reportList.set(interaction.targetUser.id,{user:interaction.targetUser,description:"",AI:"N/A"});
  
      const classifier = await getClassifier();
      const result = await classifier(interaction.targetUser.displayAvatarURL({ dynamic: false, size: 64 }),
        ['furry', 'lgbt', 'cosplay', 'normal photo']
      );

      client.reportList.set(interaction.targetUser.id,{user:interaction.targetUser,description:"",AI:result});
      return;
    }

    client.modalCache.set(interaction.user.id, {
      targetUser: interaction.targetUser
    });

    const modal = new ModalBuilder()
      .setCustomId('Report User_' + interaction.user.id)
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
