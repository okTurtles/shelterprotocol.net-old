---
title: "Server API"
description: "Server API for the Shelter Protocol"
---

In a Shelter Protocol app, the server component is the simplest part of the system, containing the least amount of code. However, some server API is needed to enable specific features:

- Writing and reading contract chains
- File attachments
- Registering usernames
- Features related to the [zero-knowledge password protocol](zkpp)
- Features related to federation
- As well as other features (to be documented in future versions of this documentation)

This page describes those APIs.

## Writing & Reading Contracts

### /event

`POST /event`

API writing the JSON of an [`SPMessage`](spmessage) to end of a contract (or creating a new contract). The body is just the JSON of the `SPMessage`.

Returns HTTP Status `409 Conflict` if a message with the same `previousHEAD` already exists in the chain.

### /eventsSince

`GET /eventsSince/{contractID}/{since}`

### /eventsBefore

`GET /eventsBefore/{before}/{limit}`

### /eventsBetween

`GET /eventsBetween/{startHash}/{endHash}`

### /latestHash

`GET /latestHash/{contractID}`

### /time

`GET /time`

Returns the server's time as an [ISO String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString). Very important for ensuring clients use synchornized timestamps on messages.

## File Attachments

### /file

`POST /file`

### /file/{hash}

`GET /file/{hash}`

## Username Registration

### /name

`POST /name`

### /name/{name}

`GET /name/{name}`

## Zero-knowledge Password Protocol

See [ZKPP](zkpp) documentation for details.

### /zkpp/register/{contract}

`POST /zkpp/register/{contract}`

### /zkpp/{contract}/auth_hash

`GET /zkpp/{contract}/auth_hash`

### /zkpp/{contract}/contract_hash

`GET /zkpp/{contract}/contract_hash`

### /zkpp/updatePasswordHash/{contract}

`POST /zkpp/updatePasswordHash/{contract}`

## Federation

Coming Soon.

