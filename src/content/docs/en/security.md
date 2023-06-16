---
title: "Security Considerations"
---

This is a non-exhaustive list of possible security considerations when developing using Shelter Protocol.

### Public-key cryptography

Quantum computers or flaws in ECC implementation or design. Protocol is upgradeable and agnostic to cryptography used.

### Malicious Server Brute Forcing Password

If instead of using [unique keys per device](multi-device#unique-keys-per-device) developers use [password salts](multi-device#using-salts-to-derive-private-keys-securely), then servers will have access to those salts and therefore will be able to attempt to brute force weak passwords.

### Malicious JavaScript

If the server is responsible for distributing the app itself, then it could inject malicious JavaScript to compromise the protocol. Alternatively, malicious JavaScript could be injected by [an HTTPS Man-in-the-Middle](https://www.youtube.com/watch?v=IjbzIV5ElCY).

The best way to mitigate against this is to keep the distribution of the client software separate from the server that is used to store messages.

### Malicious Contracts & Sandbox Escape

If Shelter Protocol implementations incorrectly implement their [sandbox](message-processing#sandbox), then it's possible that malicious contracts loaded by users could result in compromised data. To mitigate against this, make sure to conduct security audits of sandbox approaches and only load contracts from trusted developers.
