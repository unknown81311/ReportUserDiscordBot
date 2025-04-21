const terminal = require('../terminal')

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user, client) {

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                terminal.error('Failed to fetch reaction:', error);
                return;
            }
        }

        const prideEmojiNames = [
            '🏳️‍🌈',
            '🏳️‍⚧️',
            'rainbow',
            'bi_',
            'pan_',
            'nonbi',
            'gender',
            'lgbtq',
            'pride',
            'gay',
            'lesbian',
            'trans',
            'queer',
            '🌈',
        ];

        const emojiName = reaction.emoji.name?.toLowerCase();

        try {
            if (prideEmojiNames.some(substring => emojiName.includes(substring))) {
                await reaction.users.remove(user.id);
            }
        } catch (error) {
            terminal.error('Failed to remove reaction:', error);
        }
    },
};
