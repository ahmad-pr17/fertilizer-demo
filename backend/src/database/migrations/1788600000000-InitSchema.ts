import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1788600000000 implements MigrationInterface {
  name = 'InitSchema1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() is built into Postgres core since v13 — no extension needed.
    // Sensitive columns (credit_limit, current_balance, price, total_amount) are
    // stored as `text` here: they hold application-level AES-256-GCM ciphertext,
    // never plaintext numbers — see EncryptionUtil / encryptedNumberTransformer.

    await queryRunner.query(`
      CREATE TABLE "distributors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "region" varchar NOT NULL,
        "whatsapp_phone_number_id" varchar NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_distributors_whatsapp_phone_number_id" UNIQUE ("whatsapp_phone_number_id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('owner', 'ops')`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "distributor_id" uuid NOT NULL REFERENCES "distributors"("id") ON DELETE CASCADE,
        "username" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'ops',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_distributor_username" UNIQUE ("distributor_id", "username")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "dealers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "distributor_id" uuid NOT NULL REFERENCES "distributors"("id") ON DELETE CASCADE,
        "name" varchar NOT NULL,
        "whatsapp_number" varchar NOT NULL,
        "region" varchar NOT NULL,
        "credit_limit" text NOT NULL,
        "current_balance" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_dealers_distributor_whatsapp" UNIQUE ("distributor_id", "whatsapp_number")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_dealers_distributor_id" ON "dealers" ("distributor_id")`);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "distributor_id" uuid NOT NULL REFERENCES "distributors"("id") ON DELETE CASCADE,
        "name" varchar NOT NULL,
        "unit" varchar NOT NULL,
        "price" text NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_products_distributor_id" ON "products" ("distributor_id")`);

    await queryRunner.query(`
      CREATE TYPE "orders_status_enum" AS ENUM (
        'pending_confirmation', 'escalated', 'confirmed', 'rejected',
        'out_for_delivery', 'delivered', 'cancelled'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "distributor_id" uuid NOT NULL REFERENCES "distributors"("id") ON DELETE CASCADE,
        "dealer_id" uuid NOT NULL REFERENCES "dealers"("id") ON DELETE CASCADE,
        "items" jsonb NOT NULL,
        "total_amount" text,
        "status" "orders_status_enum" NOT NULL DEFAULT 'pending_confirmation',
        "delivery_address" varchar,
        "payment_terms" varchar,
        "escalation_reason" varchar,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_distributor_id" ON "orders" ("distributor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_dealer_id" ON "orders" ("dealer_id")`);

    await queryRunner.query(`CREATE TYPE "conversations_direction_enum" AS ENUM ('inbound', 'outbound')`);
    await queryRunner.query(`
      CREATE TYPE "conversations_status_enum" AS ENUM (
        'handled_by_agent', 'escalated', 'resolved_by_human'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "distributor_id" uuid NOT NULL REFERENCES "distributors"("id") ON DELETE CASCADE,
        "dealer_id" uuid REFERENCES "dealers"("id") ON DELETE SET NULL,
        "whatsapp_number" varchar NOT NULL,
        "direction" "conversations_direction_enum" NOT NULL,
        "raw_message" text NOT NULL,
        "parsed_intent" jsonb,
        "status" "conversations_status_enum" NOT NULL DEFAULT 'handled_by_agent',
        "related_order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
        "human_reply" text,
        "escalation_reason" varchar,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_distributor_id" ON "conversations" ("distributor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_dealer_id" ON "conversations" ("dealer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_created_at" ON "conversations" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TYPE "conversations_status_enum"`);
    await queryRunner.query(`DROP TYPE "conversations_direction_enum"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "dealers"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
    await queryRunner.query(`DROP TABLE "distributors"`);
  }
}
