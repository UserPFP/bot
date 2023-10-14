import { ComponentContext, ComponentType, TextInputStyle } from "slash-create"

import client from "./config/client.js"
import env from "./config/env.js"
import { updateUserAvatarUrl } from "./utils/database.js"
import { ValidatedImage } from "./utils/images.js"
import { updateUserAvatar } from "./utils/index.js"

async function handleApproval (ctx: ComponentContext) {
  if (!ctx.message.embeds[0].thumbnail?.url) {
    return
  }
  const [,userId, type, ext] = ctx.customID.split("-")
  const image: ValidatedImage = {
    type,
    ext,
    url: ctx.message.embeds[0].thumbnail.url
  }
  await updateUserAvatar(userId, image)
  await client.rest.channels.editMessage(ctx.channelID, ctx.message.id, {
    embeds: [{
      color: 0x70C1B3,
      title: "Approved!",
      description: `Request from ${ctx.user.mention}. [[Image Link]](${image.url})`,
      thumbnail: {
        url: image.url
      },
      footer: {
        text: `Approved by ${ctx.user.username}`
      }
    }],
    components: []
  })
}

async function handleUrlApproval (ctx: ComponentContext) {
  if (!ctx.message.embeds[0].thumbnail?.url) {
    return
  }
  const url = ctx.message.embeds[0].thumbnail?.url
  const [,userId] = ctx.customID.split("-")

  await updateUserAvatarUrl(userId, url)
  await client.rest.channels.editMessage(ctx.channelID, ctx.message.id, {
    embeds: [{
      color: 0x70C1B3,
      title: "Approved!",
      description: `Request from ${ctx.user.mention}`,
      thumbnail: {
        url: url
      },
      fields: ctx.message.embeds[0].fields,
      footer: {
        text: `Approved by ${ctx.user.username}`
      }
    }],
    components: []
  }) }

async function handleDenial (ctx: ComponentContext) {
  if (!ctx.message.embeds[0].thumbnail?.url) {
    return
  }
  const [,userId, type, ext] = ctx.customID.split("-")
  const image: ValidatedImage = {
    type,
    ext,
    url: ctx.message.embeds[0].thumbnail.url
  }
  await ctx.sendModal({
    title: "Deny PFP Request",
    components: [{
      type: ComponentType.ACTION_ROW,
      components: [{
        label: "Reason",
        style: TextInputStyle.PARAGRAPH,
        type: ComponentType.TEXT_INPUT,
        required: true,
        custom_id: "reason",
        max_length: 1024
      }]
    }]
  }, async modalCtx => {
    const { reason } = modalCtx.values
    await client.rest.channels.editMessage(ctx.channelID, ctx.message.id, {
      embeds: [{
        color: 0xFF1654,
        title: "Denied",
        description: `Request from ${ctx.user.mention}`,
        thumbnail: {
          url: image.url
        },
        fields: [
          ...ctx.message.embeds[0].fields ?? [],
          {
            name: "Reason",
            value: reason
          }
        ],
        footer: {
          text: `Denied by ${ctx.user.username}`
        }
      }],
      components: []
    })
    await modalCtx.acknowledge()
  })
}

export default async function componentHandler (ctx: ComponentContext) {
  // All components are mod-only, so we can check for the role here to prevent duplication of logic
  if (!ctx.member?.roles.includes(env.approvals.role)) {
    return
  }

  const handlers: { [key: string]: (ctx: ComponentContext) => any } = {
    approve: handleApproval,
    approve_url: handleUrlApproval,
    deny: handleDenial
  }

  const [key] = ctx.customID.split("-")
  handlers[key]?.(ctx)
}
