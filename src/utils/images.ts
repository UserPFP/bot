import { AttachmentData, EmbedImage } from "slash-create"

import env from "../config/env.js"
import octokit from "../config/octokit.js"

export interface ValidatedImage {
  type: string
  ext: string
  url: string
  stillUrl: string
}
export interface ImageData {
  type: string
  ext: string
  animated: Buffer
  still: Buffer
}

const aspectRatioVariance = 0.1 // Allow 10% different in size between width and height
const allowedContentTypes = ["image/gif"]
const maxImageBytes = 12e6 // 12MB

// Error class used when issues regarding image processing occur
export class ImageError extends Error {}

export function getStillUrl (image: AttachmentData|EmbedImage) {
  const stillUrl = new URL(image.proxy_url!)
  stillUrl.searchParams.set("format", "png")
  return stillUrl.toString()
}

export function validateImage (attachment: AttachmentData): ValidatedImage {
  if (attachment.content_type === undefined || !allowedContentTypes.includes(attachment.content_type)) {
    throw new ImageError("Image must be a gif.")
  }

  // Make sure the image is square-ish
  if (attachment.width === undefined || attachment.height === undefined) {
    throw new ImageError("Unable to determine image dimensions.")
  }
  if (
    attachment.width / attachment.height >= 1 + aspectRatioVariance ||
    attachment.height / attachment.width >= 1 + aspectRatioVariance
  ) {
    throw new ImageError("The provided image must be a square (or close to it).")
  }

  // Check image file size
  if (attachment.size > maxImageBytes) {
    throw new ImageError("The provided image is too large and must be compressed.")
  }


  return {
    type: attachment.content_type,
    ext: attachment.content_type.split("/")[1],
    url: attachment.url,
    stillUrl: getStillUrl(attachment)
  }
}

export async function validateAndDownloadImage (image: ValidatedImage): Promise<ImageData> {
  const imageRequests = await Promise.all([
    fetch(image.url, {
      headers: {
        "User-Agent": env.useragent
      }
    }),
    fetch(image.stillUrl, {
      headers: {
        "User-Agent": env.useragent
      }
    })
  ])

  if (imageRequests.some(v => !v.ok)) {
    throw new ImageError("Unable to download image!")
  }

  const imageArrayBuffers = await Promise.all(imageRequests.map(i => i.arrayBuffer()))
  const [ animated, still ] = imageArrayBuffers.map(ab => Buffer.from(ab))

  return {
    type: image.type!,
    ext: image.ext,
    animated,
    still
  }
}

async function uploadImageFile (message: string, imagePath: string, buff: Buffer) {
  let sha: string | undefined = undefined
  try {
    const existingFileData = await octokit.repos.getContent({
      owner: env.repos.image.owner,
      repo: env.repos.image.name,
      path: imagePath
    })
    if ("sha" in existingFileData.data) {
      // eslint-disable-next-line prefer-destructuring
      sha = existingFileData.data.sha
    }
  } catch (err: any) {
    if (!("status" in err && err.status === 404)) {
      throw err
    }
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: env.repos.image.owner,
    repo: env.repos.image.name,
    path: imagePath,
    message: message,
    content: buff.toString("base64"),
    sha
  })
}

export async function updateUserAvatarImage (userId: string, image: ImageData) {
  const imageBasePath = `Avatars/${userId[0]}/${userId}`

  await uploadImageFile(`Updating animated avatar for ${userId}`, `${imageBasePath}.gif`, image.animated)
  await uploadImageFile(`Updating still avatar for ${userId}`, `${imageBasePath}.png`, image.still)

  return `https://raw.githubusercontent.com/${env.repos.image.owner}/${env.repos.image.name}/main/${imageBasePath}`
}

export async function deleteUserAvatarImage (userId: string) {
  // Get a list of all avatar files in the directory
  const directoryListing = await octokit.repos.getContent({
    owner: env.repos.image.owner,
    repo: env.repos.image.name,
    path: `/Avatars/${userId[0]}`
  })

  if (!Array.isArray(directoryListing.data)) {
    throw new Error("User directory not correct type")
  }

  const matchedAvatars = directoryListing.data.filter(v => v.name.startsWith(`${userId}.`))

  for (const avatar of matchedAvatars) {
    const response = await octokit.repos.deleteFile({
      owner: env.repos.image.owner,
      repo: env.repos.image.name,
      message: `Deleting avatar for ${userId}`,
      path: avatar.path,
      sha: avatar.sha
    })
    if (response.data.commit.sha === undefined) {
      throw new Error("Unexpected response from Github when deleting user images")
    }
  }
}
