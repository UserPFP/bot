import { Octokit } from "@octokit/rest"

import env from "./env.js"

export default new Octokit({
  userAgent: env.useragent,
  auth: env.github.accessToken
})
