const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection, Partials  } = require(`discord.js`);
const fs = require('fs');
const path = require('path');
const terminal = require('./terminal');
const { AutoSavingCollection } = require('./collectionUtils');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const express = require('express');
const auth = require('basic-auth');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.urlencoded({ extended: true })); 
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password123';

client.commands = new Collection();
client.prefixCommands = new Collection();
client.modalCache = new Collection();
client.reportList = new AutoSavingCollection("reportList.json");
client.banList = new AutoSavingCollection("banList.json");

require('dotenv').config();
if (!process.env.DISCORD_TOKEN) terminal.error('Exiting, no token is set') && process.exit(1);

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/chatCommands");
const prefixFolders = fs.readdirSync("./src/prefixCommands");

process.on('uncaughtException', (error) => {
    if (error.message.includes('Used disallowed intents')) {
        console.error("Error: Missing or disallowed intents. Please enable the necessary intents in the Discord Developer Portal.");
        console.error("The bot will continue running without those intents.");
    } else {
        console.error("An uncaught error occurred:", error);
    }
});

const requireAuth = (req, res, next) => {
    const user = auth(req);

    if (!user || user.name !== ADMIN_USER || user.pass !== ADMIN_PASS) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Authentication required.');
    }

    next();
};

app.get('/', requireAuth, async (req, res) => {
    // Fetch report entries
    const reportEntries = [...client.reportList.entries()];
    const banEntries = [...client.banList.entries()];

    // Fetch user data for reports
    const reportData = await Promise.all(reportEntries.map(async ([userId, reportDescription]) => {
        try {
            const user = await client.users.fetch(userId);
            const member = await client.guilds.cache.first()?.members.fetch(userId).catch(() => null);

            console.log(reportDescription);

            return {
                id: user.id,
                avatar: user.displayAvatarURL({ dynamic: true, size: 64 }),
                displayName: member?.displayName || user.username,
                username: user.username,
                pronouns: member?.user?.pronouns || 'N/A',
                description: user.bio || 'N/A',
                currentNote: member?.communicationDisabledUntil?.toISOString() || 'None',
                reportDescription:reportDescription.description,
                aiLabels:reportDescription.AI
            };
        } catch (err) {
            console.error(`Failed to fetch user ${userId}:`, err);
            return null;
        }
    }));

    // Ban list data
    const banData = banEntries.map(([userId]) => ({
        id: userId
    }));

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Ban Requests and Ban List</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .tabs { display: flex; cursor: pointer; margin-bottom: 10px; }
            .tab { padding: 10px; margin-right: 5px; background: #f2f2f2; border: 1px solid #ddd; }
            .tab:hover { background-color: #ddd; }
            .tab-content { display: none; }
            .active { display: block; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; }
            tr:hover { background: #ccc; }
            img { border-radius: 50%; }
            button { padding: 5px 10px; margin: 0 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>Manage Reports and Ban List</h1>

        <div class="tabs">
            <div class="tab" onclick="showTab('reports')">Reports</div>
            <div class="tab" onclick="showTab('banlist')">Ban List</div>
        </div>

        <div id="reports" class="tab-content active">
            <h2>Ban Requests (Reports)</h2>
            <table>
                <tr>
                    <th>User ID</th>
                    <th>Avatar</th>
                    <th>Display Name</th>
                    <th>User Name</th>
                    <th>Pronouns</th>
                    <th>Description</th>
                    <th>Current Note</th>
                    <th>Report Description</th>
                    <th>AI result</th>
                    <th>Actions</th>
                </tr>
                ${reportData.filter(Boolean).map(user => `
                    <tr id="row-${user.id}">
                        <td>${user.id}</td>
                        <td><img src="${user.avatar}" width="64" height="64" /></td>
                        <td>${user.displayName}</td>
                        <td>${user.username}</td>
                        <td>${user.pronouns}</td>
                        <td>${user.description}</td>
                        <td>${user.currentNote}</td>
                        <td>${user.reportDescription}</td>
                        <td>
                            <pre style="margin: 0; font-family: monospace;">${user.aiLabels!="N/A"?user.aiLabels.map(item => `${item.label.padEnd(13)}: ${(item.score * 100).toFixed(2).padStart(6)}%`).join('\n'):"N/A"}</pre>
                        </td>
                        <td>
                            <button onclick="handleAction('${user.id}', 'approve')">Approve</button>
                            <button onclick="handleAction('${user.id}', 'deny')">Reject</button>
                        </td>
                    </tr>
                `).join('')}
            </table>
        </div>

        <div id="banlist" class="tab-content">
            <h2>Ban List</h2>
            <h3>Ban a User:</h3>
            <input type="text" id="banUserId" placeholder="Enter User ID to Ban">
            <button onclick="banUser()">Ban User</button>
            <table>
                <tr>
                    <th>User ID</th>
                    <th>Actions</th>
                </tr>
                ${banData.filter(Boolean).map(user => `
                    <tr id="row-${user.id}">
                        <td>${user.id}</td>
                        <td>
                            <button onclick="handleAction('${user.id}', 'unban')">unban</button>
                        </td>
                    </tr>
                `).join('')}
            </table>
        </div>

        <script>
            // Show the selected tab
            function showTab(tabName) {
                const tabs = document.querySelectorAll('.tab-content');
                const tabButtons = document.querySelectorAll('.tab');

                tabs.forEach(tab => tab.classList.remove('active'));
                tabButtons.forEach(button => button.style.backgroundColor = '#f2f2f2');

                document.getElementById(tabName).classList.add('active');
                const activeButton = [...tabButtons].find(button => button.innerText.toLowerCase() === tabName);
                activeButton.style.backgroundColor = '#ddd';
            }

            async function handleAction(userId, action) {
                if(action=="unban"){
                    const response = await fetch('/banrequests/unban', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        const row = document.getElementById('row-' + userId);
                        if (row) row.remove();
                        console.log(data.message);
                    } else {
                        alert(data.error || 'An error occurred');
                    }

                    return;
                }
                const endpoint = action === 'approve' ? '/banrequests/approve' : '/banrequests/deny';
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        const row = document.getElementById('row-' + userId);
                        if (row) row.remove();
                        console.log(data.message);
                    } else {
                        alert(data.error || 'An error occurred');
                    }
                } catch (err) {
                    console.error('Failed:', err);
                    alert('Network error');
                }
            }


            async function banUser() {
                const userId = document.getElementById('banUserId').value;
                if (!userId) return alert("Please enter a User ID.");

                try {
                    const response = await fetch('/banrequests/approve', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        // Add the banned user to the Ban List table
                        const table = document.querySelector("#banlist table");
                        const newRow = document.createElement("tr");
                        
                        newRow.id = \`row-\${userId}\`;
                        newRow.innerHTML = \`
                            <td>\${userId}</td>
                            <td><button onclick="handleAction('\${userId}', 'unban')">unban</button></td>
                        \`;
                        
                        const headerRow = table.querySelector("tr");
                        headerRow.insertAdjacentElement('afterend', newRow);

                        // Clear the input field after banning
                        document.getElementById('banUserId').value = '';
                    } else {
                        alert(data.error || 'An error occurred');
                    }
                } catch (err) {
                    console.error('Failed to ban user:', err);
                    alert('Network error');
                }
            }
        </script>
    </body>
    </html>
    `;

    res.send(html);
});

app.get('/banrequests', requireAuth, (req, res) => {
    res.json(Object.fromEntries(client.reportList));
});

// Approve a ban (sets value to 1)
app.post('/banrequests/approve', requireAuth, express.json(), async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'No userId provided' });

    // Fetch the user by ID
    const user = await client.users.fetch(userId);

    // Check if the user is valid and not a bot
    if (!user || user.bot) return res.status(400).json({ error: 'Invalid userId' });

    // Set user in the ban list and remove from report list
    client.banList.set(userId, 1);
    client.reportList.delete(userId);

    // Now attempt to ban the user across all guilds (servers)
    let bannedCount = 0;
    for (const guild of client.guilds.cache.values()) {
        try {
            // Attempt to ban the user by their ID even if they are not a member
            await guild.bans.create(userId, { reason: 'Banned globally by bot after approval, user is confirmed gay.' });
            bannedCount++;
        } catch (error) {
            console.log(`Error banning ${user.tag} in guild: ${guild.name} - ${error.message}`);
        }
    }

    // Send response back to client
    res.json({ message: `User ${userId} approved for ban and banned from ${bannedCount} server(s).` });
});

app.post('/banrequests/unban', requireAuth, express.json(), async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'No userId provided' });

    client.banList.delete(userId);
    res.json({ message: `User ${userId} unbanned.` });
});

// Reject/Remove a ban request
app.post('/banrequests/deny', requireAuth, express.json(), (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'No userId provided' });

    client.banList.delete(userId);
    client.reportList.delete(userId);
    res.json({ message: `User ${userId} removed from ban list.` });
});

app.listen(PORT, () => {
    terminal.info(`Express server listening on port ${PORT}`);
});

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    terminal.info('Logging in...');
    client.handleEvents(eventFiles);
    client.handleCommands(commandFolders);
    client.handlePrefixes(prefixFolders);
    client.login(process.env.DISCORD_TOKEN).catch((error) => {
        console.error("Login failed:", error.message);
    });
})();
