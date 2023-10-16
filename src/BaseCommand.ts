import { CommandContext, SlashCommand } from "slash-create"


export default class BaseCommand extends SlashCommand {
  onError(err: Error, ctx: CommandContext): any {
    console.error(err)
    return ctx.send(`An error was encountered: ${err.message}`, { ephemeral: true })
  }
}
