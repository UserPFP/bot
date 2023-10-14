import env from "../config/env.js"
import octokit from "../config/octokit.js"

type UserPfpMap = { [userId: string]: string }
interface UserPfpDb {
  avatars: UserPfpMap,
  badges: UserPfpMap
}

export async function fetchCurrentDatabase (): Promise<{ sha: string, db: UserPfpDb }> {
  const response = await octokit.rest.repos.getContent({
    owner: env.repos.db.owner,
    repo: env.repos.db.name,
    path: "source/data.json"
  })

  if (!("content" in response.data)) {
    throw new Error("Unexpected response from GitHub API while fetching database")
  }

  const contentBuf = Buffer.from(response.data.content, "base64")

  return {
    sha: response.data.sha,
    db: JSON.parse(contentBuf.toString())
  }
}

export async function updateUserAvatarUrl (userId: string, imageUrl: string) {
  const { sha, db: database } = await fetchCurrentDatabase()

  // Don't attempt to update the URL if it's already the same
  if (database.avatars[userId] === imageUrl) {
    return
  }

  database.avatars[userId] = imageUrl

  const stringified = JSON.stringify(database, null, 2)
  const encoded = Buffer.from(stringified).toString("base64")

  await octokit.repos.createOrUpdateFileContents({
    owner: env.repos.db.owner,
    repo: env.repos.db.name,
    path: "source/data.json",
    message: `Updating avatar for ${userId}`,
    content: encoded,
    sha
  })
}
