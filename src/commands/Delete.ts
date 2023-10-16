import { CommandContext, CommandOptionType, SlashCreator } from "slash-create"

import BaseCommand from "../BaseCommand.js"
import env from "../config/env.js"
import { deleteUserAvatar } from "../utils/index.js"

export default class Delete extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "delete",
      description: "Delete the UserPFP for a user.",
      guildIDs: ["356272183166763008"],
      options: [{
        type: CommandOptionType.USER,
        name: "user",
        description: "The user to delete the avatar of. Moderator only."
      }],
      deferEphemeral: true
    })
  }

  async run(ctx: CommandContext) {
    const targetedUser = ctx.options.user ?? ctx.user.id

    if (targetedUser !== ctx.user.id && !ctx.member?.roles.includes(env.approvals.role)) {
      return ctx.send("You do not have permission to remove that user's pfp!", { ephemeral: true })
    }

    await deleteUserAvatar(targetedUser)
    return ctx.send("Successfully deleted", { ephemeral: true })
  }
}
