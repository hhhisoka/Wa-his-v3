import fs from "fs";
import chalk from "chalk";

commands.add({
    name: ["menu"],
    command: ["menu"],
    category: "info",
    cooldown: 30,
    desc: "Menu interactif du bot avec design moderne",
    run: async ({ sius, m, args }) => {
        try {
            const pushName = m.pushName || "Utilisateur";
            const prefix = ".";
            const x = await sius.decodeJid(sius.user.id);
            const set = db.set[x];
            const ment = set.template;
            const uptime = process.uptime();
            const runtime = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
            const modeBot = set.privateonly ? "🔒 Privé uniquement" : set.grouponly ? "👥 Groupes uniquement" : set.public ? "🌍 Public" : "👤 Personnel";

            // Statistiques du bot
            const totalCommands = commands.getAllCommands().filter(cmd => cmd.category !== "hidden").length;
            const currentTime = new Date().toLocaleString('fr-FR', { 
                timeZone: 'Europe/Paris',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Collecte des catégories avec emojis
            const categoryEmojis = {
                'info': '📋',
                'fun': '🎮',
                'download': '⬇️',
                'tools': '🛠️',
                'admin': '👑',
                'owner': '⚡',
                'group': '👥',
                'nsfw': '🔞',
                'sticker': '🎭',
                'ai': '🤖',
                'game': '🎯',
                'internet': '🌐',
                'music': '🎵',
                'image': '🖼️',
                'text': '📝',
                'converter': '🔄',
                'search': '🔍'
            };

            const commandCategories = [...new Set(
                commands.getAllCommands()
                    .map(cmd => cmd.category?.toLowerCase())
                    .filter(Boolean)
            )].sort();

            // Fonction helper améliorée
            const getCommandsByCategory = (category) => {
                const rows = [];
                const seenEvents = new Set();
                for (const event of commands.getAllCommands()) {
                    if (event.category?.toLowerCase() !== category || event.category === "hidden") continue;
                    const eventKey = event.name[0];
                    if (seenEvents.has(eventKey)) continue;
                    seenEvents.add(eventKey);
                    event.command.forEach((cmd) => {
                        const emoji = categoryEmojis[category] || '⚡';
                        rows.push({
                            title: `${emoji} ${cmd.toUpperCase()}`,
                            description: event.desc?.slice(0, 68) + "..." || "Aucune description",
                            id: `${prefix}${cmd}`
                        });
                    });
                }
                return rows.sort((a, b) => a.title.localeCompare(b.title));
            };

            // Menu principal amélioré
            if (!args[0]) {
                let welcomeMsg = `╭═══════════════════════╮\n`;
                welcomeMsg += `║   🤖 *${config.bot.name || "ITSUKI"}* - BOT WA   ║\n`;
                welcomeMsg += `╰═══════════════════════╯\n\n`;
                
                welcomeMsg += `┏━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                welcomeMsg += `┃ 👋 Salut *${pushName}* !\n`;
                welcomeMsg += `┃ Je suis votre assistant IA\n`;
                welcomeMsg += `┃ prêt à vous aider ! ✨\n`;
                welcomeMsg += `┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                welcomeMsg += `📊 *STATISTIQUES DU BOT*\n`;
                welcomeMsg += `┌─────────────────────┐\n`;
                welcomeMsg += `│ ⏰ Temps actif: ${runtime}\n`;
                welcomeMsg += `│ 🌐 Mode: ${modeBot}\n`;
                welcomeMsg += `│ 📈 Commandes: ${totalCommands}\n`;
                welcomeMsg += `│ 📅 Date: ${currentTime}\n`;
                welcomeMsg += `│ 👥 Groupe: ${config.bot.group}\n`;
                welcomeMsg += `└─────────────────────┘\n\n`;
                
                welcomeMsg += `💡 *ASTUCE:* Tapez *.auto-ai* pour discuter avec ${config.bot.name}!\n\n`;
                welcomeMsg += `🔥 *Choisissez une catégorie ci-dessous:*`;

                const menuSections = [{
                    title: '🎯 NAVIGATION PRINCIPALE',
                    highlight_label: '✨ Menu',
                    rows: [
                        { 
                            title: '📚 TOUTES LES COMMANDES', 
                            description: `Afficher les ${totalCommands} commandes disponibles`,
                            id: `.allmenu` 
                        },
                        ...commandCategories.map(cat => {
                            const emoji = categoryEmojis[cat] || '⚡';
                            const cmdCount = getCommandsByCategory(cat).length;
                            return {
                                title: `${emoji} ${cat.toUpperCase()}`,
                                description: `${cmdCount} commande${cmdCount > 1 ? 's' : ''} - ${cat === 'fun' ? 'Divertissement' : cat === 'tools' ? 'Outils utiles' : cat === 'download' ? 'Téléchargements' : cat === 'admin' ? 'Administration' : 'Fonctionnalités ' + cat}`,
                                id: `.menu ${cat}`
                            };
                        })
                    ]
                }];

                // Templates stylisés
                if (ment === "buttonList") {
                    const menuThumb = fs.readFileSync("./lib/database/allmenu.jpg");
                    return await sius.sendMessage(m.chat, {
                        image: menuThumb,
                        caption: welcomeMsg,
                        footer: `⚡ ${config.bot.name} - Votre assistant IA WhatsApp`,
                        contextInfo: { 
                            forwardingScore: 10, 
                            isForwarded: true 
                        },
                        buttons: [
                            {
                                buttonId: `${prefix}allmenu`,
                                buttonText: { displayText: '📚 Menu Complet' },
                                type: 1
                            },
                            {
                                buttonId: 'interactive_menu',
                                buttonText: { displayText: '🎯 Sélectionner' },
                                type: 4,
                                nativeFlowInfo: {
                                    name: 'single_select',
                                    paramsJson: JSON.stringify({
                                        title: '🎮 Navigation du Menu',
                                        sections: menuSections 
                                    })
                                }
                            }
                        ],
                        headerType: 1,
                        viewOnce: true
                    }, { quoted: m });

                } else if (ment === "documentButtonList" || ment === "gifButtonList" || ment === "documentButtonWithAdReply") {
                    const media = (ment === "documentButtonList" || ment === "documentButtonWithAdReply") ? {
                        document: fs.readFileSync("./index.js"),
                        mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        fileName: `📋 ${config.bot.name} - Menu.xlsx`
                    } : {
                        video: { url: "https://files.catbox.moe/oc3duo.mp4" }                       
                    };

                    return await sius.sendMessage(m.chat, {
                        ...media,
                        caption: welcomeMsg,
                        footer: `🚀 ${config.bot.name} © 2024 - Innovation & Excellence`,
                        contextInfo: {
                            forwardingScore: 10,
                            isForwarded: true,
                            externalAdReply: {
                                thumbnailUrl: config.thumb.menu,
                                mediaUrl: config.thumb.menu,
                                mediaType: 1,
                                previewType: "PHOTO",
                                sourceUrl: config.instagram,
                                renderLargerThumbnail: true,
                                title: `🤖 ${config.bot.name} Assistant`,
                                body: "Menu Interactif Disponible"
                            }
                        },
                        buttons: [
                            {
                                buttonId: `${prefix}allmenu`,
                                buttonText: { displayText: '📖 Toutes Commandes' },
                                type: 1
                            },
                            {
                                buttonId: 'category_selection',
                                buttonText: { displayText: '🎯 Par Catégorie' },
                                type: 4,
                                nativeFlowInfo: {
                                    name: 'single_select',
                                    paramsJson: JSON.stringify({
                                        title: '📂 Sélection des Catégories',
                                        sections: menuSections
                                    })
                                }
                            }
                        ],
                        headerType: 1,
                        viewOnce: true
                    }, { quoted: m });

                } else if (ment === "replyAd") {
                    let categoryList = `╔══════════════════════════╗\n`;
                    categoryList += `║  🤖 *${config.bot.name || "ITSUKI"}* ASSISTANT  ║\n`;
                    categoryList += `╚══════════════════════════╝\n\n`;
                    
                    categoryList += `🎯 *BIENVENUE ${pushName}!*\n\n`;
                    categoryList += `📊 *Informations Système:*\n`;
                    categoryList += `┌─────────────────────┐\n`;
                    categoryList += `│ ⏰ Uptime: ${runtime}\n`;
                    categoryList += `│ 🌐 Mode: ${modeBot}\n`;
                    categoryList += `│ 📈 Total: ${totalCommands} commandes\n`;
                    categoryList += `│ 👥 Groupe: ${config.bot.group}\n`;
                    categoryList += `└─────────────────────┘\n\n`;
                    
                    categoryList += `🗂️ *CATÉGORIES DISPONIBLES:*\n`;
                    categoryList += `┏━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                    
                    for (let cat of commandCategories) {
                        const emoji = categoryEmojis[cat] || '⚡';
                        const count = getCommandsByCategory(cat).length;
                        categoryList += `┃ ${emoji} .menu ${cat} (${count})\n`;
                    }
                    
                    categoryList += `┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                    categoryList += `💡 *Commandes Rapides:*\n`;
                    categoryList += `• .allmenu - Menu complet\n`;
                    categoryList += `• .auto-ai - Discussion IA\n`;
                    categoryList += `• .menu <catégorie> - Catégorie spécifique`;

                    const menuThumb = fs.readFileSync("./lib/database/allmenu.jpg");
                    return m.reply(categoryList, {
                        contextInfo: {
                            forwardingScore: 100,
                            isForwarded: true,
                            externalAdReply: {
                                thumbnail: menuThumb,
                                sourceUrl: config.instagram,
                                mediaType: 1,
                                previewType: "PHOTO",
                                renderLargerThumbnail: true,
                                title: `🤖 ${config.bot.name} Menu`,
                                body: `${totalCommands} commandes disponibles`
                            }
                        }
                    });

                } else if (ment === "simple") {
                    let categoryList = `╭─「 🎯 *MENU ${config.bot.name?.toUpperCase()}* 」\n`;
                    categoryList += `│\n`;
                    categoryList += `│ 👋 Salut ${pushName}!\n`;
                    categoryList += `│ ⏰ Uptime: ${runtime}\n`;
                    categoryList += `│ 📊 ${totalCommands} commandes\n`;
                    categoryList += `│\n`;
                    categoryList += `├─「 📂 *CATÉGORIES* 」\n`;
                    
                    for (let cat of commandCategories) {
                        const emoji = categoryEmojis[cat] || '⚡';
                        categoryList += `├ ${emoji} ${prefix}menu ${cat}\n`;
                    }
                    
                    categoryList += `│\n`;
                    categoryList += `╰─「 💡 *Tip: .auto-ai pour chat* 」`;
                    return m.reply(categoryList);
                }
            }

            // Menu spécifique à une catégorie (amélioré)
            const requestedCategory = args[0].toLowerCase();
            if (!commandCategories.includes(requestedCategory)) {
                return m.reply(`❌ Catégorie "${requestedCategory}" introuvable!\n\n📂 Catégories disponibles:\n${commandCategories.map(cat => `• ${cat}`).join('\n')}`);
            }
            
            const rows = getCommandsByCategory(requestedCategory);
            const categoryEmoji = categoryEmojis[requestedCategory] || '⚡';
            
            if (ment === "buttonList" || ment === "documentButtonList") {
                const listThumb = fs.readFileSync("./lib/database/list.jpg");
                const media = ment === "buttonList" ? {
                    image: listThumb
                } : {
                    document: fs.readFileSync("./index.js"),
                    mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    fileName: `${categoryEmoji} ${requestedCategory.toUpperCase()} - ${config.bot.name}.pptx`
                };
                
                let categoryDesc = `╭══════════════════════════╮\n`;
                categoryDesc += `║ ${categoryEmoji} *${requestedCategory.toUpperCase()}* - ${rows.length} COMMANDES ║\n`;
                categoryDesc += `╰══════════════════════════╯\n\n`;
                categoryDesc += `🎯 Sélectionnez une commande ci-dessous pour l'utiliser!\n\n`;
                categoryDesc += `💡 *Astuce:* Chaque commande a sa description détaillée.`;
                
                return sius.sendMessage(m.chat, {
                    ...media,
                    caption: categoryDesc,
                    footer: `${categoryEmoji} Catégorie ${requestedCategory} • ${config.bot.name}`,
                    contextInfo: {
                        forwardingScore: 10,
                        isForwarded: true,
                        externalAdReply: {
                            thumbnail: listThumb,
                            mediaType: 1,
                            previewType: "PHOTO",
                            sourceUrl: config.instagram,
                            renderLargerThumbnail: true,
                            title: `${categoryEmoji} ${requestedCategory.toUpperCase()}`,
                            body: `${rows.length} commandes disponibles`
                        }
                    },
                    buttons: [{
                        buttonId: 'command_list',
                        buttonText: { displayText: `🎮 Voir Commandes (${rows.length})` },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: `${categoryEmoji} ${requestedCategory.toUpperCase()}`,
                                sections: [{
                                    title: `📋 COMMANDES ${requestedCategory.toUpperCase()}`,
                                    highlight_label: `${rows.length} disponible${rows.length > 1 ? 's' : ''}`,
                                    rows: rows
                                }]
                            })
                        }
                    }],
                    headerType: 1,
                    viewOnce: true
                }, { quoted: m });

            } else if (ment === "replyAd" || ment === "documentButtonWithAdReply") {
                const listThumb = fs.readFileSync("./lib/database/list.jpg");
                const filteredCmd = [];
                const seenEvents = new Set();
                
                for (const event of commands.getAllCommands()) {
                    if (event.category?.toLowerCase() !== requestedCategory || event.category === "hidden") continue;
                    const eventKey = event.name[0];
                    if (seenEvents.has(eventKey)) continue;
                    seenEvents.add(eventKey);
                    event.command.forEach((cmd) => {
                        filteredCmd.push({
                            name: cmd + (event.param ? ` ${event.param}` : ""),
                            desc: event.desc || "Aucune description",
                            tag: event.category
                        });
                    });
                }
                
                const sortedCmds = filteredCmd.sort((a, b) => a.name.localeCompare(b.name));
                
                let menuList = `╔═══════════════════════════╗\n`;
                menuList += `║ ${categoryEmoji} *${requestedCategory.toUpperCase()}* - ${sortedCmds.length} COMMANDES ║\n`;
                menuList += `╚═══════════════════════════╝\n\n`;
                
                menuList += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                for (let i = 0; i < sortedCmds.length; i++) {
                    const cmd = sortedCmds[i];
                    const isLast = i === sortedCmds.length - 1;
                    menuList += `┃ ${i + 1}. .${cmd.name}\n`;
                    if (!isLast && (i + 1) % 5 === 0) {
                        menuList += `┃────────────────────────────\n`;
                    }
                }
                menuList += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                menuList += `💡 *Navigation:*\n`;
                menuList += `• .menu - Retour menu principal\n`;
                menuList += `• .allmenu - Toutes les commandes`;

                return m.reply(menuList.trim(), {
                    contextInfo: {
                        forwardingScore: 100,
                        isForwarded: true,
                        externalAdReply: {
                            thumbnail: listThumb,
                            sourceUrl: config.instagram,
                            mediaType: 1,
                            previewType: "PHOTO",
                            renderLargerThumbnail: true,
                            title: `${categoryEmoji} ${requestedCategory.toUpperCase()}`,
                            body: `${sortedCmds.length} commandes • ${config.bot.name}`
                        }
                    }
                });

            } else if (ment === "simple") {
                let filteredCmd = [];
                let seenEvents = new Set();
                
                for (const event of commands.getAllCommands()) {
                    if (event.category?.toLowerCase() !== requestedCategory || event.category === "hidden") continue;
                    const eventKey = event.name[0];
                    if (seenEvents.has(eventKey)) continue;
                    seenEvents.add(eventKey);
                    event.command.forEach((cmd) => {
                        filteredCmd.push({
                            name: cmd + (event.param ? ` ${event.param}` : ""),
                            tag: event.category
                        });
                    });
                }
                
                const sortedCmds = filteredCmd.map(d => d.name).sort();
                let menuList = `╭─「 ${categoryEmoji} *${requestedCategory.toUpperCase()}* 」\n`;
                menuList += `│\n`;
                
                for (let cmd of sortedCmds) {
                    menuList += `├ ${prefix}${cmd}\n`;
                }
                
                menuList += `│\n`;
                menuList += `╰─「 💡 ${sortedCmds.length} commande${sortedCmds.length > 1 ? 's' : ''} 」`;
                return m.reply(menuList.trim());
            }
            
        } catch (e) {
            console.error("Erreur menu:", e);
            sius.cantLoad(e);            
        }
    }
});

commands.add({
    name: ["allmenu"],
    command: ["allmenu"],
    category: "info",
    desc: "Menu complet avec toutes les fonctionnalités du bot",
    cooldown: 30,
    run: async ({ sius, m }) => {
        try {
            const bot = sius.user.id;
            const botJid = await sius.decodeJid(bot);
            const set = db.set[botJid];
            const uptime = process.uptime();
            const runtime = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
            const modeBot = set.privateonly ? "🔒 Privé" : set.grouponly ? "👥 Groupes" : set.public ? "🌍 Public" : "👤 Personnel";

            const allCmds = commands.getAllCommands().filter(e => e.category !== "hidden");
            const grouped = {};

            // Emojis pour les catégories
            const categoryEmojis = {
                'info': '📋', 'download': '⬇️', 'tools': '🛠️',
                'admin': '👑', 'owner': '⚡', 'group': '👥', 
                'sticker': '🎭', 'internet': '🌐',
                'music': '🎵', 'image': '🖼️', 'text': '📝', 'converter': '🔄',
                'search': '🔍'
            };

            // Groupement des commandes
            for (const ev of allCmds) {
                const cat = ev.category.toUpperCase();
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(ev);
            }

            const totalCommands = allCmds.length;
            const categoriesCount = Object.keys(grouped).length;
            const currentTime = new Date().toLocaleString('fr-FR', { 
                timeZone: 'Europe/Paris',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let teks = `╔══════════════════════════════╗\n`;
            teks += `║   🤖 *${config.bot.name?.toUpperCase() || "ITSUKI"}* - MENU COMPLET   ║\n`;
            teks += `╚══════════════════════════════╝\n\n`;

            teks += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            teks += `┃ 📊 *STATISTIQUES DÉTAILLÉES*\n`;
            teks += `┃─────────────────────────────\n`;
            teks += `┃ ⏰ Temps actif: ${runtime}\n`;
            teks += `┃ 🌐 Mode: ${modeBot}\n`;
            teks += `┃ 📈 Total commandes: ${totalCommands}\n`;
            teks += `┃ 📂 Catégories: ${categoriesCount}\n`;
            teks += `┃ 📅 Dernière MAJ: ${currentTime}\n`;
            teks += `┃ 👥 Groupe: ${config.bot.group}\n`;
            teks += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

            // Affichage des commandes par catégorie
            for (const [cat, list] of Object.entries(grouped).sort()) {
                const emoji = categoryEmojis[cat.toLowerCase()] || '⚡';
                const commandCount = list.reduce((acc, ev) => acc + ev.command.length, 0);
                
                teks += `╭─「 ${emoji} *${cat}* (${commandCount}) 」\n`;
                teks += `│\n`;
                
                for (const ev of list.sort((a, b) => a.command[0].localeCompare(b.command[0]))) {
                    for (const cmd of ev.command) {
                        const paramText = ev.param ? ` ${ev.param}` : "";
                        teks += `├ .${cmd}${paramText}\n`;
                    }
                }
                
                teks += `│\n`;
                teks += `╰──────────────────────────\n\n`;
            }

            teks += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            teks += `┃ 💡 *CONSEILS D'UTILISATION*\n`;
            teks += `┃─────────────────────────────\n`;
            teks += `┃ • .menu <catégorie> - Menu spécifique\n`;
            teks += `┃ • .auto-ai - Chat avec l'IA\n`;
            teks += `┃ • Tapez .help <commande> pour l'aide\n`;
            teks += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            
            teks += `🚀 *${config.bot.name}* © 2024 - Innovation & Excellence`;

            await sius.adChannel(teks.trim(), {
                title: `📖 Menu Complet - ${config.bot.name}`,
                thumb: config.thumb.menu,
                render: true,
                txt: `🤖 ${config.bot.name} A.ssistant`,
                body: `${totalCommands} commandes • ${categoriesCount} catégories`
            });

        } catch (e) {
            console.error("Erreur allmenu:", e);
            sius.cantLoad(e);
        }
    }
});