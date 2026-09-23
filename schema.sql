
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `activities_user_id_foreign` (`user_id`),
  KEY `activities_workspace_id_created_at_index` (`workspace_id`,`created_at`),
  CONSTRAINT `activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `activities_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ai_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_conversations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prompt` text COLLATE utf8mb4_unicode_ci,
  `response` text COLLATE utf8mb4_unicode_ci,
  `mode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tokens` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ai_conversations_workspace_id_foreign` (`workspace_id`),
  KEY `ai_conversations_user_id_foreign` (`user_id`),
  CONSTRAINT `ai_conversations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `ai_conversations_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_logs_actor_id_foreign` (`actor_id`),
  KEY `audit_logs_workspace_id_created_at_index` (`workspace_id`,`created_at`),
  CONSTRAINT `audit_logs_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`),
  CONSTRAINT `audit_logs_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_identities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_identities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_identities_provider_subject_unique` (`provider`,`subject`),
  KEY `auth_identities_user_id_foreign` (`user_id`),
  CONSTRAINT `auth_identities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_tokens` (
  `hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kind` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`hash`),
  KEY `auth_tokens_user_id_foreign` (`user_id`),
  CONSTRAINT `auth_tokens_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `billing_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_receipts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `billing_receipts_payment_id_unique` (`payment_id`),
  UNIQUE KEY `billing_receipts_number_unique` (`number`),
  KEY `billing_receipts_workspace_id_foreign` (`workspace_id`),
  CONSTRAINT `billing_receipts_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`),
  CONSTRAINT `billing_receipts_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'New',
  `value_paise` bigint unsigned DEFAULT '0',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `follow_up_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `linked_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linked_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pipeline_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `companies_workspace_id_id_unique` (`workspace_id`,`id`),
  KEY `companies_workspace_id_assigned_to_foreign` (`workspace_id`,`assigned_to`),
  KEY `companies_workspace_id_archived_assigned_to_index` (`workspace_id`,`archived`,`assigned_to`),
  KEY `companies_workspace_id_email_index` (`workspace_id`,`email`),
  CONSTRAINT `companies_workspace_id_assigned_to_foreign` FOREIGN KEY (`workspace_id`, `assigned_to`) REFERENCES `memberships` (`workspace_id`, `user_id`),
  CONSTRAINT `companies_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'New',
  `value_paise` bigint unsigned DEFAULT '0',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `follow_up_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `linked_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linked_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pipeline_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contacts_workspace_id_id_unique` (`workspace_id`,`id`),
  KEY `contacts_workspace_id_assigned_to_foreign` (`workspace_id`,`assigned_to`),
  KEY `contacts_workspace_id_archived_assigned_to_index` (`workspace_id`,`archived`,`assigned_to`),
  KEY `contacts_workspace_id_email_index` (`workspace_id`,`email`),
  CONSTRAINT `contacts_workspace_id_assigned_to_foreign` FOREIGN KEY (`workspace_id`, `assigned_to`) REFERENCES `memberships` (`workspace_id`, `user_id`),
  CONSTRAINT `contacts_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `crm_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_invoices` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_bps` int unsigned DEFAULT NULL,
  `subtotal_paise` bigint unsigned DEFAULT NULL,
  `total_paise` bigint unsigned DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Unpaid',
  `due_date` date DEFAULT NULL,
  `memo` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `crm_invoices_workspace_id_number_unique` (`workspace_id`,`number`),
  KEY `crm_invoices_created_by_foreign` (`created_by`),
  CONSTRAINT `crm_invoices_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `crm_invoices_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deals` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'New',
  `value_paise` bigint unsigned DEFAULT '0',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `follow_up_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `linked_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linked_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pipeline_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deals_workspace_id_id_unique` (`workspace_id`,`id`),
  KEY `deals_workspace_id_assigned_to_foreign` (`workspace_id`,`assigned_to`),
  KEY `deals_workspace_id_archived_assigned_to_index` (`workspace_id`,`archived`,`assigned_to`),
  KEY `deals_workspace_id_email_index` (`workspace_id`,`email`),
  KEY `deals_workspace_id_pipeline_id_foreign` (`workspace_id`,`pipeline_id`),
  CONSTRAINT `deals_workspace_id_assigned_to_foreign` FOREIGN KEY (`workspace_id`, `assigned_to`) REFERENCES `memberships` (`workspace_id`, `user_id`),
  CONSTRAINT `deals_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `deals_workspace_id_pipeline_id_foreign` FOREIGN KEY (`workspace_id`, `pipeline_id`) REFERENCES `pipelines` (`workspace_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `email_drafts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_drafts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `is_template` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email_drafts_workspace_id_foreign` (`workspace_id`),
  KEY `email_drafts_user_id_foreign` (`user_id`),
  CONSTRAINT `email_drafts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `email_drafts_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `email_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_jobs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `draft_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_jobs_draft_id_unique` (`draft_id`),
  UNIQUE KEY `email_jobs_message_id_unique` (`message_id`),
  KEY `email_jobs_workspace_id_foreign` (`workspace_id`),
  KEY `email_jobs_user_id_foreign` (`user_id`),
  CONSTRAINT `email_jobs_draft_id_foreign` FOREIGN KEY (`draft_id`) REFERENCES `email_drafts` (`id`),
  CONSTRAINT `email_jobs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `email_jobs_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `entitlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entitlements` (
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `overrides` json DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`workspace_id`),
  CONSTRAINT `entitlements_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitations_token_hash_unique` (`token_hash`),
  KEY `invitations_workspace_id_email_index` (`workspace_id`,`email`),
  CONSTRAINT `invitations_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int unsigned DEFAULT NULL,
  `unit_paise` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_items_invoice_id_foreign` (`invoice_id`),
  CONSTRAINT `invoice_items_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `crm_invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `knex_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batch` int DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `knex_migrations_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations_lock` (
  `index` int unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'New',
  `value_paise` bigint unsigned DEFAULT '0',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `follow_up_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `linked_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linked_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pipeline_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `leads_workspace_id_id_unique` (`workspace_id`,`id`),
  KEY `leads_workspace_id_assigned_to_foreign` (`workspace_id`,`assigned_to`),
  KEY `leads_workspace_id_archived_assigned_to_index` (`workspace_id`,`archived`,`assigned_to`),
  KEY `leads_workspace_id_email_index` (`workspace_id`,`email`),
  KEY `leads_workspace_id_pipeline_id_foreign` (`workspace_id`,`pipeline_id`),
  CONSTRAINT `leads_workspace_id_assigned_to_foreign` FOREIGN KEY (`workspace_id`, `assigned_to`) REFERENCES `memberships` (`workspace_id`, `user_id`),
  CONSTRAINT `leads_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `leads_workspace_id_pipeline_id_foreign` FOREIGN KEY (`workspace_id`, `pipeline_id`) REFERENCES `pipelines` (`workspace_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memberships` (
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`workspace_id`,`user_id`),
  KEY `memberships_user_id_foreign` (`user_id`),
  CONSTRAINT `memberships_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `memberships_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'New',
  `value_paise` bigint unsigned DEFAULT '0',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `follow_up_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `linked_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linked_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pipeline_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notes_workspace_id_id_unique` (`workspace_id`,`id`),
  KEY `notes_workspace_id_assigned_to_foreign` (`workspace_id`,`assigned_to`),
  KEY `notes_workspace_id_archived_assigned_to_index` (`workspace_id`,`archived`,`assigned_to`),
  KEY `notes_workspace_id_email_index` (`workspace_id`,`email`),
  CONSTRAINT `notes_workspace_id_assigned_to_foreign` FOREIGN KEY (`workspace_id`, `assigned_to`) REFERENCES `memberships` (`workspace_id`, `user_id`),
  CONSTRAINT `notes_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_foreign` (`user_id`),
  KEY `notifications_workspace_id_user_id_index` (`workspace_id`,`user_id`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notifications_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payment_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_orders` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `merchant_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount_paise` int unsigned DEFAULT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snapshot` json DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_orders_provider_order_id_unique` (`provider_order_id`),
  KEY `payment_orders_workspace_id_status_index` (`workspace_id`,`status`),
  CONSTRAINT `payment_orders_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount_paise` int unsigned DEFAULT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_test` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_order_id_unique` (`order_id`),
  UNIQUE KEY `payments_provider_payment_id_unique` (`provider_payment_id`),
  KEY `payments_workspace_id_foreign` (`workspace_id`),
  CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `payment_orders` (`id`),
  CONSTRAINT `payments_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pipeline_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pipeline_stages` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pipeline_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` int DEFAULT NULL,
  `kind` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  PRIMARY KEY (`id`),
  UNIQUE KEY `pipeline_stages_pipeline_id_name_unique` (`pipeline_id`,`name`),
  KEY `pipeline_stages_workspace_id_pipeline_id_foreign` (`workspace_id`,`pipeline_id`),
  CONSTRAINT `pipeline_stages_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `pipeline_stages_workspace_id_pipeline_id_foreign` FOREIGN KEY (`workspace_id`, `pipeline_id`) REFERENCES `pipelines` (`workspace_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pipelines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pipelines` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pipelines_workspace_id_id_unique` (`workspace_id`,`id`),
  CONSTRAINT `pipelines_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plans` (
  `id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_paise` int unsigned DEFAULT NULL,
  `limits` json DEFAULT NULL,
  `version` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminders` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `task_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `email` tinyint(1) DEFAULT '0',
  `lead_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reminders_task_id_due_at_unique` (`task_id`,`due_at`),
  UNIQUE KEY `reminders_lead_id_due_at_unique` (`lead_id`,`due_at`),
  KEY `reminders_workspace_id_foreign` (`workspace_id`),
  KEY `reminders_user_id_foreign` (`user_id`),
  CONSTRAINT `reminders_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`),
  CONSTRAINT `reminders_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`),
  CONSTRAINT `reminders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reminders_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `csrf` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `mfa_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`hash`),
  KEY `sessions_user_id_foreign` (`user_id`),
  KEY `sessions_expires_at_index` (`expires_at`),
  CONSTRAINT `sessions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kind` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `starts_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `cancel_at_end` tinyint(1) DEFAULT '0',
  `snapshot` json DEFAULT NULL,
  `payment_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscriptions_payment_id_unique` (`payment_id`),
  KEY `subscriptions_plan_id_foreign` (`plan_id`),
  KEY `subscriptions_workspace_id_starts_at_ends_at_index` (`workspace_id`,`starts_at`,`ends_at`),
  CONSTRAINT `subscriptions_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`),
  CONSTRAINT `subscriptions_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_tickets` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Open',
  `reply` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `support_tickets_workspace_id_foreign` (`workspace_id`),
  KEY `support_tickets_user_id_foreign` (`user_id`),
  CONSTRAINT `support_tickets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `support_tickets_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Open',
  `value_paise` bigint unsigned DEFAULT '0',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `follow_up_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `linked_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linked_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pipeline_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tasks_workspace_id_id_unique` (`workspace_id`,`id`),
  KEY `tasks_workspace_id_assigned_to_foreign` (`workspace_id`,`assigned_to`),
  KEY `tasks_workspace_id_archived_assigned_to_index` (`workspace_id`,`archived`,`assigned_to`),
  KEY `tasks_workspace_id_email_index` (`workspace_id`,`email`),
  CONSTRAINT `tasks_workspace_id_assigned_to_foreign` FOREIGN KEY (`workspace_id`, `assigned_to`) REFERENCES `memberships` (`workspace_id`, `user_id`),
  CONSTRAINT `tasks_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `usage_counters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usage_counters` (
  `workspace_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metric` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `used` int unsigned DEFAULT '0',
  PRIMARY KEY (`workspace_id`,`period`,`metric`),
  CONSTRAINT `usage_counters_workspace_id_foreign` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `suspended` tinyint(1) DEFAULT '0',
  `platform_owner` tinyint(1) DEFAULT '0',
  `totp_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `webhook_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_events` (
  `id` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workspaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspaces` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_used` tinyint(1) DEFAULT '0',
  `duplicate_mode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'email',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `workspaces_owner_id_foreign` (`owner_id`),
  CONSTRAINT `workspaces_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

