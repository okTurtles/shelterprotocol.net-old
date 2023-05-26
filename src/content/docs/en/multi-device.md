---
title: "Multiple Devices"
description: "Handling multiple devices with the Shelter Protocol"
---

Shelter Protocol replicates the traditional username/password experience users are accustomed to, while dramatically improving security using end-to-end encryption (e2e). In this document we'll explore how this is accomplished in the context of multiple devices.

### Traditional Approaches

Traditional approaches for e2e protocols will generate unique private keys for each device a user logs in with. This method requires that the protocol design special mechanisms for associating the different keys with one account, and then creating a shared secret between those devices that can be used to decrypt messages.

While this unique-key-per-device approach works, it has a few significant drawbacks:

1. How do users login on a new device? These protocols often require extra steps that user must take to approve a login from a new device (for example, scanning a QR code).
2. What happens if a user loses all of their devices? Do they lose access to their account even if they know their username and password?
3. Both the protocol and sometimes the UI must be complicated a bit to accommodate device management.

What's interesting about the unique-key-per-device approach — let's call it UKPD — is that the user's password is not actually the means by which a user authenticates themselves. Instead, the password is used to encrypt the unique key on each device, and that key in turn is what actually authenticates the user. Because of this, if the user loses all of their devices, they have no way to log back in to their account, even if they know their password.

To address this issue, UKPD protocols either ask the user to save a secret "seed phrase" somewhere, or use the user's password to encrypt device secret keys and store them on the server for later retrieval. Both of these approaches are problematic:

- Users will never memorize seed phrases, especially today when dozens of apps use this approach, each asking the user to either memorize 12 random works or write them down somewhere. This is unreasonable and insecure. They could have simply made the seed phrase the password. In fact, this is the standard recommendation, that users save the seed phrase in a password manager. However, seed phrases can be difficult to remember, and simpler passwords are easier to brute force. We'll go over how Shelter Protocol addresses this next.
- With the approach of encrypting private keys and saving them to the server, there is no longer a need for having unique keys per device. If the encryption is done naively using just the user's password directly, it can make it easier for attackers to decrypt their private key using brute force methods.

### How Shelter Protocol Handles Multiple Devices

Shelter Protocol says, "Hey, passwords aren't going anywhere. They're cool. They're how we authenticate ourselves using just our mind. No fancy dongles required. If users use weak passwords they can be brute forced, so let's focus on addressing that problem."

In the Shelter Protocol, the secret key is derived directly from the password. This can be done on any device you log in to, without needing QR codes — just how users expect it to work!

However, users are bad at creating good passwords. So what's needed is a random [*password salt*](https://en.wikipedia.org/wiki/Salt_(cryptography)). But how do we retrieve it on a brand new device without revealing our password to the server?

For this, Shelter Protocol uses a [zero-knowledge sub-protocol for storing and retrieving passwords salts](zkpp). This makes it possible for users to keep their traditional username/password flow while maintaining a very high level of security. Users are still able to login from any device using just their username and password. The user is able to prove to the server in a zero-knowledge way that they know their password, and thereby retrieve the salt needed to compute their private key.

📚 [**Reference: ZKPP**](zkpp)