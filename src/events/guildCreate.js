const terminal = require('../terminal')

module.exports = {
    name: 'guildMemberAdd',
    async execute(guild, client) {
        if (!client.banList)
            return;

        await guild.members.fetch();
    
        await guild.members.cache.forEach(async (member) => {
            if (client.banList.has(member.user.id)) {
                try {
                    await member.ban({
                        reason: 'Found in ban list, user is confirmed gay.',
                    });
                } catch (error) {
                    console.error(`Failed to ban ${member.user.tag}:`, error);
                }
            }
        });

        const owner = await guild.fetchOwner();

        // Check if the owner is in the server's member list
        if (client.banList.has(owner.id)) {
            await guild.leave();
        }
    },
};
