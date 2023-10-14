import { ButtonStyles, ComponentTypes } from "oceanic.js"
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from "slash-create"

import client from "../config/client.js"
import { ImageError, validateImage } from "../utils/images.js"

export default class Request extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      guildIDs: ["356272183166763008"],
      name: "request",
      description: "Request an avatar",
      options: [{
        type: CommandOptionType.ATTACHMENT,
        name: "image",
        description: "The avatar that you would like to request",
        required: true
      }]
    })
  }

  async run(ctx: CommandContext) {
    const attachment = ctx.attachments.get(ctx.options.image)
    if (attachment === undefined) {
      return ctx.send("Unable to read attachment", { ephemeral: true })
    }
    try {
      const image = validateImage(attachment)
      const approvalMessage = await client.rest.channels.createMessage(ctx.channelID, {
        embeds: [{
          title: "Pending",
          description: `Request from ${ctx.user.mention}`,
          thumbnail: {
            url: image.url
          }
        }],
        components: [{
          type: ComponentTypes.ACTION_ROW,
          components: [
            {
              type: ComponentTypes.BUTTON,
              label: "Approve",
              style: ButtonStyles.SUCCESS,
              customID: `approve-${ctx.user.id}-${image.type}-${image.ext}`
            },
            {
              type: ComponentTypes.BUTTON,
              label: "Deny",
              style: ButtonStyles.DANGER,
              customID: `deny-${ctx.user.id}`
            }
          ]
        }]
      })
      return ctx.send(`Image request submitted, track approval state here: ${approvalMessage.jumpLink}`)
    } catch (error) {
      if (error instanceof ImageError) {
        return ctx.send(error.message, { ephemeral: true })
      }
      console.error(error)
      return ctx.send("An unknown error occurred!", { ephemeral: true })
    }
  }
}
