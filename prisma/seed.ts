import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "admin@kaplan.co.za" },
    update: {},
    create: {
      email: "admin@kaplan.co.za",
      name: "Kaplan Admin"
    }
  });

  await prisma.relationship.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.person.deleteMany({ where: { createdById: user.id } });

  const warren = await prisma.person.create({
    data: {
      name: "Warren",
      alive: true,
      email: "warren@example.com",
      notes: "Root family member.",
      consentStatus: "verified",
      createdById: user.id
    }
  });

  const sarah = await prisma.person.create({
    data: {
      name: "Sarah",
      alive: true,
      email: "sarah@example.com",
      notes: "Sibling branch.",
      consentStatus: "invited",
      createdById: user.id
    }
  });

  const david = await prisma.person.create({
    data: {
      name: "David",
      alive: true,
      email: "david@example.com",
      notes: "Cousin branch.",
      consentStatus: "unknown",
      createdById: user.id
    }
  });

  const grace = await prisma.person.create({
    data: {
      name: "Grace",
      alive: false,
      notes: "Grandmother.",
      consentStatus: "verified",
      createdById: user.id
    }
  });

  await prisma.relationship.createMany({
    data: [
      { leftId: warren.id, rightId: sarah.id, label: "Sibling" },
      { leftId: warren.id, rightId: david.id, label: "Cousin" },
      { leftId: sarah.id, rightId: grace.id, label: "Grandchild" }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
