---
title: "Multiple Devices"
description: "Handling multiple devices with the Shelter Protocol"
---

Shelter Protocol can replicate the traditional username/password experience users are accustomed to, while dramatically improving security using end-to-end encryption (E2E). In this document we'll explore how this is accomplished in the context of multiple devices.

### Introduction

E2E protocols often generate unique private keys for each device a user logs in with. This method requires that the protocol design mechanisms for associating the different keys with one account, and then sharing a secret between those devices that can be used to decrypt messages across all devices.

While this unique-key-per-device approach works, and [can be used with Shelter Protocol (see below)](#unique-keys-per-device), it has a few significant drawbacks:

1. How do users log in on a new device? This approach often requires extra steps the user must take to approve a login from a new device (for example, scanning a QR code).
2. What happens if a user loses all of their devices? Do they lose access to their account even if they know their username and password?
3. Both the protocol and sometimes the UI must be complicated a bit to accommodate device management.

What's interesting about the unique-key-per-device approach — let's call it UKPD — is that the user's password is not actually the means by which a user authenticates themselves. Instead, the password is used to encrypt the unique key on each device, and that key in turn is what actually authenticates the user. Because of this, if the user loses all of their devices, they have no way to log back in to their account, even if they know their password.

To address this issue, UKPD protocols either ask the user to save a secret "seed phrase" somewhere, or use the user's password to encrypt device secret keys and store them on the server for later retrieval. Both of these approaches can be problematic:

- Users will never memorize seed phrases, especially today when dozens of apps use this approach, each asking the user to either memorize 12 random works or write them down somewhere. Users are unlikely to memorize a single seed phrase, let alone multiple. The standard recommendation is to save the seed phrase to a password manager. Well, if we're going to do that, we might as well use the [password-based approach](#using-salts-to-derive-private-keys-securely) anyway with a strong random password.
- With the approach of encrypting private keys and saving them to the server, there is no longer a need for having unique keys per device in the first place. If the encryption is done naively using just the user's password directly, it can make it easier for attackers to decrypt their private key using brute force methods.

Shelter Protocol supports both UKPD, as well as a more user-friendly method using password salts.

### Using Salts to Derive Private Keys Securely

Shelter Protocol says, "Hey, passwords aren't going anywhere. They're cool. They're how we authenticate ourselves using just our mind. No fancy dongles required. If users use weak passwords they can be brute forced, so let's focus on addressing that problem."

We can derive the secret key directly from the password. This allows users to log in on any device without needing QR codes. To help protect against brute force attacks, we can use a random [*password salt*](https://en.wikipedia.org/wiki/Salt_(cryptography)). One question remains: how do we retrieve the salt from the server on a brand new device without revealing our password to the server?

For this, Shelter Protocol introduces a [zero-knowledge sub-protocol for storing and retrieving passwords salts](/en/zkpp). This makes it possible for users to keep their traditional username/password flow while maintaining a very high level of security. Users are still able to log in from any device using just their username and password. The user is able to prove to the server in a zero-knowledge way that they know their password, and thereby retrieve the salt needed to compute their private key.

The downside of this approach is that while we protect the secret key from being easilly brute forced by outsiders, the server itself can still attempt to brute force the password.

📚 [**Reference: ZKPP**](/en/zkpp)

### Unique Keys Per Device

It is possible to use Shelter Protocol with a UKPD approach if desired.

Shelter Protocol defines the following primitives for key management and key sharing:

- [`OP_KEY_ADD`](/en/opcodes#op_key_add)
- [`OP_KEY_UPDATE`](/en/opcodes#op_key_update)
- [`OP_KEY_DEL`](/en/opcodes#op_key_del)
- [`OP_KEY_REQUEST`](/en/opcodes#op_key_request)
- [`OP_KEY_REQUEST_SEEN`](/en/opcodes#op_key_request_seen)
- [`OP_KEY_SHARE`](/en/opcodes#op_key_share)
- [`OP_WRITE_REQUEST`](/en/opcodes#op_write_request)
- [`OP_WRITE_REQUEST_RESPONSE`](/en/opcodes#op_write_request_response)

Using these primitives, one can build a system that gives multiple devices (read: multiple keys) control over a smart contract. This typically involves using [`OP_KEY_ADD`](/en/opcodes#op_key_add) to add each device key to the contract. [`OP_KEY_SHARE`](/en/opcodes#op_key_share) can then be used to share a shared secret. More complicated schemes can be devised as well.
