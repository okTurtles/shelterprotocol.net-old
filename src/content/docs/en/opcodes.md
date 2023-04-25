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

Creates a new contract, publicly specifying what type of contract it is, and includes the initial set of authorized keys. The format for specifying keys should match the format of `OP_KEY_SET`.

- Opcode: `"c"`

```json
{
  "type": "<contract name>",
  "keys": <op-key-add>
}
```

For `<op-key-add>` definition, see value for [`OP_KEY_ADD`](#op_key_add).

### `OP_KEY_ADD`

Adds keys 

- Opcode: `"ka"`

```json
[
  // key 1
  {
    "id": "<keyId>",
    "type": "<keyType>",
    "data": "<key as string>",
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
