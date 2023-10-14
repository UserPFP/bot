import { strictVerify } from "env-verifier"

const config = {
  useragent: "USER_AGENT",
  github: {
    accessToken: "GITHUB_ACCESS_TOKEN"
  },
  repos: {
    db: {
      owner: "DATABASE_REPOSITORY_OWNER",
      name: "DATABASE_REPOSITORY_NAME"
    },
    image: {
      owner: "IMAGE_REPOSITORY_OWNER",
      name: "IMAGE_REPOSITORY_NAME"
    }
  },
  discord: {
    applicationID: "DISCORD_ID",
    publicKey: "DISCORD_KEY",
    token: "DISCORD_TOKEN"
  }
}

export default strictVerify<typeof config>(config)
