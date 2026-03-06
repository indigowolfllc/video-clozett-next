export async function githubCreateOrUpdateFile(command: {
  path: string
  content: string
  commitMessage: string
}): Promise<{ path: string; status: string }> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || "main"

  const apiUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + command.path


  let sha: string | undefined
  try {
    const existing = await fetch(apiUrl, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
      },
    })
    if (existing.ok) {
      const data = await existing.json()
      sha = data.sha
    }
  } catch {}

  const encoded = Buffer.from(command.content).toString("base64")

  await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: command.commitMessage,
      content: encoded,
      branch,
      ...(sha ? { sha } : {}),
    }),
  })

  return { path: command.path, status: "updated" }
}