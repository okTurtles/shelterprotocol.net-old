---
title: "Opcodes Reference"
description: "Shelter Protocol Opcodes Reference"
---

All opcodes are wrapped using [`SPMessage`](spmessage). The structure of every `SPMessage` is the same and looks like this:

```json
{
  "head": {
    "version": "1.0.0",
    "previousHEAD": null | "<previousHEAD>",
    "contractID": null | "<contractID>",
    "originatingContractID": null | "<contractID>",
    "op": "<opcode>",
    "manifest": "<manifest-hash>",
    "nonce": "<string-uuid>"
  },
  "message": <op-value>,
  "sig": {
    "type": "<sig/key type>",
    "keyId": "<keyId>",
    "data": "<signature>"
  }
}
```

You can read more about those values in the [`SPMessage` Reference](spmessage).

For this document, we will show only the `<op-value>` corresponding to each `SPMessage` for each opcode.

### `OP_CONTRACT`

Creates a new contract, publicly specifying what type of contract it is, and includes the initial set of authorized keys. The format for specifying keys should match the format of [`OP_KEY_ADD`](#OP_KEY_ADD).

- Opcode: `"c"`

```json
{
  "type": "<contract name>",
  "keys": [<op-key-add>, <op-key-add>, ...]
}
```

For `<op-key-add>` definition, see value for [`OP_KEY_ADD`](#op_key_add).

### `OP_KEY_ADD`

Adds keys to the contract that can be used to perform various actions by the contract, or on the contract itself, as specified by the `"permissions"` attribute.

For example, every contract should have a `CSK` (`Contract Signing Key`, marked with the special name `#csk`). This key can be used to both sign updates to the contract itself, as well as perform authorized operations on another contract.

- Opcode: `"ka"`

```json
[
  // key 1
  {
    "id": "<keyId>",
    "name": "<keyName>",
    "purpose": ["sign", "enc", "..."],
    "data": "<JSON encoded array of key data>",
    "permissions": ["<opcode-1>", "<opcode-2>", "..."],
    "meta": { ... }
  },
  // key 2
  {
    // ...
  },
  // key n
]
```

`"id"` is a [`multihash`](https://github.com/multiformats/multihash) of the `"data"` of the key.

`"name"` names the key. You can name your keys however you like, however one of them should use the name `"#csk"`. Names beginning with `#` are reserved for the protocol. Examples of special key names include:

- `#csk`: as mentioned, this key is used to represent the contract itself, and is especially important when it comes to cross-contract communication via `OP_CONTRACT_AUTH`
- `#cek`: this is the `Contract Encryption Key`. It is a key that is most often used to encrypt data within the contract. Contracts that wish to send encrypted data to this contract will use the `#cek`.

`"purpose"` is an array of strings that state the key's purpose. Typically this will be either `"sign"` (for signing messages), or `"enc"` for encrypting/decrypting messages, or it could be both. Other arbitrary values are allowed too if they are useful to protocol implementers.

`"data"` is a JSON string specifying the public key itself (other types of keys, like encrypted secret keys, are stored under `meta.private`). Key data a JSON stringified array of the following structure:

```
[type, publicKey, secretKey]: [string, string, null] | [string, null, string]
```

How the string for the `publicKey` and `secretKey` is generated depends on the key `type`. As an example, Chelonia — an implementation of Shelter Protocol — defines 3 key types based on its usage of the JavaScript library `tweetnacl`:

- `'edwards25519sha512batch'`
- `'curve25519xsalsa20poly1305'`
- `'xsalsa20poly1305'`

> ⚠︎ *Shelter Protocol currently does not specify what these key types are, leaving it up to individual implementations to decide. Future protocol upgrades could standardize type names. For now, we encourage implementers to choose type names that are long and descriptive of the ciphers used.*

`"permissions"` is a list of opcode values (e.g. `"ka"`, `"ae"`, etc.) that this key is allowed to perform.

`"meta"` specifies metadata for the key. A contract might want to include an encrypted copy of a private key for example, and in this case the `"meta"` field can be used for this purpose.

Here's a real-world example:

```js
meta: {
  private: {
    keyId: CEKid,
    content: CSKs,
    shareable: true
  }
}
```

A few notes:

- The `keyId` field specifies the key that was used to encrypt the data in `meta.private.content`
- The special boolean `meta.private.shareable` attribute indicates whether the private key can be shared with another contract using [`OP_KEYSHARE`](#OP_KEYSHARE) (in response to [`OP_KEY_REQUEST`](#OP_KEY_REQUEST))


### `OP_KEY_DEL`

Specifies an array of keyIds to delete from the contract. Deleted keys can no longer be used to perform any actions on the contract, and this should be enforced by the server.

- Opcode: `"kd"`

```json
["<keyId-1>", "<keyId-2>", ... , "<keyId-n>"]
```

### `OP_ACTION_UNENCRYPTED`

Invokes an action on the contract. Most contract messages will use either [`OP_ACTION_ENCRYPTED`](#OP_ACTION_ENCRYPTED) or `OP_ACTION_UNENCRYPTED` opcodes. We cover the unencrypted version first because the encrypted version is effectively the same (but encrypted).

- Opcode: `"au"`

```json
{
  "action": "<actionName>",
  "data": JSONType,
  "meta": { ... }
}
```

`"action"` is the name of the action to invoke on the contract. This corresponds to some behavior of the contract that is processed by the contract code (in whatever language the contract is defined in). The string can be anything. We recommend using [SBP](https://github.com/okTurtles/sbp-js) naming conventions to fully qualify the action name so that you can interact with a diverse set of contracts without name collisions. An example of a fully qualified action name is: `gi.contracts/identity/updateSettings`

`"data"` can be any valid JSON type. This is the data that gets passed to the action for processing and updating the state of the contract. Think of it as the parameters to a function call.

`"meta"` is useful for attaching metadata to action messages (for example, information about who sent the message, when it was sent, etc.).

### `OP_ACTION_ENCRYPTED`

Converts the message data of [`OP_ACTION_UNENCRYPTED`](#OP_ACTION_UNENCRYPTED) into a JSON string using `JSON.stringify` and encrypts it using `"<keyId>"`.

- Opcode: `"ae"`


```json
{
  "keyId": "<keyId>",
  "content": "<encryptedJSON>"
}
```

### `OP_KEY_REQUEST`

`OP_KEY_REQUEST` allows contracts to request private keys from other contracts (shared via [`OP_KEYSHARE`](#OP_KEYSHARE)).

A real-world usecase for this opcode is in the handling of invites to join a group.

- Opcode: `"kr"`

```json
{
  "keyId": "<ID of key used for signing the data below, i.e. the client's CSK>",
  "outerKeyId": "<ID of key used for signing the entire SPMessage>",
  "encryptionKeyId": "<ID of the key used to encrypt by response message, i.e. the CEK>",
  // anti-replay signature
  "data": "sign(originatingContractID + outerKeyId + encryptionKeyId + OP_KEY_REQUEST + contractID + previousHEAD)"
}
```

A few notes:

- The outer `SPMessage` is signed using `"outerKeyId"`, while the `"data"` field is a signature over the `SPMessage` contents using `"keyId"` in order to prevent replay attacks.
- In the `"data"` portion, `+` means "concatinate with `|`". This means that none of the concatinated elements should themselves contain the `|` character.

### `OP_KEY_REQUEST_RESPONSE`

The actual response to a properly formatted and authorized `OP_KEY_REQUEST` is an [`OP_KEYSHARE`](#OP_KEYSHARE) message, not `OP_KEY_REQUEST_RESPONSE`. However, because Shelter Protocol is an end-to-end encrypted protocol, it relies on end-user devices to send `OP_KEYSHARE` messages whenever they are online and able to. Therefore, in order to prevent multiple `OP_KEYSHARE` messages from being sent, we need a way to mark a key request as being responded to. This is the purpose of `OP_KEY_REQUEST_RESPONSE`.

- Opcode: `"krr"`

```json
{
  "keyRequestHash": "<hash of original OP_KEY_REQUEST message>",
  "success": true | false
}
```

Note that unlike `OP_KEYSHARE`, `OP_KEY_REQUEST_RESPONSE` is sent to the contract that is responding to the `OP_KEY_REQUEST`.

It's theoretically possible that for some reason a client wasn't able to send `OP_KEYSHARE` but was able to send `OP_KEY_REQUEST_RESPONSE`. For example, the requesting contract might have been deleted. In this rare case `"success"` would be set to `false`. It is up to client implementations to decide how many unsuccessful attempts they will tolerate before giving up. We recommend a 3-strike rule, and no more than 5 unsuccessful attempts.

### `OP_KEYSHARE`

- Opcode: `"ks"`

```json
{
  "contractID": "<the contractID of the contract sending this message>",
  "keys": [
    {
      "id": "<keyId>",
      "meta": {
        "private": {
          "keyId": "<encryptionKeyId>",
          "content": encrypt(encryptionKey, sharedSecretKey),
          "shareable": true
        }
      }
    },
    // ...
  ]
}
```

- Note: Ricardo, why do we use `"id"` here and `"keyId"` elsewhere, we should make it consistent.
