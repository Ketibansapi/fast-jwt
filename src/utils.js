'use strict'

const { createHash } = require('crypto')
const algorithmMatcher = /"alg"\s*:\s*"[HERP]S(384|512)"/m

function keyToBuffer(key) {
  const keyType = typeof key

  if (keyType === 'object' && typeof key.key === 'string') {
    key.key = Buffer.from(key.key, 'utf-8')
  } else if (keyType === 'string') {
    key = Buffer.from(key, 'utf-8')
  }

  return key
}

function getAsyncKey(handler, header, callback) {
  const result = handler(header, callback)

  if (result && typeof result.then === 'function') {
    result
      .then(key => {
        // This avoids the callback to be thrown twice if callback throws
        process.nextTick(() => callback(null, key))
      })
      .catch(callback)
  }
}

function ensurePromiseCallback(callback) {
  if (typeof callback === 'function') {
    return [callback]
  }

  let promiseResolve, promiseReject

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })

  return [
    function(err, token) {
      if (err) {
        return promiseReject(err)
      }

      return promiseResolve(token)
    },
    promise
  ]
}

function hashToken(token) {
  const rawHeader = token.split('.', 1)[0]
  const header = Buffer.from(rawHeader, 'base64').toString('utf-8')
  const mo = header.match(algorithmMatcher)

  return createHash(`sha${mo ? mo[1] : '256'}`)
    .update(token)
    .digest('hex')
}

module.exports = {
  keyToBuffer,
  getAsyncKey,
  ensurePromiseCallback,
  hashToken
}
