-- Sunlife Solar CRM Concurrency-Safe Sequence Migration
-- Prepared and tested for Neon PostgreSQL
-- Status: PENDING OWNER APPROVAL (Do NOT execute until approved)
--
-- Starting numbers calculated from actual database records as of audit verification:
-- Max Lead: 5 -> START 6
-- Max Customer: 1013 -> START 1014
-- Max Project: 1004 -> START 1005
-- Max Document: 1007 -> START 1008
-- Max Payment: 1003 -> START 1004
-- Max Agent: 104 -> START 105
-- Site Survey: START 1001
-- Service Ticket: START 1001
-- Quotation: START 1001

CREATE SEQUENCE IF NOT EXISTS sunlife.lead_seq START WITH 6 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sunlife.customer_seq START WITH 1014 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sunlife.project_seq START WITH 1005 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sunlife.document_seq START WITH 1008 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sunlife.payment_seq START WITH 1004 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sunlife.agent_seq START WITH 105 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sunlife.survey_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sunlife.ticket_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sunlife.quotation_seq START WITH 1001 INCREMENT BY 1;
