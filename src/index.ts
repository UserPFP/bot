import { GatewayServer, SlashCreator } from "slash-create"

import commands from "./commands/index.js"
import componentHandler from "./componentHandler.js"
import client from "./config/client.js"
import env from "./config/env.js"


const creator = new SlashCreator({
  ...env.discord,
  client: client
})

creator.withServer(new GatewayServer(handler => {
  client.on("packet", event => {
    if (event.t === "INTERACTION_CREATE") {
      // @ts-ignore
      handler(event.d)
    }
  })
}))

creator.registerCommands(commands)
creator.syncCommands()

creator.on("componentInteraction", componentHandler)

await client.connect()
