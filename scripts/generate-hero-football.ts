import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const response = await zai.images.generations.create({
    prompt:
      'Professional football pitch in a modern sports complex at golden hour, lush green mowed grass with subtle mowing stripes, crisp white line markings and center circle, goals with white nets at both ends, tall floodlights glowing softly in the background, clear warm sky, slight elevated aerial perspective, photorealistic, high quality, detailed, vibrant greens, no people, no text',
    size: '1536x768',
  })
  const base64 = response.data?.[0]?.base64
  if (!base64) {
    console.error('Pas de base64 dans la réponse')
    process.exit(1)
  }
  const buffer = Buffer.from(base64, 'base64')
  fs.writeFileSync('/home/z/my-project/public/hero-football.png', buffer)
  console.log('✅ Terrain de football enregistré :', '/home/z/my-project/public/hero-football.png', buffer.length, 'octets')
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e)
  process.exit(1)
})
