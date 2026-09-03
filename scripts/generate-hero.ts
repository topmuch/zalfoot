import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const response = await zai.images.generations.create({
    prompt:
      'Modern indoor sports complex interior, large multipurpose gym hall with polished wooden floor, basketball hoops, bright natural light through tall windows, green accents, clean architecture photography, wide angle, high quality, detailed',
    size: '1536x768',
  })
  const base64 = response.data?.[0]?.base64
  if (!base64) {
    console.error('Pas de base64 dans la réponse')
    process.exit(1)
  }
  const buffer = Buffer.from(base64, 'base64')
  fs.writeFileSync('/home/z/my-project/public/hero-sports.png', buffer)
  console.log('✅ Image hero enregistrée :', '/home/z/my-project/public/hero-sports.png', buffer.length, 'octets')
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e)
  process.exit(1)
})
