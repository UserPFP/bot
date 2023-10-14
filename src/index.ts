import type { Server as HttpServer } from "node:http"
import type { Http2SecureServer, Http2Server } from "node:http2"
import type { Server as HttpsServer } from "node:https"

import { GatewayServer, SlashCreator } from "slash-create"

import commands from "./commands/index.js"
import componentHandler from "./componentHandler.js"
import client from "./config/client.js"
import env from "./config/env.js"

// Exit (somewhat) gracefully
function gracefulExit (signal: string) {
  client.disconnect(false)
  statusServer?.close()
  process.kill(process.pid, signal)
}
process.on("SIGINT", gracefulExit)
process.on("SIGTERM", gracefulExit)
client.on("error", () => gracefulExit("SIGTERM"))


const creator = new SlashCreator({
  ...env.discord,
  client: client
})

creator.withServer(new GatewayServer(handler => {
  client.on("packet", event => {
    if (event.t === "INTERACTION_CREATE") {
      // @ts-ignore defined types don't quite line up but they're the same
      handler(event.d)
    }
  })
}))

creator.registerCommands(commands)
creator.syncCommands()

creator.on("componentInteraction", componentHandler)

type AnyServer = HttpServer | HttpsServer | Http2Server | Http2SecureServer
let statusServer: AnyServer|undefined
if (process.env.DOCKER === "TRUE") {
  console.log("[INFO] Docker detected, starting status server")
  const { default: StatusServer } = await import("@uwu-codes/status-server")
  statusServer = StatusServer(() => client.ready)
}

await client.connect()
