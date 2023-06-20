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
    "uuid": "<uuidv4>",
    "height": <uint>
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
- `op` is a short string representation of one of the various [opcodes](/en/opcodes) (e.g. `"c"` for [`OP_CONTRACT`](/en/opcodes#op_contract)).
- `manifest` is the [manifest hash](/en/contract-manifests) of the contract code used to interpret this message.
- `uuid` is a [UUIDv4](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_(random)) unique identifier for this message. Useful for uniquely identifying messages in case of `previousHEAD` conflicts. See [Resending Messages](#resending-messages).
- `height` is an counter starting at `0` that gets incremented by `1` with each new message added to the chain. Useful in certain situations related to validating message signatures on rotated keys.

### Section: `message`

This section contains the actual data payload for the `<opcode>` being invoked.

See [📚 Reference: Opcodes](/en/opcodes) for details.

### Section: `sig`

- `type` specifies a string describing the ciphers used with the key generating this signature. See [`OP_KEY_ADD`](/en/opcodes#op_key_add) for examples.
- `keyId` is the key `id` of the key used to generate this signature. See [`OP_KEY_ADD`](/en/opcodes#op_key_add).
- `data` is the message signature.

Generating the signature:

1. Hash the `head` JSON and the `message` JSON, concatenate these hashes together, and hash a third time:

   ```js
   blake32b(`${blake32b(headJSON)}${blake32b(messageJSON)}`)
   ```

2. Sign the resulting string using `<keyId>` and encode the `<signature>` using base64.

### Content Addressing

As mentioned, messages stored and referenced by their 32-byte blake2b [`multihash`](https://multiformats.io/multihash/) in order to ensure historical message integrity. Implementations should take care to verify that all received messages have the appropriate hash.

For example, contracts are sync'd by specifying their `contractID`. Implementations must make sure that when a `contractID` is newly synced, the first message actually does have a hash matching that `contractID`.

To help with syncing, the server has an API to return the latest hash of a contract chain that looks like this: [`/latestHash/{contractID}`](/en/server-api#latesthash)

During syncing of latest messages, clients should make sure to verify that hash appears among the messages received.

### Resending Messages

Messages are sent to the server using the [`POST /event`](/en/server-api#event) API. However, a conflict with the [`previousHEAD`](/en/spmessage#section-head) value could occur if someone else sent a message at the same time. In such situations we would want to reconstruct the message using the correct `previousHEAD` and resend it (repeating several times at random intervals until the message makes it in or we give up). The `POST /event` API conveniently gives us the latest message hash and height so that we can immediately recreate and resend the message upon conflict.

Usually we identify messages by their hash, but sometimes we want to know when a message we've sent makes it back to us in order to take some type of action. For example, when a user sends a message to a chatroom we might want to display it in grey until we receive it back.

In this situation, it's possible that the message will need to be recreated multiple times before it is successfully sent, resulting in a different message hash. If we set up event listeners related to the original message hash, they might never get run because a message with a different hash could be the one to actually make it in to the chain. For these types of situations the message [`uuid`](/en/spmessage#section-head) can be used as it remains consistent between recreated messages.
