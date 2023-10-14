import { updateUserAvatarUrl } from "./database.js"
import { updateUserAvatarImage, validateAndDownloadImage, ValidatedImage } from "./images.js"

export async function updateUserAvatar (userId: string, validatedImage: ValidatedImage) {
  const image = await validateAndDownloadImage(validatedImage)
  const imageUrl = await updateUserAvatarImage(userId, image)
  await updateUserAvatarUrl(userId, imageUrl)
  console.log(imageUrl)
}
