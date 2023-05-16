---
title: "SPMessage"
description: "Reference for SPMessage"
---

The fundamental building block of the Shelter Protocol, `SPMessage`, is composed of three sections: `head`, `message`, and `sig`:

```json
{
  "head": JSON.stringify({
    "version": "1.0.0",
    "previousHEAD": null | "<previousHEAD>",
    "contractID": null | "<contractID>",
    "originatingContractID": null | "<contractID>",
    "op": "<opcode>",
    "manifest": "<manifest-hash>",
    "nonce": "<uuidv4>"
  }),
  "message": JSON.stringify(<op-value>),
  "sig": {
    "type": "<sig/key type>",
    "keyId": "<keyId>",
    "data": "<signature>"
  }
}
```

Wherever hashes appear in the protocol, they are 32-byte [blake2b](https://www.blake2.net/) hashes prefixed using [`multihash`](https://multiformats.io/multihash/) unless otherwise noted.

### Section: `head`

- `version` specifies the Shelter Protocol version being used.
- `previousHEAD` specifies the hash of the previous message in this contract chain, or `null` if this is the first message.
- `contractID` specifies the hash of the first message in the contract chain that this message is being sent to, or `null` if this is the first message.
- `originatingContractID` if this is a message from one contract to another, this field specifies the `contractID` of the contract sending the message, and `null` otherwise.
- `op` is a short string representation of one of the various [opcodes](opcodes) (e.g. `"c"` for [`OP_CONTRACT`](opcodes#op_contract)).
- `manifest` is the [manifest hash](contract-manifest) of the contract code used to interpret this message.
- `nonce` is a [UUIDv4](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random)) unique identifier for this message. Useful for uniquely identifying messages in the case where a message needs to be resent multiple times due to `previousHEAD` conflicts.

### Section: `message`

This section contains the actual data payload for the `<opcode>` being invoked.

See [📚 Reference: Opcodes](opcodes) for details.

### Section: `sig`

- `type` specifies a string describing the ciphers used with the key generating this signature. See [`OP_KEY_ADD`](opcodes#op_key_add) for examples.
- `keyId` is the key `id` of the key used to generate this signature. See [`OP_KEY_ADD`](opcodes#op_key_add).
- `data` is the message signature.

Generating the signature:

1. Hash the `head` JSON and the `message` JSON, concatenate these hashes together, and hash a third time:

   ```js
   blake32b(`${blake32b(headJSON)}${blake32b(messageJSON)}`)
   ```

2. Sign the resulting string using `<keyId>` and encode the `<signature>` using base64.