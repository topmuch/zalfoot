import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function analyze(path: string, prompt: string) {
  const zai = await ZAI.create()
  const base64 = fs.readFileSync(path).toString('base64')
  const response = await zai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
        ],
      },
    ],
  })
  console.log(`\n===== ${path} =====`)
  console.log(response.choices[0]?.message?.content ?? 'Pas de réponse')
}

async function main() {
  await analyze('/tmp/landing.png', "Décris cette page web en 3 phrases : y a-t-il des problèmes visuels évidents (texte superposé, éléments cassés, image manquante) ? La page semble-t-elle professionnelle ?")
  await analyze('/tmp/mobile-landing.png', "C'est la version mobile de la même page. Y a-t-il des problèmes de mise en page (débordements, chevauchements, éléments trop petits) ?")
  await analyze('/tmp/mobile-dash.png', "C'est un dashboard admin en version mobile. Y a-t-il des problèmes visuels ou de mise en page ?")
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e)
  process.exit(1)
})
