import "dotenv/config"

import { hash } from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedDefault = await hash("1234", 12)
  const hashedJs = await hash("@William2025", 12)
  const seededUserIds = ["ds", "jxs", "js"]

  const users = [
    {
      id: "ds",
      name: "ds",
      email: "ds@gmail.com",
      password: hashedDefault,
    },
    {
      id: "jxs",
      name: "jxs",
      email: "jxs@gmail.com",
      password: hashedDefault,
    },
    {
      id: "js",
      name: "js",
      email: "js@gmail.com",
      password: hashedJs,
    },
  ]

  await prisma.user.deleteMany({
    where: {
      id: {
        in: seededUserIds,
      },
    },
  })

  await prisma.user.createMany({
    data: users,
  })

  await prisma.dealer.updateMany({
    where: {
      createdById: "system-migration-user",
    },
    data: {
      createdById: "ds",
    },
  })

  console.log("Seed completed: users ds, jxs and js are ready.")
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
