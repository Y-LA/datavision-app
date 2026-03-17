import { prisma } from "./prisma";

const GUEST_EMAIL = "guest@datavision.local";

export async function getOrCreateGuest() {
  return prisma.user.upsert({
    where:  { email: GUEST_EMAIL },
    update: {},
    create: { name: "Guest", email: GUEST_EMAIL },
  });
}
