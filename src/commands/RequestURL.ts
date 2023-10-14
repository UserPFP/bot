import { ButtonStyles, ComponentTypes } from "oceanic.js"
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from "slash-create"

import client from "../config/client.js"
import env from "../config/env.js"
import { ImageError } from "../utils/images.js"

export default class RequestURL extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      guildIDs: ["356272183166763008"],
      name: "request-url",
      description: "Request an URL as an avatar. This should only be used for dynamic/random image APIs.",
      options: [{
        type: CommandOptionType.STRING,
        name: "url",
        description: "The URL to request as your avatar",
        required: true
      }]
    })
  }

  async run(ctx: CommandContext) {
    const { url } = ctx.options
    try {
      new URL(url)
    } catch (err) {
      return ctx.send("Invalid URL provided", { ephemeral: true })
    }

    try {
      const approvalMessage = await client.rest.channels.createMessage(env.approvals.channel, {
        embeds: [{
          title: "Pending",
          description: `Request from ${ctx.user.mention}`,
          thumbnail: {
            url: url
          },
          fields: [{
            name: "Custom URL",
            value: url
          }]
        }],
        components: [{
          type: ComponentTypes.ACTION_ROW,
          components: [
            {
              type: ComponentTypes.BUTTON,
              label: "Approve",
              style: ButtonStyles.SUCCESS,
              customID: `approve_url-${ctx.user.id}`
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
