---
title: "Introduction"
description: "Docs intro"
---

### What?

The Shelter Protocol is a protocol for creating end-to-end encrypted, federated, user-friendly web applications.

### Why?

Traditional web applications are inherently vulnerable to various types of data breaches and privacy violations.

By design, traditional web applications enable server administrators to monitor all user activities. Although these web apps offer “privacy settings” to users, they fail to provide any real privacy protection. Consequently, these applications are prone to frequent hacks, resulting in billions of dollars of damages and social costs from compromised private data.

The Shelter Protocol addresses these challenges by reinventing the entire web application design process.

Shelter Protocol introduces new ways to handle logins and data storage on the server while preserving the conventional username/password experience that users are familiar with. Instead of storing data in a database in clear text on the server, data can now be end-to-end encrypted and synced across multiple devices, and even across servers operated by different individuals.

The best part is that users do not need to manage keys or memorize 12-word seed phrases. Despite the use of public-private key cryptography in the background, users can still use the traditional username/password login approach with radically enhanced security.

<!-- With the Shelter Protocol, users and server administrators can enjoy blockchain-like security without needing to use a blockchain. Shelter Protocol enables the creation of web apps that respect users' data privacy for everyone. -->

With the Shelter Protocol, users can enjoy real privacy and security features in end-to-end encrypted apps that feel like traditional web applications.

### How?

The Shelter Protocol (SP) defines operations for a high-level, lightweight, federated, end-to-end encrypted virtual machine.

This virtual machine defines operations ("op codes") for managing keys, defining so-called "smart contracts" (computer programs), and performing both encrypted and unencrypted actions.

Unlike most virtual machines, SP operations are high-level. They do not specify low-level bitwise operations, but high-level actions that can then be interpreted by a smart contract written in any language.

The Shelter Protocol is designed to be used by a corresponding framework & virtual machine that handles creating and processing all of these operations to build up a shared state across many clients and devices.

The Shelter Protocol consists of the following components:

- **Op Codes for Defining Contracts and Actions**

And Related Components:

- **A Key-Value Store For Storing State**
- **A Namespace For Mapping Usernames To Identity Contracts**
- **A Zero-Knowledge Protocol For Storing & Retrieving Password Salts**
