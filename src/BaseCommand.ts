import * as console from "console"
import { CommandContext, SlashCommand, SlashCommandOptions, SlashCreator } from "slash-create"

import env from "./config/env.js"

export default class BaseCommand extends SlashCommand {
  constructor (creator: SlashCreator, opts: SlashCommandOptions) {
    super(creator, {
      guildIDs: [env.approvals.guild],
      ...opts
    })
  }

  onError (err: Error, ctx: CommandContext): any {
    console.error(err)
    return ctx.send(`An error was encountered: ${err.message}`, { ephemeral: true })
  }
}
