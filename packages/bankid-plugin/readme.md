# Flink BankID plugin

A FLINK plugin used to authenticate and sign using Swedish BankID.

This plugin can either be used as a Flink Auth Plugin and/or used as a regular plugin depending on your use case.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/bankid-plugin
```

The plugin adds API on the context.

To start a sign session:

```typescript
const signSession = await ctx.bankId.sign({
    // Users personal number
    personalNumber: "199909091234",
    // Users IP
    endUserIp: "80.215.70.102",
    // Text visible to user in BankID app
    text: "Please sign this",
});

const signResult = await signSession.collect();

// if you for some reason want to cancel:
// await signSession.cancel()

if (signResult.success) {
    // Yay
} else {
    // Nay
}
```

To start an auth session:

```typescript
const authSession = await ctx.bankId.auth({
    // Users personal number
    personalNumber: "199909091234",
    // Users IP
    endUserIp: "80.215.70.102",
});

const authResult = await authSession.collect();

// if you for some reason want to cancel:
// await authResult.cancel()

if (authResult.success) {
    // Yay
} else {
    // Nay
}
```
