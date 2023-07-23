---
title: "Identity Contract"
description: "Shelter Protocol example: creating an Identity Contract"
---

Let's say we want to represent a user. To do this we need to define an Identity Contract.

### Defining a contract

Let's start with a skeleton. Here we will define a contract using the API of a JavaScript-based Shelter Protocol implementation called Chelonia. We create a file called `identity.js` with the following contents:

```js
import sbp from '@sbp/sbp'

sbp('chelonia/defineContract', {
  name: 'gi.contracts/identity',
  actions: {}
})
```

This defines an empty contract called `'gi.contracts/identity'` that is missing its constructor. Without a constructor we cannot create instances of this contract, so let's define that next.

> *Note: Chelonia makes extensive use of [SBP: Selector-based Programming](https://github.com/okTurtles/sbp-js).*

### Creating a constructor

The constructor is defined by defining an action with the same name as the name of the contract:

```js
sbp('chelonia/defineContract', {
  name: 'gi.contracts/identity',
  actions: {
    'gi.contracts/identity': {
      validate: objectMaybeOf({
        attributes: objectMaybeOf({
          username: string,
          email: string,
          picture: string
        })
      }),
      process ({ data }, { state }) {
        const initialState = merge({
          settings: {},
          attributes: {}
        }, data)
        for (const key in initialState) {
          Vue.set(state, key, initialState[key])
        }
      }
    }
  }
})
```

Actions are invoked on the contract by creating an [`SPMessage`](/en/spmessage) with either [`OP_ACTION_ENCRYPTED`](/en/opcodes#op_action_encrypted) or [`OP_ACTION_UNENCRYPTED`](/en/opcodes#op_action_unencrypted) and passing that message to the server's [`POST /event`](/en/server-api#event) API. The server then broadcasts that update to any clients that are interested in this contract.

The constructor is the first action invoked on a contract (and typically the second message sent to a contract, after [`OP_CONTRACT`](/en/opcodes#op_contract)).

For each action, Chelonia allows contracts to define validation functions and processing functions. The job of a validation function (`validate` in the code above) is to ensure the data is properly formatted so that it is safe to process. A validation function is called twice: once when the message is created (before sending it to the server), and again when clients recieve the message back from the server.

The `process` function is responsible for processing the message and updating the client's local state for the contract. Each process function will typically take the message `data`, and apply it to the `state`. Contract state is only ever updated in the process function, and these updates **must** happen synchronously. If contracts would like to execute side effects after processing messages, they can do so in a separate `sideEffect` function.

In our example above, the identity contract state becomes initialized with an initial state that might include our username, email, and profile picture, and then reactively updates any UI bindings that depend on those values.

Our example uses various imported functions:

- [`objectMaybeOf`](https://github.com/okTurtles/group-income/blob/d5d3267fa6c5755559e00b7f348f317c81969444/frontend/model/contracts/misc/flowTyper.js) verfies object key/value types from a modified version of `flow-typer-js`.
- [`merge`](https://github.com/okTurtles/group-income/blob/master/frontend/model/contracts/shared/giLodash.js#L54) is a utility function to merge two objects together.
- [`Vue.set`](https://v2.vuejs.org/v2/api/#Vue-set) is a way to reactively update key/value pairs from the VueJS 2.x framework.

### Updating attributes

We can create additional actions to update the contract's `state.attributes`:

```js
    'gi.contracts/identity/setAttributes': {
      validate: object,
      process ({ data }, { state }) {
        for (const key in data) {
          Vue.set(state.attributes, key, data[key])
        }
      }
    },
    'gi.contracts/identity/deleteAttributes': {
      validate: arrayOf(string),
      process ({ data }, { state }) {
        for (const attribute of data) {
          Vue.delete(state.attributes, attribute)
        }
      }
    },
```

Great! Now by invoking [`OP_ACTION_ENCRYPTED`](/en/opcodes#op_action_encrypted) we can update our email address.

In Chelonia, it looks like this:

```js
await sbp('chelonia/out/actionEncrypted', {
  action: 'gi.contracts/identity/setAttributes',
  contractID: this.loggedIn.identityContractID,
  data: {
    email: 'new@email.com'
  },
  signingKeyId: '<signingKeyId>',
  encryptionKeyId: '<encryptionKeyId>'
})
```

The selector `'chelonia/out/actionEncrypted'` will create our [`SPMessage`](/en/spmessage) for [`OP_ACTION_ENCRYPTED`](/en/opcodes#op_action_encrypted) and [send it](/en/server-api#event) to the server, which will then send the message back to us so that the `process` function for our local copy of the contract gets invoked with the new email address.

The signing and encryption keys are defined when we [create an instance of our contract](#creating-a-user).

### The complete contract

That's it!

This simple contract is capable of representing a user's identity in an end-to-end encrypted way. It is very useful as a starting base for any app.

```js
sbp('chelonia/defineContract', {
  name: 'gi.contracts/identity',
  actions: {
    'gi.contracts/identity': {
      validate: objectMaybeOf({
        attributes: objectMaybeOf({
          username: string,
          email: string,
          picture: string
        })
      }),
      process ({ data }, { state }) {
        const initialState = merge({
          settings: {},
          attributes: {},
          chatRooms: {}
        }, data)
        for (const key in initialState) {
          Vue.set(state, key, initialState[key])
        }
      }
    },
    'gi.contracts/identity/setAttributes': {
      validate: object,
      process ({ data }, { state }) {
        for (const key in data) {
          Vue.set(state.attributes, key, data[key])
        }
      }
    },
    'gi.contracts/identity/deleteAttributes': {
      validate: arrayOf(string),
      process ({ data }, { state }) {
        for (const attribute of data) {
          Vue.delete(state.attributes, attribute)
        }
      }
    }
  }
})
```

Note: Chelonia has more features (getters, metadata, methods, etc.), but those are application-specific features that are not relevant to Shelter Protocol and so won't be documented here.

### Creating a user

Identity management in an end-to-end encrypted world involves [managing secret keys](/en/multi-device).

For our example, we will use the user's password, along with a [salt](/en/zkpp), to generate two keypairs: an "Identity Proving Key" (IPK) and an "Identity Encryption Key" (IEK). These keys will be the "master keys" that we can use to prove our identity. We will also generate keys that can be used for day-to-day activities that do not require the user to enter their password each time they are used. We'll call these the "Contract Signing Key" (CSK) and the "Contract Encryption Key" (CEK), and we'll save them in encrypted form using the IEK.

Once we've generated the keys, and our contract code deployed to the server, we can create an instance of our contract using [`OP_CONTRACT`](/en/opcodes#op_contract):

```js
const user = await sbp('chelonia/out/registerContract', {
  contractName: 'gi.contracts/identity',
  publishOptions,
  signingKeyId: IPKid,
  actionSigningKeyId: CSKid,
  actionEncryptionKeyId: PEKid,
  keys: [
    {
      id: IPKid,
      name: 'ipk',
      purpose: ['sig'],
      ringLevel: 0,
      permissions: '*',
      data: IPKp
    },
    {
      id: IEKid,
      name: 'iek',
      purpose: ['enc'],
      ringLevel: 0,
      permissions: '*',
      data: IEKp
    },
    {
      id: CSKid,
      name: '#csk',
      purpose: ['sig'],
      ringLevel: 1,
      permissions: [OP_KEY_ADD, OP_KEY_DEL, OP_ACTION_UNENCRYPTED, OP_ACTION_ENCRYPTED, OP_ATOMIC, OP_CONTRACT_AUTH, OP_CONTRACT_DEAUTH, OP_KEY_SHARE],
      meta: {
        private: {
          keyId: IEKid,
          content: CSKs
        }
      },
      data: CSKp
    },
    {
      id: CEKid,
      name: '#cek',
      purpose: ['enc'],
      ringLevel: 1,
      permissions: [OP_ACTION_ENCRYPTED, OP_KEY_SHARE],
      meta: {
        private: {
          keyId: IEKid,
          content: CEKs
        }
      },
      data: CEKp
    }
  ],
  data: {
    attributes: { username, email, picture: finalPicture }
  }
})

const userID = user.contractID()

// subscribe to our new user contract
await sbp('chelonia/contract/sync', userID)
```

One final step is [registering our username](/en/server-api#name) so that it points to our identity contract:

```js
fetch(`${API_URL}/name`, {
  method: 'POST',
  body: JSON.stringify({ name: username, value: userID }),
  headers: {
    'Content-Type': 'application/json'
  }
})
```

Congratulations! Our user is now able to log in to their end-to-end encrypted account on any device! 😄🎉
