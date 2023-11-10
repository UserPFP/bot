import { ComponentContext, ComponentType, TextInputStyle } from "slash-create"

import client from "./config/client.js"
import env from "./config/env.js"
import { updateUserAvatarUrl } from "./utils/database.js"
import { getStillUrl, ValidatedImage } from "./utils/images.js"
import { updateUserAvatar } from "./utils/index.js"

// Track which messages are currently being handled to prevent status collisions
const approvalLock = new Set<string>

function extractImageData (ctx: ComponentContext): { userId: string, image: ValidatedImage }|null {
  if (!ctx.message.embeds[0].thumbnail?.url) {
    return null
  }
  if (approvalLock.has(ctx.message.id)) {
    return null
  }
  approvalLock.add(ctx.message.id)
  const [,userId, type, ext] = ctx.customID.split("-")
  return {
    userId,
    image:{
      type,
      ext,
      url: ctx.message.embeds[0].thumbnail.url,
      stillUrl: getStillUrl(ctx.message.embeds[0].thumbnail)
    }
  }
}

async function handleApproval (ctx: ComponentContext) {
  const validatedData = extractImageData(ctx)
  if (validatedData === null) {
    await ctx.send("Unable to extract image data or image already approved", { ephemeral: true })
    return
  }
  const { userId, image } = validatedData
  await updateUserAvatar(userId, image)
  await client.rest.channels.editMessage(ctx.channelID, ctx.message.id, {
    embeds: [{
      color: 0x70C1B3,
      title: "Approved!",
      description: `Request from <@${userId}>. [[Image Link]](${image.url})`,
      thumbnail: {
        url: image.url
      },
      footer: {
        text: `Approved by ${ctx.user.username}`
      }
    }],
    components: []
  })
  approvalLock.delete(ctx.message.id)
}

async function handleUrlApproval (ctx: ComponentContext) {
  const validatedData = extractImageData(ctx)
  if (validatedData === null) {
    await ctx.send("Unable to extract image data or image already approved", { ephemeral: true })
    return
  }
  const { userId, image: { url } } = validatedData

  await updateUserAvatarUrl(userId, url)
  await client.rest.channels.editMessage(ctx.channelID, ctx.message.id, {
    embeds: [{
      color: 0x70C1B3,
      title: "Approved!",
      description: `Request from <@${userId}>.`,
      thumbnail: {
        url: url
      },
      fields: ctx.message.embeds[0].fields,
      footer: {
        text: `Approved by ${ctx.user.username}`
      }
    }],
    components: []
  })
  approvalLock.delete(ctx.message.id)
}

async function handleDenial (ctx: ComponentContext) {
  const validatedData = extractImageData(ctx)
  if (validatedData === null) {
    await ctx.send("Unable to extract image data or image already approved", { ephemeral: true })
    return
  }
  const { userId, image } = validatedData
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
    // Check if the message is locked (signifies an upload in progress)
    if (approvalLock.has(ctx.message.id)) {
      await modalCtx.send("Approval already pending!", { ephemeral: true })
      return
    }
    // Fetch the original message to see if it has been approved in the meantime
    const updatedMessage = await client.rest.channels.getMessage(ctx.message.channelID, ctx.message.id)
    // If the components are gone then the request has already been approved or denied
    if (updatedMessage.components.length === 0) {
      await modalCtx.send("Unable to deny request.", { ephemeral: true })
      return
    }
    const { reason } = modalCtx.values
    await client.rest.channels.editMessage(ctx.channelID, ctx.message.id, {
      embeds: [{
        color: 0xFF1654,
        title: "Denied",
        description: `Request from <@${userId}>`,
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
  approvalLock.delete(ctx.message.id)
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
