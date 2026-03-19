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
  const hashedPassword = await hash("1234", 12)
  const seededUserIds = ["ds", "jxs"]

  const users = [
    {
      id: "ds",
      name: "ds",
      email: "ds@gmail.com",
      password: hashedPassword,
    },
    {
      id: "jxs",
      name: "jxs",
      email: "jxs@gmail.com",
      password: hashedPassword,
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

  console.log("Seed completed: users ds and jxs are ready.")
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
