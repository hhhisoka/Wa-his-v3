// ... imports conservés sauf premium.js
import fs from "fs"
import path from "path"
import https from "https"
import axios from "axios"
import chalk from "chalk"
import crypto from "crypto"
import FileType from "file-type"
import PhoneNumber from "awesome-phonenumber"
import config from "../settings.js"
import { imageToWebp, videoToWebp, writeExif } from "./exif.js"
import { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep, getTypeUrlMedia } from "./functions.js"
import { Serialize } from "./message.js"
import baileys from "baileys"

// ... destructuring de baileys conservé

const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : "";
    }
    return admins || [];
};

// ... GroupUpdate et GroupCacheUpdate inchangés

async function LoadDataBase(sius, m) {
    try {
        const botNumber = await sius.decodeJid(sius.user.id);
        let game = global.db.game || {};
        let event = global.db.events || {};
        let user = global.db.users[m.sender] || {};
        let setBot = global.db.set[botNumber] || {};
        let guilds = global.db.guilds || {};
        
        global.db.game = game;
        global.db.users[m.sender] = user;
        global.db.set[botNumber] = setBot;
        global.db.events = event;
        global.db.guilds = guilds;
        
        // ... guild default structure conservée
        
        const defaultSetBot = {
            lang: "id",
            limit: 0,
            uang: 0,
            status: 0,
            join: false,
            public: true,
            anticall: true,
            original: true,
            readsw: false,
            autobio: false,
            autoread: true,
            antispam: true,
            autotyping: true,
            grouponly: false,
            multiprefix: false,
            privateonly: false,
            autobackup: false,
            template: "documentButtonList",
        };
        for (let key in defaultSetBot) {
            if (!(key in setBot)) setBot[key] = defaultSetBot[key];
        }
        
        // Suppression de checkPremiumUser
        const limitUser = user.vip ? config.limit.vip : config.limit.free;
        const uangUser = user.vip ? config.money.vip : config.money.free;
        
        const defaultUser = {
            vip: false,
            ban: false,
            name: "",
            afkTime: -1,
            afkReason: "",
            sessions: [],
            limit: limitUser,
            autodl: false,
            lastclaim: Date.now(),
            lastbegal: Date.now(),
            lastrampok: Date.now(),
            exp: 0,
            point: 0,
            registered: false,
            name: null,
            age: -1,
            regTime: -1,
            warn: 0,
            level: 1,
            role: "🦗 Beginner",
            title: "Petualang",
            lastProfile: 0,
            autolevelup: true,
            battleWins: 0,
            lastTopGuild: 0,
            guild: null,
            guildLastContribute: 0,
            totalProducts: 0,
            money: uangUser,
            health: 100,
            limit: 100, // doublon mais préservé pour compat
            eventContribution: 0,
            lastEventAction: 0,
            eventRewards: [],
            potion: 10,
            megaPotion: 0,
            petFood: 0,
            reviveStone: 0,
            // ... animaux, outils, productions conservés sans changement
            others: {}
        };
        for (let key in defaultUser) {
            if (!(key in user)) user[key] = defaultUser[key];
        }
        
        if (m.isGroup) {
            let group = global.db.groups[m.chat] || {};
            global.db.groups[m.chat] = group;
            const defaultGroup = {
                url: "",
                text: {},
                warn: {},
                tagsw: {},
                nsfw: false,
                mute: false,
                leave: false,
                setinfo: false,
                antilink: false,
                demote: false,
                antitoxic: false,
                promote: false,
                welcome: false,
                antivirtex: false,
                antitagsw: false,
                antidelete: false,
                antihidetag: false,
                waktusholat: false,
                setleave: "",
                setpromote: "",
                setdemote: "",
                setwelcome: "",
                adminonly: false
            };
            for (let key in defaultGroup) {
                if (!(key in group)) group[key] = defaultGroup[key];
            }
        }
        
        const defaultGame = {
            suit: {},
            chat_ai: {},
            menfes: {},
            tekateki: {},
            akinator: {},
            tictactoe: {},
            tebaklirik: {},
            kuismath: {},
            tebaklagu: {},
            tebakkata: {},
            family100: {},
            susunkata: {},
            tebakbom: {},
            tebakkimia: {},
            caklontong: {},
            tebakangka: {},
            tebaknegara: {},
            tebakgambar: {},
            tebakbendera: {},
            asahotak: {},
            tebakanime: {},
            siapakahaku: {}
        };
        for (let key in defaultGame) {
            if (!(key in game)) game[key] = defaultGame[key];
        }
        
        const defaultEvents = {
            defaultActiveEvent: {
                type: "",
                name: "",
                startTime: 0,
                endTime: 0,
                goal: {},
                progress: {},
                participants: [],
                completed: false
            },
            activeEvent: null,
            lastEvent: 0
        };
        for (let key in defaultEvents) {
            if (!(key in event)) event[key] = defaultEvents[key];
        }
    } catch (e) {
        throw e;
    }
}

// ... GroupParticipantsUpdate et MessagesUpsert conservés

export { GroupUpdate, GroupCacheUpdate, GroupParticipantsUpdate, LoadDataBase, MessagesUpsert };