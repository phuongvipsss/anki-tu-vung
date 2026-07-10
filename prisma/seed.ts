import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialTopics = [
  "Present Simple",
  "Present Continuous",
  "Past Simple",
  "Present Perfect",
  "Future Forms",
  "Modal Verbs",
  "Passive Voice",
  "Conditionals",
  "Relative Clauses",
  "Articles",
  "Prepositions",
  "Subject-Verb Agreement",
  "Countable and Uncountable Nouns",
  "Gerund and Infinitive"
]

async function main() {
  console.log('Start seeding grammar topics...')
  
  for (const topic of initialTopics) {
    const existing = await prisma.grammarTopic.findUnique({
      where: { name: topic }
    })
    if (!existing) {
      await prisma.grammarTopic.create({
        data: { name: topic }
      })
      console.log(`Added: ${topic}`)
    } else {
      console.log(`Skipped (already exists): ${topic}`)
    }
  }
  
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
