import { Client } from "oceanic.js"

import env from "./env.js"

export default new Client({
  auth: `Bot ${env.discord.token}`
})
