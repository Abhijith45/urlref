-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'AGENCY');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'FAILED');

-- AlterTable users
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "clerk_id" VARCHAR(64),
ADD COLUMN "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN "stripe_customer_id" VARCHAR(128),
ADD COLUMN "stripe_subscription_id" VARCHAR(128),
ADD COLUMN "stripe_price_id" VARCHAR(128),
ADD COLUMN "subscription_status" VARCHAR(32) DEFAULT 'inactive',
ADD COLUMN "subscription_period_end" TIMESTAMPTZ(6);

-- CreateTable custom_domains
CREATE TABLE "custom_domains" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "hostname" VARCHAR(255) NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "verification_token" VARCHAR(64) NOT NULL,
    "cname_target" VARCHAR(255) NOT NULL DEFAULT 'cname.urlref.softics.in',
    "ssl_status" VARCHAR(64) NOT NULL DEFAULT 'pending_validation',
    "custom_404_url" VARCHAR(2048),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

-- AlterTable links
ALTER TABLE "links" ADD COLUMN "custom_domain_id" UUID;

-- CreateTable webhook_events
CREATE TABLE "webhook_events" (
    "id" VARCHAR(128) NOT NULL,
    "type" VARCHAR(128) NOT NULL,
    "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");
CREATE INDEX "users_clerk_id_idx" ON "users"("clerk_id");
CREATE INDEX "users_stripe_customer_id_idx" ON "users"("stripe_customer_id");
CREATE INDEX "users_stripe_subscription_id_idx" ON "users"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_domains_hostname_key" ON "custom_domains"("hostname");
CREATE INDEX "custom_domains_user_id_idx" ON "custom_domains"("user_id");
CREATE INDEX "custom_domains_hostname_idx" ON "custom_domains"("hostname");

-- CreateIndex
CREATE INDEX "links_custom_domain_id_idx" ON "links"("custom_domain_id");

-- AddForeignKey
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_custom_domain_id_fkey" FOREIGN KEY ("custom_domain_id") REFERENCES "custom_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;
