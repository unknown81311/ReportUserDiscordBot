const terminal = require('../terminal')

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        if (client.banList && client.banList.has(member.user.id)) {
            try {
                await member.ban({
                    reason: 'Found in ban list, user is confirmed gay.',
                });
            } catch (error) {
                console.error(`Failed to ban ${member.user.tag}:`, error);
            }
        }
    },
};
