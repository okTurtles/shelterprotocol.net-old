---
title: "Opcodes"
description: "Shelter Protocol Opcodes Reference"
---

All opcodes are wrapped using [`SPMessage`](/en/spmessage). This document shows the possible values for `<op-value>`, as well as impacted client state.

> ⚠︎ *This specification is beta quality. Anywhere there is a conflict between this specification and the first implementation of this specification (Chelonia) is a bug. Please let us know if you come across any contradictions between specification and Chelonia.*

### `OP_CONTRACT`

Creates a new contract, publicly specifying what type of contract it is, and includes the initial set of authorized keys. The format for specifying keys should match the format of [`OP_KEY_ADD`](#op_key_add).

- Opcode: `"c"`

```json
{
  "type": "<contract name>",
  "keys": <op-key-add>
}
```

For `<op-key-add>` definition, see value for [`OP_KEY_ADD`](#op_key_add).

**Affected state:**

- When clients receive `OP_CONTRACT`, they initialize an empty state for this contract instance. See ["Contract & VM State"](/en/message-processing#contract--vm-state) for details.
- The state is further updated according to the rules of [`OP_KEY_ADD`](#op_key_add) when processing `"keys"`.

### `OP_ACTION_UNENCRYPTED`

Invokes an action on the contract. Most contract messages will use either [`OP_ACTION_ENCRYPTED`](#op_action_encrypted) or `OP_ACTION_UNENCRYPTED` opcodes. We cover the unencrypted version first because the encrypted version is effectively the same (but encrypted).

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

**Affected state:**

- Actions typically directly alter the state of the contract by adding, updating, or removing keys from [the root contract state](/en/message-processing#contract--vm-state). They typically do not result in modifications or interations with special state like `_vm` or `_volatile`.

### `OP_ACTION_ENCRYPTED`

Converts the message data of [`OP_ACTION_UNENCRYPTED`](#op_action_unencrypted) into a JSON string using `JSON.stringify` and encrypts it using `"<keyId>"`.

- Opcode: `"ae"`

```json
["<keyId>", encrypt("<key>", JSON.stringify(<data>))]
```

**Affected state:**

- Same as [`OP_ACTION_UNENCRYPTED`](#op_action_unencrypted).

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
    "ringLevel": <positive-integer-or-zero>,
    "foreignKey": "sp:[<host.com>/contract/]<contractID>?keyName=<foreignKeyName>", // OPTIONAL
    "meta": { ... } // OPTIONAL
  },
  // key 2
  {
    // ...
  },
  // ...
]
```

`"id"` is a [`multihash`](https://github.com/multiformats/multihash) of the `"data"` of the key.

`"name"` names the key. Key names must be unique, and one of them should use the name `"#csk"`. Names beginning with `#` might have special meaning in the protocol. Examples of special key names include:

- `#csk`: as mentioned, this key is used to represent the contract itself, and is especially important when it comes to cross-contract communication via `"foreignKey"`
- `#cek`: this is the `Contract Encryption Key`. It is a key that is most often used to encrypt data within the contract. Contracts that wish to send encrypted data to this contract will use the `#cek`.
- `#inviteKey-`: is used to define [invite keys for creating and joining groups.](/en/invite-keys)

`"purpose"` is an array of strings that state the key's purpose. Typically this will be either `"sign"` (for signing messages), or `"enc"` for encrypting/decrypting messages, or it could be both. Other arbitrary values are allowed too if they are useful to protocol implementers.

`"data"` is a JSON string specifying the public key itself (other types of keys, like encrypted secret keys, are stored under `meta.private`). Key data a JSON stringified array of the following structure:

```
[type, publicKey, secretKey]: [string, string, null] | [string, null, string]
```

How the string for the `publicKey` and `secretKey` is generated depends on the key `type`. As an example, Chelonia — an implementation of Shelter Protocol — defines 3 key types based on its usage of the JavaScript library `tweetnacl`:

- `'edwards25519sha512batch'`
- `'curve25519xsalsa20poly1305'`
- `'xsalsa20poly1305'`

> ⚠︎ Shelter Protocol currently does not specify what these key types are, leaving it up to individual implementations to decide. Future protocol upgrades could standardize type names. For now, we encourage implementers to choose unique type names that are long and descriptive of the ciphers used.

`"permissions"` is a list of opcode values (e.g. `"ka"`, `"ae"`, etc.) that this key is allowed to perform. Alternatively, the special value `"*"` may be used to indicate all permissions are granted (to support extending the protocol with new opcodes).

`"ringLevel"` specifies which keys are allowed to replace other keys. Keys of a lower ring level can replace keys of a higher ring level using [`OP_KEY_UPDATE`](#op_key_update) or [`OP_KEY_DEL`](#op_key_del), but not vice versa. The lowest ring level is `0`, and the highest is `2^53-1` (`Number.MAX_SAFE_INTEGER`). The ring level must be the same or higher as the key sending this message.

`"foreignKey"` - if present, indicates that this entry is a reference copy of a key from another contract. A key with the name `<foreignKeyName>` on `<contractID>` must then be monitored for any updates, and those updates mirrored to this contract. If either [`OP_KEY_UPDATE`](#op_key_update) or [`OP_KEY_DEL`](#op_key_del) are called on the key on the `foreignKey`, then any client syncing this contract that has the ability to mirror those updates to this contract (they posses the appropriate `permissions` and `ringLevel`) must mirror those updates to this contract, if and only if the updates haven't already been mirrored. Mirroring stops once `OP_KEY_DEL` removes the key either on the foreign contract or locally on this contract.

> ⚠︎ Important considerations
> - To avoid name collisions, contracts must not copy a foreign key's name into this contract. Example: when adding a foreign `#csk` to a contract with an existing `#csk`, it is best to contextualize the key name, for example: `<contractID>/#csk`.
> - No proof is included showing `foreignKey` matches the key on the foreign contract because keys can be lost and replaced by other keys, and therefore there is no trivial way to include a proof that the keys match without mirroring all of the keys of the foreign contract.

`"meta"` - if present, specifies metadata for the key. A contract might want to include an encrypted copy of a private key for example, and in this case the `meta.private` field can be used for this purpose.

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
- The special boolean `meta.private.shareable` attribute indicates whether the private key can be shared with another contract using [`OP_KEY_SHARE`](#op_key_share) (in response to [`OP_KEY_REQUEST`](#op_key_request))

**Affected state:**

- `_vm.authorizedKeys` (a dictionary) is always modified by adding the shared key data to `_vm.authorizedKeys[<keyId>]`.
- `_volatile.keys` (a dictionary) is modified if `meta.private` can be decrypted by adding the serialized key (as a string) to `_volatile.keys[<keyId>]`
- `_volatile.pendingKeyRequests` (an array) is modified by `OP_KEY_ADD` as part of sending a [`OP_KEY_REQUEST`](#op_key_request): before `OP_KEY_REQUEST` is sent, we call `OP_KEY_ADD` on the `originatingContractID`, and when that is processed `{ id, name: signingKey.name }` is pushed to `pendingKeyRequests`. That entry is cleared once we receive the corresponding [`OP_KEY_SHARE`](#op_key_share).
- `_volatile.watch` (an array) has `[<keyName>, <externalContractID>]` added to it, to indicate that some other contract `<externalContractID>` has this `<keyName>` as a foreign key on it, so that we can push updates to back it.

### `OP_KEY_UPDATE`

This operation can be used to rotate an existing key, and/or update key properties like `"purpose"` or `"permissions"`.

When rotating a key, it acts as a `OP_KEY_DEL` and `OP_KEY_ADD`, deleting `<oldKeyId>` and then creating a similar key with different key `"data"`.

- Opcode: `"ku"`

```json
[
  {
    "name": "<keyName>",
    "id": "<newKeyId>", // optionally rotate key
    "oldKeyId": "<oldKeyId>",
    "data": "<newData>",  // optionally rotate key
    "purpose": [], // optionally update the purpose
    "permissions": [], // optionally update permissions (if previous permissions allow us)
    "meta": {} // optionally update metadata
  },
  // ...
]
```

Any updates to `"purpose"` or `"permissions"` must be sctrictly more restrictive.

> ⚠︎ Gotchas when mirroring `foreignKey` updates:
> - Contracts must not copy a foreign key's name into this contract, but instead should use a contextualized name. Example: when updating a foreign `#csk`, rename the key to: `<contractID>/#csk`.
> - It is possible to see the same `OP_KEY_UPDATE` twice because two clients might broadcast it simultaneously. If this happens, `oldKeyId` will be missing in the contract state, and implementations should ignore the duplicate message.

**Affected state:**

- The same as [`OP_KEY_ADD`](#op_key_add), with the exception of `_volatile.pendingKeyRequests`, which should not be modified by this opcode.
- `_vm.revokedKeys` (a dictionary) is updated to move the `oldKeyId` from `_vm.authorizedKeys` into `_vm.revokedKeys`, so that future clients syncing the state are still able to decrypt old messages.

### `OP_KEY_DEL`

Specifies an array of keyIds to delete from the contract. Deleted keys can no longer be used to perform any actions on the contract, and this is enforced by the server.

- Opcode: `"kd"`

```json
["<keyId-1>", "<keyId-2>", ... ]
```

Note that if a key is deleted, any contracts listening for updates to this key via [`foreignKey`](#op_key_add) will stop listening.

> ⚠︎ When mirroring `foreignKey` updates, it is possible to see the same `OP_KEY_DEL` twice because two clients might broadcast it simultaneously. If this happens, the key being deleted won't exist anymore, and implementations should ignore the duplicate message.

**Affected state:**

- `_vm.authorizedKeys[<keyId>]` is removed.
- `_volatile.watch` has any entries with the name of this key removed.

### `OP_KEY_REQUEST`

Allows contracts to request private keys from other contracts (shared via [`OP_KEY_SHARE`](#op_key_share)).

A real-world usecase for this opcode is in the handling of invites to join a group. To see how `OP_KEY_REQUEST` can be used in conjunction with a limited quantity of invites (or invites that expire), see [Reference: Invite Keys](/en/invite-keys).

> ⚠︎ Implementations should make sure that when an `OP_KEY_REQUEST` is issued from `contract A` to `contract B`, that `contract B` has the correct permissions to be able to send a response back with [`OP_KEY_SHARE`](#op_key_share). For example, implementations can ensure this by first issuing an [`OP_KEY_ADD`](#op_key_add) to `contract A` with [`OP_KEY_SHARE`](#op_key_share) permissions, for all of the keys in `contract B` that have [`KEY_REQUEST_SEEN`](#op_key_request_seen) permissions (as foreign keys).

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
- Only keys marked `"shareable": true` can be requested. See [`OP_KEY_ADD`](#op_key_add) for details.

**Affected state:**

- `_vm.pendingKeyshares` (a dictionary) is modified by adding a key/value pair where the key is this message's hash, and the value is an array `[<originatingContractID>, <previousHEAD>, <messageData>]`.

### `OP_KEY_REQUEST_SEEN`

The actual response to a properly formatted and authorized `OP_KEY_REQUEST` is an [`OP_KEY_SHARE`](#op_key_share) message, not `OP_KEY_REQUEST_SEEN`. However, because Shelter Protocol is an end-to-end encrypted protocol, it relies on end-user devices to send `OP_KEY_SHARE` messages whenever they are online and able to. Therefore, in order to prevent multiple `OP_KEY_SHARE` messages from being sent, we need a way to mark a key request as being responded to. This is the purpose of `OP_KEY_REQUEST_SEEN`.

- Opcode: `"krs"`

```json
{
  "keyRequestHash": "<hash of original OP_KEY_REQUEST message>",
  "success": true | false
}
```

Note that unlike `OP_KEY_SHARE`, `OP_KEY_REQUEST_SEEN` is sent to the contract that is responding to the `OP_KEY_REQUEST`.

It's theoretically possible that for some reason a client wasn't able to send `OP_KEY_SHARE` but was able to send `OP_KEY_REQUEST_SEEN`. For example, the requesting contract might have been deleted. In this rare case `"success"` would be set to `false`. It is up to client implementations to decide how many unsuccessful attempts they will tolerate before giving up. To avoid bloating the contract chain, we recommend a 3-strike rule, and no more than 5 unsuccessful attempts.

**Affected state:**

- `_vm.pendingKeyshares` (a dictionary) has the mapping for key `keyRequestHash` removed.

### `OP_KEY_SHARE`

Shares encrypted private keys with this contract. Can be in response to [`OP_KEY_REQUEST`](#op_key_request) or not.

It can be very useful for selectively revealing information to specific entities, or allowing other contracts to write to this contract. In this sense it is similar (though different in mechanism) to [`"foreignKey"`](#op_key_add).

Important: this is one of the few opcodes that can be sent to any contract without permission. A contract can send this opcode once without permission. In that case, the receiving client will prompt the user to decide whether or not to add this private key. This can be useful when designing direct-messaging systems.

- Opcode: `"ks"`

```json
{
  "contractID": "<the contractID of the contract sending this message>",
  "keyRequestHash": "<hash of original OP_KEY_REQUEST message>", // included if a response
  "keys": [
    {
      "id": "<keyId>",
      "meta": {
        "private": {
          "keyId": "<encryptionKeyId>",
          "content": "<base64 encoding of encrypted secret key>",
          "shareable": true
        }
      }
    },
    // ...
  ]
}
```

Notes:

- `<encryptionKeyId>` is the key used to encrypt `content`, and it is the same `encryptionKeyId` as the one sent in the corresponding `OP_KEY_REQUEST`.
- `keyRequestHash` is included if this `OP_KEY_SHARE` is being sent in response to an `OP_KEY_REQUEST` message.

**Affected state:**

- `_volatile.keys` (a dictionary) for the contract `"contractID"` is set with the key/value pair `<keyId>` and the decrypted `meta.private.content`.
- `_volatile.pendingKeyRequests` (an array) has the corresponding key request removed.

### `OP_PROP_SET`

Sets key-value property pairs on this contract.

- Opcode: `"ps"`

```json
[
  ["<key1>", JSONType],
  ["<key2>", JSONType],
  // ...
]
```

This can be useful for configuring protocol features like [state snapshots](/en/state-snapshots).

**Affected state:**

- TBD. Most likely `_vm.props` (a dictionary).

### `OP_PROP_DEL`

Removes key-value property pairs from this contract.

- Opcode: `"pd"`

```json
["<key1>", "<key2>", ... ]
```

**Affected state:**

- TBD. Most likely `_vm.props` (a dictionary).

### `OP_WRITE_REQUEST`

Requests permission to write to a contract. The only opcode that is allowed to be sent unsolicited and without permission to another contract.

- Opcode: `"wr"`

```json
{
  "username": "<username>",
  "keyAdd": {
    // OP_KEY_ADD
  },
  "keyShare": {
    // optional OP_KEY_SHARE
  }
}
```

- `username` specifies the name of the username of the sender. The server and receiving client both need to verify that this message is signed with the key that's in `keyAdd`, and the `username` maps to that same `originatingContractID`. 256 byte limit.
- `keyAdd` - an [`OP_KEY_ADD`](#op_key_add) to add to this contract if the request is approved via [`OP_WRITE_REQUEST_RESPONSE`](#op_write_request_response). The following restrictions must be enforced:
  - The key `name` must not be a reserved name (like `#csk`, `#cek`, or anything beginning with `#`)
  - The key `name` must not conflict with an existing key name on this contract
  - It must specify `foreignKey`
  - If the receiving contract does not approve of the `permissions` or `ringLevel` being requested, it must reject this request.
  - Clients and servers should enforce strict limits for the length of values for the fields of the key's `meta` data.
- `keyShare` - optionally offers to share a private key via [`OP_KEY_SHARE`](#op_key_share), if approved. Clients and servers should enforce strict limits on the length of values for the fields of the key's `meta` data.

<!-- TODO: address rate limiting -->

**Affected state:**

- TBD. Most likely something under `_vm`.
- Additionally, any state affected by [`OP_KEY_ADD`](#op_key_add) and [`OP_KEY_SHARE`](#op_key_share).

### `OP_WRITE_REQUEST_RESPONSE`

Approves or rejects a prior [`OP_WRITE_REQUEST`](#op_write_request).

The contract that sent `OP_WRITE_REQUEST` should be monitoring this contract for this message.

- Opcode: `"wrr"`

```json
{
  "requestHash": "<requestHash>",
  "approved": true | false
}
```

- `requestHash` is the message hash of the corresponding [`OP_WRITE_REQUEST`](#op_write_request).
- `approved` - if `true`, processes any `keyAdd` and `keyShare` instructions from the corresponding request.

**Affected state:**

- TBD. Most likely something under `_vm`.

### `OP_ATOMIC`

Combines several opcodes into one and applies them sequentially. If any operation fails, the entire operation fails and the state is reverted.

- Opcode: `"a"`

```json
[
  ["<opcode-1>", <op-value-1>],
  ["<opcode-2>", <op-value-2>]
  // ...
]
```

**Affected state:**

- The corresponding affected state of each included opcode.
