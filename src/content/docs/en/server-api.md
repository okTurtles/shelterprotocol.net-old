---
title: "Server API"
description: "Server API for the Shelter Protocol"
---

In a Shelter Protocol app, the server component is the simplest part of the system, containing the least amount of code. However, some server API is needed to enable specific features:

- Writing and reading contract chains
- File attachments
- Registering usernames
- Features related to the [zero-knowledge password protocol](zkpp)
- Subscribing to events
- Features related to federation
- As well as other features (to be documented in future versions of this documentation)

This page describes those APIs.

## Writing & Reading Contracts

### /event

`POST /event`

API writing the JSON of an [`SPMessage`](spmessage) to end of a contract (or creating a new contract). The body is just the JSON of the `SPMessage`.

Returns HTTP Status `409 Conflict` if a message with the same `previousHEAD` already exists in the chain.

### /eventsAfter

`GET /eventsAfter/{contractID}/{since}`

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

## Subscribing to Events

The server runs a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) for broadcasting new messages to interested clients.

Messages sent between client & server are JSON objects with a `type` attribute:

```js
{ "type": TYPE, ... }
```

We'll categorize messages by type and whether they are sent by the client or server:

### Client: 'sub'

```json
{ "type": "sub", "contractID": "<contractID>", "dontBroadcast": true | false }
```

Client subscribes to a contract for subsequent [`"entry"`](#server-entry) events.

### Client: 'unsub'

```json
{ "type": "sub", "contractID": "<contractID>", "dontBroadcast": true | false }
```

### Client: 'pong'

```json
{ "type": "pong", "data": "<copy-of-server-ping-data>" }
```

Client responds to server `"ping"` by echoing `"data"` back to it.

### Server: 'sub'

```json
{ "type": "sub", "data": { "contractID": "<contractID>", "socketID": "<socketID>" } }
```

Server notifies clients already subscribed to `"contractID"` of a new subscriber.

### Server: 'unsub'

```json
{ "type": "unsub", "data": { "contractID": "<contractID>", "socketID": "<socketID>" } }
```

Server notifies clients already subscribed to `"contractID"` of an unsubscriber.

### Server: 'entry'

```json
{ "type": "entry", "data": "<spmessage-json>" }
```

Server broadcasts an [`SPMessage`](spmessage) to subscribers of a contract.

### Server: 'success'

```json
{ "type": "success", "data": { "type": "sub" | "unsub", "contractID": "<contractID>" } }
```

Server response to client's request to subscribe or unsubscribe to a `"contractID"` upon success.

### Server: 'error'

```json
{ "type": "error", "data": <client-data> }
```

Server response to client's request to subscribe or unsubscribe to a `"contractID"` upon failure.

`"data"` contains a copy of the `"data"` sent by the client.

### Server: 'ping'

```json
{ "type": "ping", "data": <unix-ms> }
```

Server sends ping to clients so that they can detect connection issues. `"data"` contains value returned by [`Date.now()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now).

## Federation

Coming Soon.

