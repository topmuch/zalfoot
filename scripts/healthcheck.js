// Healthcheck Docker : vérifie que le serveur Next.js répond bien sur /
// Utilisé par HEALTHCHECK du Dockerfile et par Coolify.
const port = process.env.PORT || 3000
const url = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${port}/`

fetch(url)
  .then((res) => {
    if (res.ok) {
      console.log(`✅ Healthcheck OK (${res.status})`)
      process.exit(0)
    }
    console.error(`❌ Healthcheck KO (${res.status})`)
    process.exit(1)
  })
  .catch((err) => {
    console.error(`❌ Healthcheck KO : ${err?.message || err}`)
    process.exit(1)
  })
