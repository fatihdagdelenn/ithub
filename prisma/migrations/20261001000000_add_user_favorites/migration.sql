-- CreateTable
CREATE TABLE "user_favorites" (
    "userId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "systemId"),
    CONSTRAINT "user_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_favorites_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Favorites used to be global (one flag per system, shared by everyone). Carry them over by giving
-- every existing user the systems that were starred, so nobody's dashboard changes on upgrade.
INSERT INTO "user_favorites" ("userId", "systemId")
SELECT "users"."id", "systems"."id"
FROM "users" CROSS JOIN "systems"
WHERE "systems"."isFavorite" = true;

-- AlterTable
ALTER TABLE "systems" DROP COLUMN "isFavorite";
