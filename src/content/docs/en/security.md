---
title: "Security Considerations"
---

This is a non-exhaustive list of possible security considerations when developing using Shelter Protocol (and other protocols).

### Public-key cryptography

Quantum computers or flaws in ECC implementation or design. To mitigate against this possibility the protocol is designed to be upgradeable and agnostic to the ciphers used.

### Malicious Server Brute Forcing Password

If, instead of using [unique keys per device](multi-device#unique-keys-per-device), developers use [password salts](multi-device#using-salts-to-derive-private-keys-securely), servers will have access to password salts and therefore will be able to attempt to brute force weak passwords.

### Weak Passwords

If, instead of using [unique keys per device](multi-device#unique-keys-per-device), developers use [password salts](multi-device#using-salts-to-derive-private-keys-securely), then accounts could be compromised by either the server brute forcing the password (as mentioned above), or, in the case of password reuse, could be compromised if the user had an account on another server that was compromised, and reused that password on their account that is using Shelter Protocol.

### Malicious JavaScript

If the server is responsible for distributing the app itself, then it could inject malicious JavaScript to compromise the protocol. Alternatively, malicious JavaScript could be injected by [an HTTPS Man-in-the-Middle](https://www.youtube.com/watch?v=IjbzIV5ElCY) or by [browser extensions](https://www.youtube.com/watch?v=cIGESSm39n4).

The best way to mitigate against these attacks is to keep the distribution of the client software separate from the server that is used to store messages by bundling the JavaScript into an app using tools like [Tauri](https://github.com/tauri-apps/tauri), or [similar software](https://github.com/okTurtles/group-income/issues/263). However, that won't protect you from compromised app stores.

Additionally, Shelter Protocol implementations themselves could be compromised through [supply](https://harry.garrood.me/blog/malicious-code-in-purescript-npm-installer/) [chain](https://www.youtube.com/watch?v=8Byayr0jGm4) [attacks](https://www.youtube.com/watch?v=yakdmSt8-sU) on the dependencies used to implement the software.

The best way to mitigate against these types of attacks is for developers to avoid using dependencies. If that is not possible, then the next best thing is to avoid installing unnecessary dependencies, or dependencies that themselves have other dependencies. Other approaches, like using automated software analysis [tools](https://snyk.io/), conducting thorough pull request reviews, and security audits, are also helpful.

### Malicious Contracts & Sandbox Escape

If Shelter Protocol implementations incorrectly implement their [sandbox](message-processing#sandbox), then it's possible that malicious contracts loaded by users could result in compromised data. To mitigate against this, make sure to conduct security audits of sandbox approaches and only load contracts from trusted developers.

### Compromised End-User Devices

The end-user device could have malware installed on it such as keyloggers, rootkits, or other malware. It's also possible that the [hardware](https://puri.sm/posts/deep-dive-into-intel-me-disablement/) [of the](https://hackaday.com/2016/11/28/neutralizing-intels-management-engine/) [end-user](https://www.blackhat.com/eu-17/briefings/schedule/#how-to-hack-a-turned-off-computer-or-running-unsigned-code-in-intel-management-engine-8668) [device](https://www.theregister.com/2017/08/29/intel_management_engine_can_be_disabled/) [is compromised](https://www.theregister.com/2017/11/20/intel_flags_firmware_flaws/) [by manufacturers](https://safefirmware.com/amdflaws_whitepaper.pdf) [in some way](https://arstechnica.com/information-technology/2018/03/a-raft-of-flaws-in-amd-chips-make-bad-hacks-much-much-worse/) (intentionally or otherwise). There is nothing Shelter Protocol (or any other protocol) can do to defend against these types of end-user compromise.
