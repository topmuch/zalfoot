import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const response = await zai.images.generations.create({
    prompt:
      'Close-up ground-level view of a modern artificial synthetic turf football pitch, vibrant green synthetic grass blades in sharp detail, a crisp white pitch line curving across the frame, a football resting on the turf, evening stadium lighting, shallow depth of field, photorealistic, high quality, no people, no text',
    size: '1536x768',
  })
  const base64 = response.data?.[0]?.base64
  if (!base64) {
    console.error('Pas de base64 dans la réponse')
    process.exit(1)
  }
  const buffer = Buffer.from(base64, 'base64')
  fs.writeFileSync('/home/z/my-project/public/gazon-synthetique.png', buffer)
  console.log('✅ Gazon synthétique enregistré :', '/home/z/my-project/public/gazon-synthetique.png', buffer.length, 'octets')
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e)
  process.exit(1)
})
