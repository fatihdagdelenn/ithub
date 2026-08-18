-- AlterTable
ALTER TABLE "systems" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Seed sortOrder from current alphabetical order within each category so existing card order
-- doesn't visibly change until someone actually drags a card.
UPDATE "systems"
SET "sortOrder" = (
  SELECT COUNT(*) FROM "systems" s2
  WHERE s2."categoryId" = "systems"."categoryId" AND s2."name" < "systems"."name"
);
