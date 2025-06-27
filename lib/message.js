import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import fileType from 'file-type';
import phoneNumber from 'awesome-phonenumber';
import config from '../settings.js';
import * as premium from './premium.js';
import { imageToWebp, videoToWebp, writeExif } from './exif.js';
import { 
    isUrl, 
    generateMessageTag, 
    getBuffer, 
    getSizeMedia, 
    fetchJson, 
    sleep, 
    getTypeUrlMedia 
} from './functions.js';
import baileys from 'baileys';

const {
    jidNormalizedUser,
    proto,
    getBinaryNodeChildren,
    getBinaryNodeChild,
    generateMessageIDV2,
    jidEncode,
    encodeSignedDeviceIdentity,
    generateWAMessageContent,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    delay,
    areJidsSameUser,
    extractMessageContent,
    generateMessageID,
    downloadContentFromMessage,
    generateWAMessageFromContent,
    jidDecode,
    generateWAMessage,
    toBuffer,
    getContentType,
    WAMessageStubType,
    getDevice
} = baileys;

async function Solving(client, store) {
    // Message handler setup
    client['messages.upsert'] = (messageUpdate) => MessagesUpsert(client, messageUpdate, store);
    
    // JID decoder
    client.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decoded = jidDecode(jid) || {};
            return decoded.user && decoded.server && decoded.user + '@' + decoded.server || jid;
        } else return jid;
    };

    // Enhanced sendMessage with typing indicator
    const originalSendMessage = client.sendMessage;
    client.sendMessage = async (jid, content, options = {}) => {
        const botJid = client.decodeJid(client.user.id);
        const autoTyping = db.data?.[botJid]?.autotyping;
        
        if (autoTyping && !options?.disableTyping) {
            await client.sendPresenceUpdate('composing', jid);
            await sleep(500);
        }
        
        return originalSendMessage(jid, content, options);
    };

    // Get contact name
    client.getName = async (jid, withoutContact = false) => {
        const id = client.decodeJid(jid);
        
        if (id.endsWith('@g.us')) {
            const groupMetadata = store.contacts[id] || await client.groupMetadata(id) || {};
            return groupMetadata.subject || groupMetadata.name || phoneNumber('+' + id.replace('@g.us', '')).getNumber('international');
        } else {
            if (id === '0@s.whatsapp.net') return 'WhatsApp';
            const contactData = store.contacts[id] || {};
            return withoutContact ? '' : contactData.subject || contactData.name || contactData.verifiedName || phoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international');
        }
    };

    // Send contact
    client.sendContact = async (jid, contacts, quoted = '', options = {}) => {
        let contactList = [];
        for (let contact of contacts) {
            contactList.push({
                'displayName': await client.getName(contact + '@s.whatsapp.net'),
                'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:${await client.getName(contact + '@s.whatsapp.net')}\nFN:${await client.getName(contact + '@s.whatsapp.net')}\nitem1.TEL;waid=${contact}:${contact}\nitem1.X-ABLabel:Mobile\nitem2.ADR:;;Indonesia;;;;\nitem2.X-ABLabel:Region\nEND:VCARD`
            });
        }
        
        client.sendMessage(jid, {
            'contacts': {
                'displayName': contactList.length + ' Contact',
                'contacts': contactList
            },
            ...options
        }, {
            'quoted': quoted,
            'ephemeralExpiration': quoted.expiration || 0
        });
    };

    // Get profile picture URL
    client.profilePictureUrl = async (jid, type = 'image', timeoutMs) => {
        const result = await client.query({
            'tag': 'iq',
            'attrs': {
                'target': jidNormalizedUser(jid),
                'to': '@s.whatsapp.net',
                'type': 'get',
                'xmlns': 'w:profile:picture'
            },
            'content': [{
                'tag': 'picture',
                'attrs': {
                    'type': type,
                    'query': 'url'
                }
            }]
        }, timeoutMs);
        
        const picture = getBinaryNodeChild(result, 'picture');
        return picture?.attrs?.url;
    };

    // Set status
    client.setStatus = (status) => {
        client.query({
            'tag': 'iq',
            'attrs': {
                'to': '@s.whatsapp.net',
                'type': 'set',
                'xmlns': 'status'
            },
            'content': [{
                'tag': 'status',
                'attrs': {},
                'content': Buffer.from(status, 'utf-8')
            }]
        });
        return status;
    };

    // Send poll
    client.sendPoll = (jid, name = '', values = [], quoted, selectableCount = 1) => {
        return client.sendMessage(jid, {
            'poll': {
                'name': name,
                'values': values,
                'selectableCount': selectableCount
            }
        }, {
            'quoted': quoted,
            'ephemeralExpiration': quoted.expiration || 0
        });
    };

    // Send file from URL
    client.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        async function sendMediaType(response, mimeType) {
            if (mimeType && mimeType.includes('gif')) {
                return client.sendMessage(jid, {
                    'video': response.data,
                    'caption': caption,
                    'gifPlayback': true,
                    ...options
                }, {'quoted': quoted});
            } else if (mimeType && mimeType === 'application/pdf') {
                return client.sendMessage(jid, {
                    'document': response.data,
                    'mimetype': 'application/pdf',
                    'caption': caption,
                    ...options
                }, {
                    'quoted': quoted,
                    'ephemeralExpiration': quoted.expiration || 0
                });
            } else if (mimeType && mimeType.includes('image')) {
                return client.sendMessage(jid, {
                    'image': response.data,
                    'caption': caption,
                    ...options
                }, {
                    'quoted': quoted,
                    'ephemeralExpiration': quoted.expiration || 0
                });
            } else if (mimeType && mimeType.includes('video')) {
                return client.sendMessage(jid, {
                    'video': response.data,
                    'caption': caption,
                    'mimetype': 'video/mp4',
                    ...options
                }, {
                    'quoted': quoted,
                    'ephemeralExpiration': quoted.expiration || 0
                });
            } else if (mimeType && mimeType.includes('webp') && !/.jpg|.jpeg|.png/.test(url)) {
                return client.sendAsSticker(jid, response.data, quoted, options);
            } else if (mimeType && mimeType.includes('audio')) {
                return client.sendMessage(jid, {
                    'audio': response.data,
                    'mimetype': 'audio/mpeg',
                    ...options
                }, {
                    'quoted': quoted,
                    'ephemeralExpiration': quoted.expiration || 0
                });
            }
        }

        const httpClient = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        
        const response = await httpClient.get(url, {
            responseType: 'arraybuffer'
        });
        
        let mimeType = response.headers['content-type'];
        
        if (!mimeType || mimeType.includes('octet-stream')) {
            const fileTypeResult = await fileType.fromBuffer(response.data);
            mimeType = fileTypeResult ? fileTypeResult.mime : null;
        }
        
        const result = await sendMediaType(response, mimeType);
        return result;
    };

    // Send group invite
    client.sendGroupInvite = async (groupJid, participantJid, inviteCode, inviteExpiration, groupName = 'Unknown Group', caption = 'Invitation to join my WhatsApp group', jpegThumbnail = null, options = {}) => {
        const message = proto.Message.fromObject({
            'groupInviteMessage': {
                'inviteCode': inviteCode,
                'inviteExpiration': parseInt(inviteExpiration) || +new Date(new Date() + 3 * 24 * 3600 * 1000),
                'groupJid': groupJid,
                'groupName': groupName,
                'jpegThumbnail': Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : null,
                'caption': caption,
                'contextInfo': {
                    'mentionedJid': options.mentions || []
                }
            }
        });
        
        const waMessage = generateWAMessageFromContent(participantJid, message, options);
        const result = await client.relayMessage(participantJid, waMessage.message, {
            'messageId': waMessage.key.id
        });
        
        return result;
    };

    // Send message to multiple recipients
    client.sendFromOwner = async (jids, text, quoted, options = {}) => {
        for (const jid of jids) {
            await client.sendMessage(jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net', {
                'text': text,
                ...options
            }, {'quoted': quoted});
        }
    };

    // Download and save media message
    client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        const buffer = await client.downloadMediaMessage(message);
        const type = await fileType.fromBuffer(buffer);
        const trueFileName = attachExtension ? 'database/temp/' + (filename ? filename : Date.now()) + '.' + type.ext : filename;
        
        await fs.promises.writeFile(trueFileName, buffer);
        return trueFileName;
    };

    // Get file information
    client.getFile = async (path, save) => {
        let res, filename;
        let data = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (res = await getBuffer(path)) : fs.existsSync(path) ? (filename = path, fs.readFileSync(path)) : typeof path === 'string' ? path : Buffer.alloc(0);
        
        let type = await fileType.fromBuffer(data) || {
            'mime': 'application/octet-stream',
            'ext': '.bin'
        };
        
        filename = path.join(__dirname, 'database/temp/' + new Date() * 1 + '.' + type.ext);
        
        if (data && save) fs.promises.writeFile(filename, data);
        
        return {
            'res': res,
            'filename': filename,
            'size': await getSizeMedia(data),
            ...type,
            'data': data
        };
    };

    // Send carousel message
    client.sendCarousel = async (jid, text = '', cards = [], quoted = {}, options = {}) => {
        try {
            let cardList = [];
            
            for (const card of cards) {
                let headerImage = card.header.image;
                let imageMessage;
                
                if (Buffer.isBuffer(headerImage)) {
                    imageMessage = await prepareWAMessageMedia({
                        'image': headerImage
                    }, {
                        'upload': client.waUploadToServer
                    });
                } else if (typeof headerImage === 'string') {
                    if (headerImage.startsWith('http://') || headerImage.startsWith('https://')) {
                        imageMessage = await prepareWAMessageMedia({
                            'image': {
                                'url': headerImage
                            }
                        }, {
                            'upload': client.waUploadToServer
                        });
                    } else {
                        imageMessage = await prepareWAMessageMedia({
                            'image': fs.readFileSync(headerImage)
                        }, {
                            'upload': client.waUploadToServer
                        });
                    }
                } else {
                    throw new Error('Unsupported image type for carousel!');
                }
                
                cardList.push({
                    'header': {
                        'imageMessage': imageMessage.imageMessage,
                        'hasMediaAttachment': true
                    },
                    'body': card.body,
                    'nativeFlowMessage': card.nativeFlowMessage
                });
            }
            
            const carouselMessage = generateWAMessageFromContent(jid, {
                'viewOnceMessage': {
                    'message': {
                        'interactiveMessage': {
                            'body': {
                                'text': text
                            },
                            'carouselMessage': {
                                'cards': cardList,
                                'messageVersion': 1
                            },
                            'footer': {
                                'text': options.footer ? options.footer : ''
                            }
                        }
                    }
                }
            }, {
                'userJid': client.user.id,
                'quoted': quoted
            });
            
            return client.relayMessage(jid, carouselMessage.message, {
                'messageId': carouselMessage.key.id
            });
        } catch (error) {
            console.error(error);
        }
    };

    // Append response message
    client.appendResponseMessage = async (message, text) => {
        let responseMessage = await generateWAMessage(message.chat, {
            'text': text,
            'mentions': message.mentionedJid
        }, {
            'userJid': client.user.id,
            'quoted': message.quoted
        });
        
        responseMessage.key = message.key;
        responseMessage.key.fromMe = areJidsSameUser(message.sender, client.user.id);
        
        if (message.isGroup) responseMessage.participant = message.sender;
        
        client.ev.emit('messages.upsert', {
            ...message,
            'messages': [proto.WebMessageInfo.fromObject(responseMessage)],
            'type': 'append'
        });
    };

    // Send media
    client.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
        const isGroup = jid.endsWith('@g.us');
        const {mime, data, filename} = await client.getFile(path, true);
        const isSticker = options.asSticker || /webp/.test(mime);
        
        let type = 'document';
        let mimetype = mime;
        let pathFile = filename;
        
        if (isSticker) {
            pathFile = await writeExif(data, {
                'packname': options.packname || config.sticker.packname,
                'author': options.author || config.sticker.author,
                'categories': options.categories || []
            });
            
            await fs.unlinkSync(filename);
            type = 'sticker';
            mimetype = 'image/webp';
        } else if (/image|video|audio/.test(mime)) {
            type = mime.split('/')[0];
            mimetype = type == 'video' ? 'video/mp4' : type == 'audio' ? 'audio/mpeg' : mime;
        }
        
        let result = await client.sendMessage(jid, {
            [type]: {
                'url': pathFile
            },
            'caption': caption,
            'mimetype': mimetype,
            'fileName': fileName,
            ...options
        }, {
            'quoted': quoted,
            ...options
        });
        
        await fs.unlinkSync(pathFile);
        return result;
    };

    // Send interactive message
    client.sendListMsg = async (jid, content = {}, options = {}) => {
        const {
            text,
            caption,
            footer = '',
            title,
            subtitle,
            ai,
            contextInfo = {},
            buttons = [],
            mentions = [],
            ...media
        } = content;
        
        const interactiveMessage = await generateWAMessageFromContent(jid, {
            'viewOnceMessage': {
                'message': {
                    'messageContextInfo': {
                        'deviceListMetadata': {},
                        'deviceListMetadataVersion': 2
                    },
                    'interactiveMessage': proto.Message.InteractiveMessage.create({
                        'body': proto.Message.InteractiveMessage.Body.create({
                            'text': text || caption || ''
                        }),
                        'footer': proto.Message.InteractiveMessage.Footer.create({
                            'text': footer
                        }),
                        'header': proto.Message.InteractiveMessage.Header.fromObject({
                            'title': title,
                            'subtitle': subtitle,
                            'hasMediaAttachment': Object.keys(media).length > 0,
                            ...media && typeof media === 'object' && Object.keys(media).length > 0 ? await generateWAMessageContent(media, {
                                'upload': client.waUploadToServer
                            }) : {}
                        }),
                        'nativeFlowMessage': proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            'buttons': buttons.map(button => ({
                                'name': button.name,
                                'buttonParamsJson': JSON.stringify(button.buttonParamsJson ? typeof button.buttonParamsJson === 'string' ? JSON.parse(button.buttonParamsJson) : button.buttonParamsJson : '')
                            }))
                        }),
                        'contextInfo': {
                            ...contextInfo,
                            ...options.contextInfo,
                            'mentionedJid': options.mentions || mentions,
                            ...options.quoted ? {
                                'stanzaId': options.quoted.key.id,
                                'remoteJid': options.quoted.key.remoteJid,
                                'participant': options.quoted.key.participant || options.quoted.key.remoteJid,
                                'fromMe': options.quoted.key.fromMe,
                                'quotedMessage': options.quoted.message
                            } : {}
                        }
                    })
                }
            }
        }, {});
        
        const result = await client.relayMessage(interactiveMessage.key.remoteJid, interactiveMessage.message, {
            'messageId': interactiveMessage.key.id,
            'additionalNodes': [{
                'tag': 'biz',
                'attrs': {},
                'content': [{
                    'tag': 'native_flow',
                    'attrs': {
                        'type': 'native_flow',
                        'v': '1'
                    },
                    'content': [{
                        'tag': 'thread_metadata',
                        'attrs': {
                            'name': 'FOLLOW'
                        }
                    }]
                }]
            }, ...ai ? [{
                'attrs': {
                    'biz_bot': '1'
                },
                'tag': 'bot'
            }] : []]
        });
        
        return result;
    };

    // Newsletter functionality
    client.newsletterMsg = async (jid, options = {}, timeoutMs = 5000) => {
        const {
            type = 'CREATE',
            name,
            description = '',
            picture = null,
            react,
            id,
            newsletter_id = jid,
            ...media
        } = options;
        
        const actionType = type.toUpperCase();
        
        if (react) {
            if (!(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) {
                throw [{
                    'message': 'Use Id Newsletter',
                    'extensions': {
                        'error_code': 204,
                        'severity': 'CRITICAL',
                        'is_retryable': false
                    }
                }];
            }
            
            if (!id) {
                throw [{
                    'message': 'Use Id Newsletter Message',
                    'extensions': {
                        'error_code': 204,
                        'severity': 'CRITICAL',
                        'is_retryable': false
                    }
                }];
            }
            
            const reactionResult = await client.query({
                'tag': 'message',
                'attrs': {
                    'to': jid,
                    'type': 'reaction',
                    'server_id': id,
                    'id': generateMessageID()
                },
                'content': [{
                    'tag': 'reaction',
                    'attrs': {
                        'code': react
                    }
                }]
            });
            
            return reactionResult;
        } else {
            if (media && typeof media === 'object' && Object.keys(media).length > 0) {
                const mediaContent = await generateWAMessageContent(media, {
                    'upload': client.waUploadToServer
                });
                
                const mediaResult = await client.query({
                    'tag': 'message',
                    'attrs': {
                        'to': newsletter_id,
                        'type': 'text' in media ? 'text' : 'media'
                    },
                    'content': [{
                        'tag': 'plaintext',
                        'attrs': /image|video|audio|sticker|poll/.test(Object.keys(media).join('|')) ? {
                            'mediatype': Object.keys(media).find(key => ['image', 'video', 'audio', 'sticker', 'poll'].includes(key)) || null
                        } : {},
                        'content': proto.Message.encode(mediaContent).finish()
                    }]
                });
                
                return mediaResult;
            } else {
                if (/(FOLLOW|UNFOLLOW|DELETE)/.test(actionType) && !(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) {
                    return [{
                        'message': 'Use Id Newsletter',
                        'extensions': {
                            'error_code': 204,
                            'severity': 'CRITICAL',
                            'is_retryable': false
                        }
                    }];
                }
                
                const queryResult = await client.query({
                    'tag': 'iq',
                    'attrs': {
                        'to': 's.whatsapp.net',
                        'type': 'get',
                        'xmlns': 'w:mex'
                    },
                    'content': [{
                        'tag': 'query',
                        'attrs': {
                            'query_id': actionType == 'FOLLOW' ? 'xwa2_newsletter_join_v2' : actionType == 'UNFOLLOW' ? '7238632346214362' : actionType == 'CREATE' ? '6563316087068696' : actionType == 'DELETE' ? '8316537688363079' : '6234210096708695'
                        },
                        'content': new TextEncoder().encode(JSON.stringify({
                            'variables': /(FOLLOW|UNFOLLOW|DELETE)/.test(actionType) ? {
                                'newsletter_id': newsletter_id
                            } : actionType == 'CREATE' ? {
                                'newsletter_input': {
                                    'name': name,
                                    'description': description,
                                    'picture': picture
                                }
                            } : {
                                'fetch_creation_time': true,
                                'fetch_full_image': true,
                                'fetch_viewer_metadata': false,
                                'input': {
                                    'key': jid,
                                    'type': newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id) ? 'JID' : 'INVITE'
                                }
                            }
                        }))
                    }]
                }, timeoutMs);
                
                const parsedResult = JSON.parse(queryResult.content[0].content)?.data?.xwa2_newsletter_leave_v2 || 
                                  JSON.parse(queryResult.content[0].content)?.data?.xwa2_newsletter_join_v2 || 
                                  JSON.parse(queryResult.content[0].content)?.data?.xwa2_newsletter_delete_v2 || 
                                  JSON.parse(queryResult.content[0].content)?.data?.xwa2_newsletter_create || 
                                  JSON.parse(queryResult.content[0].content)?.data?.xwa2_newsletter || 
                                  JSON.parse(queryResult.content[0].content)?.errors || 
                                  JSON.parse(queryResult.content[0].content);
                
                if (parsedResult.thread_metadata) {
                    parsedResult.thread_metadata.host = '@newsletter';
                }
                
                return parsedResult;
            }
        }
    };

    // Set public/private mode
    if (client.user && client.user.id) {
        const botJid = client.decodeJid(client.user.id);
        if (global.db?.data[botJid]) {
            client.public = global.db.data[botJid].public;
        } else {
            client.public = true;
        }
    } else {
        client.public = true;
    }

    return client;
}

async function Serialize(client, message, store, groupMetadata) {
    const botJid = client.decodeJid(client.user.id);
    
    if (!message) return message;
    
    // Check if message exists in store
    if (!store.messages[message.key.remoteJid]?.array?.find(msg => msg.key.id === message.key.id)) {
        return message;
    }
    
    if (message.key) {
        message.id = message.key.id;
        message.chat = message.key.remoteJid;
        message.fromMe = message.key.fromMe;
        message.isBot = ['HSK', 'BAE', 'B1E', 'BIZ', 'B24E', 'WA'].some(prefix => 
            message.id.startsWith(prefix) && [12, 16, 20, 22, 40].includes(message.id.length)
        ) || /(.)\1{5,}|[^a-zA-Z0-9]/.test(message.id) || false;
        
        message.isGroup = message.chat.endsWith('@g.us');
        message.sender = client.decodeJid(message.fromMe && client.user.id || message.participant || message.key.participant || message.chat || '');
        
        if (message.isGroup) {
            if (!store.groupMetadata) {
                store.groupMetadata = await client.groupFetchAllParticipating().catch(err => ({}));
            }
            
            let groupData = store.groupMetadata[message.chat] ? store.groupMetadata[message.chat] : store.groupMetadata[message.chat] = groupMetadata.get(message.chat);
            
            if (!groupData) {
                groupData = await client.groupMetadata(message.chat).catch(err => ({}));
                if (groupData) {
                    groupData.participants = groupData.participants?.filter(participant => 
                        participant.hasOwnProperty('id') && participant.hasOwnProperty('admin')
                    )?.filter((participant, index, array) => 
                        array.findIndex(p => p.id === participant.id) === index
                    ) || [];
                }
                if (groupData) groupMetadata.set(message.chat, groupData);
            }
            
            if (groupData) {
                groupData.participants = groupData.participants?.filter(participant => 
                    participant.hasOwnProperty('id') && participant.hasOwnProperty('admin')
                )?.filter((participant, index, array) => 
                    array.findIndex(p => p.id === participant.id) === index
                ) || [];
            }
            
            message.groupMetadata = groupData;
            message.admins = message.groupMetadata.participants ? message.groupMetadata.participants.reduce((admins, participant) => {
                if (participant.admin) admins.push({id: participant.id, admin: participant.admin});
                return admins;
            }, []) : [];
            
            message.isAdmin = message.admins?.some(admin => admin.id === message.sender) || false;
            message.participant = message.key.participant;
            message.isBotAdmin = !!message.admins?.find(admin => admin.id === botJid) || false;
        }
    }
    
    if (message.message) {
        message.type = getContentType(message.message) || Object.keys(message.message)[0];
        message.msg = /viewOnceMessage/i.test(message.type) ? 
            message.message[message.type].message[getContentType(message.message[message.type].message)] : 
            extractMessageContent(message.message[message.type]) || message.message[message.type];
        
        message.body = message.message?.conversation || 
                      message.msg?.text || 
                      message.msg?.conversation || 
                      message.msg?.caption || 
                      message.msg?.selectedButtonId || 
                      message.msg?.singleSelectReply?.selectedRowId || 
                      message.msg?.selectedId || 
                      message.msg?.contentText || 
                      message.msg?.selectedDisplayText || 
                      message.msg?.title || 
                      message.msg?.name || '';
        
        message.mentionedJid = message.msg?.contextInfo?.mentionedJid || [];
        
        message.text = message.msg?.text || 
                      message.msg?.caption || 
                      message.message?.conversation || 
                      message.msg?.contentText || 
                      message.msg?.selectedDisplayText || 
                      message.msg?.title || '';
        
        // Extract prefix and command
        message.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(message.body) ? 
            message.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : 
            /[\uD800-\uDBFF][\uDC00-\uDFFF]/gi.test(message.body) ? 
            message.body.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/gi)[0] : '';
        
        message.command = message.body && message.body.replace(message.prefix, '').trim().split(/ +/).shift();
        message.args = message.body?.trim()?.replace(new RegExp('^' + message.prefix?.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, '\\$&'), 'i'), '').replace(message.command, '').split(/ +/).filter(arg => arg) || [];
        
        // Helper functions
        message.example = (example) => {
            return client.sendMessage(message.chat, {
                'text': '⚠️ Include the required text in using this feature!\n\n*Example :* ' + (message.prefix + message.command) + ' ' + example
            }, {'quoted': message});
        };
        
        message.react = (emoji) => {
            return client.sendMessage(message.chat, {
                'react': {
                    'text': emoji,
                    'key': message.key
                }
            }, {'quoted': message});
        };
        
        message.isOwner = config.owner.map(owner => owner.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(message.sender);
        message.isCommand = !!message.prefix && !!message.command;
        message.device = getDevice(message.id);
        message.expiration = message.msg?.contextInfo?.expiration || 0;
        message.timestamp = (typeof message.messageTimestamp === 'number' ? message.messageTimestamp : message.messageTimestamp.low ? message.messageTimestamp.low : message.messageTimestamp.high) || message.msg.timestampMs * 1000;
        message.isMedia = !!message.msg?.mimetype || !!message.msg?.thumbnailDirectPath;
        message.isPrem = premium.checkPremiumUser(message.sender, db.premium) || false;
        
        if (message.isMedia) {
            message.mime = message.msg?.mimetype;
            message.size = message.msg?.fileLength;
            message.height = message.msg?.height || '';
            message.width = message.msg?.width || '';
            
            if (/webp/i.test(message.mime)) {
                message.isAnimated = message.msg?.isAnimated;
            }
        }
        
        // Handle quoted message
        message.quoted = message.msg?.contextInfo?.quotedMessage || null;
        
        if (message.quoted) {
            message.quoted.message = extractMessageContent(message.msg?.contextInfo?.quotedMessage);
            message.quoted.type = getContentType(message.quoted.message) || Object.keys(message.quoted.message)[0];
            message.quoted.id = message.msg.contextInfo.stanzaId;
            message.quoted.device = getDevice(message.quoted.id);
            message.quoted.chat = message.msg.contextInfo.remoteJid || message.chat;
            message.quoted.isBot = message.quoted.id ? ['HSK', 'BAE', 'B1E', 'BIZ', 'B24E', 'WA'].some(prefix => 
                message.quoted.id.startsWith(prefix) && [12, 16, 20, 22, 40].includes(message.quoted.id.length)
            ) || /(.)\1{6,}|[^a-zA-Z0-9]/.test(message.quoted.id) : false;
            
            message.quoted.sender = client.decodeJid(message.msg.contextInfo.participant);
            message.quoted.fromMe = message.quoted.sender === client.decodeJid(client.user.id);
            message.quoted.text = message.quoted.caption || message.quoted.conversation || message.quoted.contentText || message.quoted.selectedDisplayText || message.quoted.title || '';
            message.quoted.msg = extractMessageContent(message.quoted.message[message.quoted.type]) || message.quoted.message[message.quoted.type];
            message.quoted.mentionedJid = message.quoted?.msg?.contextInfo?.mentionedJid || [];
            message.quoted.body = message.quoted.msg?.text || message.quoted.msg?.caption || message.quoted?.message?.conversation || message.quoted.msg?.selectedButtonId || message.quoted.msg?.singleSelectReply?.selectedRowId || message.quoted.msg?.selectedId || message.quoted.msg?.contentText || message.quoted.msg?.selectedDisplayText || message.quoted.msg?.title || message.quoted?.msg?.name || '';
            
            // Get quoted object
            message.getQuotedObj = async () => {
                if (!message.quoted.id) return false;
                let quotedMessage = await store.loadMessage(message.chat, message.quoted.id, client);
                return await Serialize(client, quotedMessage, store, groupMetadata);
            };
            
            message.quoted.key = {
                'remoteJid': message.msg?.contextInfo?.remoteJid || message.chat,
                'participant': message.quoted.sender,
                'fromMe': areJidsSameUser(client.decodeJid(message.msg?.contextInfo?.participant), client.decodeJid(client?.user?.id)),
                'id': message.msg?.contextInfo?.stanzaId
            };
            
            message.quoted.isGroup = message.quoted.chat.endsWith('@g.us');
            message.quoted.mentions = message.quoted.msg?.contextInfo?.mentionedJid || [];
            message.quoted.body = message.quoted.msg?.text || message.quoted.msg?.caption || message.quoted?.message?.conversation || message.quoted.msg?.selectedButtonId || message.quoted.msg?.singleSelectReply?.selectedRowId || message.quoted.msg?.selectedId || message.quoted.msg?.contentText || message.quoted.msg?.selectedDisplayText || message.quoted.msg?.title || message.quoted?.msg?.name || '';
            message.quoted.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(message.quoted.body) ? message.quoted.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : /[\uD800-\uDBFF][\uDC00-\uDFFF]/gi.test(message.quoted.body) ? message.quoted.body.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/gi)[0] : '';
            message.quoted.command = message.quoted.body && message.quoted.body.replace(message.quoted.prefix, '').trim().split(/ +/).shift();
            message.quoted.isMedia = !!message.quoted.msg?.mimetype || !!message.quoted.msg?.thumbnailDirectPath;
            
            if (message.quoted.isMedia) {
                message.quoted.mime = message.quoted.msg?.mimetype;
                message.quoted.size = message.quoted.msg?.fileLength;
                message.quoted.height = message.quoted.msg?.height || '';
                message.quoted.width = message.quoted.msg?.width || '';
                
                if (/webp/i.test(message.quoted.mime)) {
                    message.quoted.isAnimated = message.quoted?.msg?.isAnimated || false;
                }
            }
            
            message.quoted.fakeObj = proto.WebMessageInfo.fromObject({
                key: {
                    remoteJid: message.quoted.chat,
                    fromMe: message.quoted.fromMe,
                    id: message.quoted.id
                },
                message: message.quoted,
                ...(message.isGroup ? {participant: message.quoted.sender} : {})
            });
            
            message.quoted.download = () => client.downloadMediaMessage(message.quoted);
            message.quoted.delete = () => {
                client.sendMessage(message.quoted.chat, {
                    delete: {
                        remoteJid: message.quoted.chat,
                        fromMe: message.isBot ? false : true,
                        id: message.quoted.id,
                        participant: message.quoted.sender
                    }
                });
            };
        }
        
        message.download = () => client.downloadMediaMessage(message);
        message.serializeM = () => Serialize(client, proto.WebMessageInfo.fromObject(proto.WebMessageInfo.toObject(message)));
        
        // Reply function
        message.reply = async (content, options = {}) => {
            const isGroup = message.chat.endsWith('@g.us');
            const {
                quoted = message,
                chat = message.chat,
                caption = '',
                ephemeralExpiration = message.expiration,
                mentions = typeof content === 'string' || typeof content.text === 'string' || typeof content.caption === 'string' ? 
                    [...(content.text || content.caption || content).matchAll(/@(\d{0,16})/g)].map(match => match[1] + '@s.whatsapp.net') : [],
                ...otherOptions
            } = options;
            
            if (typeof content === 'object') {
                if (!isGroup && config.tagAI) {
                    return client.sendMessage(chat, content, {
                        ...options,
                        'quoted': quoted,
                        'ephemeralExpiration': ephemeralExpiration,
                        'additionalNodes': [{
                            'tag': 'bot',
                            'attrs': {'biz_bot': '1'}
                        }]
                    });
                }
                return client.sendMessage(chat, content, {
                    ...options,
                    'quoted': quoted,
                    'ephemeralExpiration': ephemeralExpiration
                });
            } else if (typeof content === 'string') {
                try {
                    if (/^https?:\/\//.test(content)) {
                        const response = await axios.get(content, {responseType: 'arraybuffer'});
                        const mimeType = response.headers['content-type'] || (await fileType.fromBuffer(response.data)).mime;
                        
                        if (/gif|image|video|audio|pdf|stream/i.test(mimeType)) {
                            return client.sendMedia(chat, response.data, '', caption, quoted, content);
                        } else {
                            if (!isGroup && config.tagAI) {
                                return client.sendMessage(chat, {
                                    'text': content,
                                    'mentions': mentions,
                                    ...options
                                }, {
                                    'quoted': quoted,
                                    'ephemeralExpiration': ephemeralExpiration,
                                    'additionalNodes': [{
                                        'tag': 'bot',
                                        'attrs': {'biz_bot': '1'}
                                    }]
                                });
                            }
                            return client.sendMessage(chat, {
                                'text': content,
                                'mentions': mentions,
                                ...options
                            }, {
                                'quoted': quoted,
                                'ephemeralExpiration': ephemeralExpiration
                            });
                        }
                    } else {
                        if (!isGroup && config.tagAI) {
                            return client.sendMessage(chat, {
                                'text': content,
                                'mentions': mentions,
                                ...options
                            }, {
                                'quoted': quoted,
                                'ephemeralExpiration': ephemeralExpiration,
                                'additionalNodes': [{
                                    'tag': 'bot',
                                    'attrs': {'biz_bot': '1'}
                                }]
                            });
                        }
                        return client.sendMessage(chat, {
                            'text': content,
                            'mentions': mentions,
                            ...options
                        }, {
                            'quoted': quoted,
                            'ephemeralExpiration': ephemeralExpiration
                        });
                    }
                } catch (error) {
                    if (!isGroup && config.tagAI) {
                        return client.sendMessage(chat, {
                            'text': content,
                            'mentions': mentions,
                            ...options
                        }, {
                            'quoted': quoted,
                            'ephemeralExpiration': ephemeralExpiration,
                            'additionalNodes': [{
                                'tag': 'bot',
                                'attrs': {'biz_bot': '1'}
                            }]
                        });
                    }
                    return client.sendMessage(chat, {
                        'text': content,
                        'mentions': mentions,
                        ...options
                    }, {
                        'quoted': quoted,
                        'ephemeralExpiration': ephemeralExpiration
                    });
                }
            }
        };
    }
    
    return message;
}

export { Serialize, Solving };
