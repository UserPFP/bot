import { deleteUserAvatarUrl, updateUserAvatarUrl } from "./database.js"
import { deleteUserAvatarImage, updateUserAvatarImage, validateAndDownloadImage, ValidatedImage } from "./images.js"

export async function updateUserAvatar (userId: string, validatedImage: ValidatedImage) {
  const image = await validateAndDownloadImage(validatedImage)
  const imageBaseUrl = await updateUserAvatarImage(userId, image)
  await updateUserAvatarUrl(userId, `${imageBaseUrl}.gif`)
}

export async function deleteUserAvatar (userId: string) {
  await Promise.all([
    deleteUserAvatarUrl(userId),
    deleteUserAvatarImage(userId)
  ])
}
