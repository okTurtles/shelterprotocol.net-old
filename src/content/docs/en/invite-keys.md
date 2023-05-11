---
title: "Invite Keys"
description: "Invite group members using invite keys"
---

Invite keys are an extension of the core protocol's definition of [`OP_KEY_ADD`](opcodes#op_key_add) to provide a standardized way for handling invitations for joining a group.

Specifically, invite keys are keys added using [`OP_CONTRACT`](opcodes#op_contract) or [`OP_KEY_ADD`](opcodes#op_key_add) that:

- Have a key `name` beginning with `#inviteKey-`
- Have `OP_KEY_REQUEST` in their [`permissions`](opcodes#op_key_add)
- Have the following metadata in `meta`:

```json
{
  "quantity": <positive-integer>,
  "creator": "<string>",
  "expires": <milliseconds-since-unix-epoch>,
  "private": {
    "keyId": "<keyId>",
    "content": "<encryptedKey>"
  }
}
```

These keys can then be shared using invite links. Protocol implementations will keep track of invite usage with each [`OP_KEY_REQUEST`](opcodes#op_key_request) call that is sent, and ensure that invites can only be used if there are enough of them and they are not expired.

Note:

- The private key for the invite key is included encrypted as part of `meta.private`, so that it can be decrypted by group members. It is encrypted using some other key that is known to group members.
- The private key is included *unencrypted* in the invite link, so that it can be used immediately to send an [`OP_KEY_REQUEST`](opcodes#op_key_request) by the recipient.
- Invite key names begin with `#inviteKey-` so that you can define as many of them as you'd like by appending a unique suffix.
