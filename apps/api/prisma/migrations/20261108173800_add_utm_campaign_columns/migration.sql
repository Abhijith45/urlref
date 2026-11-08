-- AlterTable
ALTER TABLE "links" ADD COLUMN "utm_source" VARCHAR(128),
ADD COLUMN "utm_medium" VARCHAR(128),
ADD COLUMN "utm_campaign" VARCHAR(128),
ADD COLUMN "utm_term" VARCHAR(128),
ADD COLUMN "utm_content" VARCHAR(128);

-- CreateIndex
CREATE INDEX "links_user_id_utm_campaign_idx" ON "links"("user_id", "utm_campaign");
