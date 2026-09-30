-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allCategories" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_groups" (
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "groupId"),
    CONSTRAINT "user_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_categories" (
    "groupId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    PRIMARY KEY ("groupId", "categoryId"),
    CONSTRAINT "group_categories_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");

-- Until now every user could see every category. To keep that behaviour on upgrade, create an
-- "Herkes" (everyone) group that grants all categories and put every existing user in it. Admins
-- can then narrow access step by step. (On a fresh install this just creates the empty group.)
INSERT INTO "groups" ("id", "name", "description", "allCategories")
VALUES (
    'grp_herkes',
    'Herkes',
    'Tüm kategorileri görür. Sürüm yükseltmesinde mevcut kullanıcıların erişimi değişmesin diye otomatik oluşturuldu.',
    true
);

INSERT INTO "user_groups" ("userId", "groupId")
SELECT "id", 'grp_herkes' FROM "users";
