/**
 * Gera um JWT compatível com o Kong JWT plugin (HS256).
 * Não precisa instalar nenhum pacote — usa apenas o módulo 'crypto' nativo do Node.js.
 *
 * Uso: node generate-token.js [frontend|mobile]
 */

const crypto = require('crypto')

const CONSUMERS = {
  frontend: {
    iss:    'bubber-issuer',
    secret: 'mude-em-producao-use-uma-chave-longa',
  },
  mobile: {
    iss:    'bubber-mobile-issuer',
    secret: 'mude-em-producao-chave-mobile-diferente',
  },
}

function base64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function generateJWT(iss, secret, expiresInHours = 24) {
  const header  = base64url({ alg: 'HS256', typ: 'JWT' })
  const payload = base64url({
    iss,
    exp: Math.floor(Date.now() / 1000) + expiresInHours * 3600,
    iat: Math.floor(Date.now() / 1000),
  })

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${header}.${payload}.${signature}`
}

const consumer = process.argv[2] ?? 'frontend'
const config   = CONSUMERS[consumer]

if (!config) {
  console.error(`Consumer desconhecido: "${consumer}". Use: frontend | mobile`)
  process.exit(1)
}

const token = generateJWT(config.iss, config.secret)

console.log('\n═══════════════════════════════════════════════════════════')
console.log(` Token JWT — consumer: ${consumer} (válido por 24h)`)
console.log('═══════════════════════════════════════════════════════════\n')
console.log(token)
console.log('\n───────────────────────────────────────────────────────────')
console.log(' Header para usar no Apollo Sandbox ou Insomnia:')
console.log('───────────────────────────────────────────────────────────')
console.log(` Authorization: Bearer ${token}\n`)
