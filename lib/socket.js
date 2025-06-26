import fs from 'fs'
import fsPromises from 'fs/promises'
import pino from 'pino'
import chalk from 'chalk'
import readline from 'readline'
import NodeCache from 'node-cache'
import { Boom } from '@hapi/boom'
import { WAConnection, useMultiFileAuthState, Browsers, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from 'baileys'
import { exec } from 'child_process'
import { createServer } from 'http'
import express from 'express'

import settings from '../settings.js'
import databaseClass from './database.js'
import store from './store.js'
import { AutoReloadJadiBot } from './jadibot.js'
import { MessagesUpsert, GroupCacheUpdate, GroupParticipantsUpdate } from './update.js'
import { Solving } from './message.js'
import { generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } from './functions.js'

// Setup readline interface for pairing code input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise(resolve => rl.question(query, resolve))

// Server setup
const app = express()
const server = createServer(app)
const PORT = settings.PORT || 3000

// Auth setup
const pairingCodeMode = process.argv.includes('--qr') ? false : true
let pairingStarted = false

// Load package.json
const packageJson = JSON.parse(await fsPromises.readFile(new URL('../package.json', import.meta.url)))

// Init database and caches
const database = new databaseClass(settings.database)
const msgRetryCounterCache = new NodeCache()
const groupCache = new NodeCache({ stdTTL: 300, useClones: false })

server.listen(PORT, () => {
  console.log(chalk.whiteBright(`App listened on port ${PORT}`))
})

// === Start Bot ===
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session')
  const { version } = await fetchLatestBaileysVersion()
  const logger = pino({ level: 'silent' })

  // Load DB
  try {
    const data = await database.read()
    global.db = data || {
      hit: {}, set: {}, users: {}, game: {}, groups: {}, database: {}, premium: [], sewa: [], events: {}, guilds: {}, menfess: {}
    }
    setInterval(() => {
      if (global.db) database.write(global.db)
    }, 30_000)
  } catch (err) {
    console.error('Failed to start bot:', err)
    process.exit()
  }

  // Get messages
  const getMessage = async (key) => {
    if (store) {
      const msg = await store.loadMessage(key.remoteJid, key.id)
      return msg?.message || ''
    }
    return { conversation: 'Please wait about 1 minute...' }
  }

  // Create connection
  const sock = WAConnection({
    version,
    logger,
    getMessage,
    syncFullHistory: true,
    msgRetryCounterCache,
    retryRequestDelayMs: 10,
    maxMsgRetryCount: 15,
    printQRInTerminal: !pairingCodeMode,
    connectTimeoutMs: 60000,
    browser: Browsers.ubuntu('hhhisoka'),
    generateHighQualityLinkPreview: true,
    cachedGroupMetadata: async jid => groupCache.get(jid),
    transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 10 },
    appStateMacVerification: { patch: true, snapshot: true },
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    }
  })

  // Store creds after every update
  store?.bind(sock.ev)

  await Solving(sock, store)

  setInterval(() => store?.bind(sock.ev), 60000)

  // Handle connection updates
  sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect, isNewLogin, receivedPendingNotifications }) => {
    if ((connection === 'connecting' || qr) && pairingCodeMode && !sock.authState.creds.registered && !pairingStarted) {
      pairingStarted = true
      let number
      async function askNumber() {
        number = settings.pairing?.number || await question('Please type your WhatsApp number: ')
        number = number.replace(/[^0-9]/g, '')
        if (number.length < 6) {
          console.log('Invalid number')
          await askNumber()
        }
      }

      setTimeout(async () => {
        await askNumber()
        console.log('Requesting Pairing Code...')
        const code = await sock.requestPairingCode(number)
        console.log(`Your Pairing Code : ${code}`)
      }, 3000)
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode
      if ([DisconnectReason.restartRequired, DisconnectReason.connectionClosed, DisconnectReason.connectionLost, DisconnectReason.timedOut].includes(reason)) {
        console.log(chalk.redBright('Disconnected. Reconnecting...'))
        startBot()
      } else if ([DisconnectReason.badSession, DisconnectReason.multideviceMismatch, DisconnectReason.loggedOut, DisconnectReason.forbidden].includes(reason)) {
        console.log(chalk.redBright('Session invalid. Please re-scan QR.'))
        exec('rm -rf session/*')
        process.exit()
      } else {
        sock.end()
      }
    }

    if (connection === 'open') {
      console.log(chalk.greenBright(`Connected to: ${sock.user.id}`))
      await AutoReloadJadiBot(sock)
      const jid = await sock.decodeJid(sock.user.id)
      if (global.db?.set[jid] && !global.db.set[jid].anticall) {
        if (settings.channel?.length > 0 && settings.channel.includes('@newsletter')) {
          await sock.sendMessage(settings.channel, { text: 'New device login detected' })
          global.db.set[jid].anticall = true
        }
      }
    }

    if (isNewLogin) {
      console.log('New login')
    }

    if (receivedPendingNotifications) {
      console.log('Received pending notifications')
      sock.ev.flush()
    }
  })

  // Update contacts
  sock.ev.on('contacts.update', contacts => {
    for (const contact of contacts) {
      const id = sock.decodeJid(contact.id)
      if (store?.contacts) store.contacts[id] = { id, name: contact.notify }
    }
  })

  // Block calls
  sock.ev.on('call', async calls => {
    const id = await sock.decodeJid(sock.user.id)
    if (global.db?.set[id]?.anticall) {
      for (const call of calls) {
        if (call.status === 'offer') {
          await sock.sendMessage(call.from, { text: 'We do not accept calls at the moment.' })
          await sock.rejectCall(call.id, call.from)
        }
      }
    }
  })

  // Events
  sock.ev.on('messages.upsert', async m => MessagesUpsert(sock, m, store, groupCache))
  sock.ev.on('groups.update', async m => GroupCacheUpdate(sock, m, store, groupCache))
  sock.ev.on('group-participants.update', async m => GroupParticipantsUpdate(sock, m, store, groupCache))

  return sock
}

startBot().catch(e => {
  console.error('Error:', e)
})

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port in use. Please retry when the port is available!')
    server.close()
  } else {
    console.error('Server error:', err)
  }
})