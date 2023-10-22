import { ButtonStyles, ComponentTypes } from "oceanic.js"
import { CommandContext, CommandOptionType, SlashCreator } from "slash-create"

import BaseCommand from "../BaseCommand.js"
import client from "../config/client.js"
import env from "../config/env.js"
import { ImageError } from "../utils/images.js"

const denylistedHosts = [
  "reddit.com",
  "giphy.com",
  "tenor.com",
  "imgur.com",
  "ibb.co",

  // Pinterest
  "pin.it",
  "i.pinimg.com",

  // Google
  "images.app.goo.gl",
  "youtube.com",
  "youtu.be",
  "drive.google.com",

  // Discord
  "discord.com",
  "cdn.discordapp.com",
  "media.discordapp.net"
]

export default class RequestURL extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "request-url",
      description: "Request an URL as an avatar. This should only be used for dynamic/random image APIs.",
      options: [{
        type: CommandOptionType.STRING,
        name: "url",
        description: "The URL to request as your avatar",
        required: true
      }],
      deferEphemeral: true
    })
  }

  async run(ctx: CommandContext) {
    const { url } = ctx.options
    let imageUrl: URL
    try {
      imageUrl = new URL(url)
    } catch (err) {
      return ctx.send("Invalid URL provided", { ephemeral: true })
    }

    // Check if the hostname is one of denied hostnames, or a subdomain of one of them
    if (denylistedHosts.some(host => imageUrl.hostname === host || imageUrl.hostname.endsWith("." + host))) {
      return ctx.send("The URL provided does not point to an image API. You should download the image and request it with the /request command instead.", { ephemeral: true })
    }

    try {
      const approvalMessage = await client.rest.channels.createMessage(env.approvals.channel, {
        embeds: [{
          title: "Pending",
          description: `Request from ${ctx.user.mention}.`,
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
      return ctx.send(
        `Image request submitted, track approval state here: ${approvalMessage.jumpLink}`,
        { ephemeral: true }
      )
    } catch (error) {
      if (error instanceof ImageError) {
        return ctx.send(error.message, { ephemeral: true })
      }
      console.error(error)
      return ctx.send("An unknown error occurred!", { ephemeral: true })
    }
  }
}
