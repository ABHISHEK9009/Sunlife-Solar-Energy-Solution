# Connecting Sunlife Solar to the CRM

The Flutter app should not connect directly to the CRM database. Put an authenticated HTTPS backend API between the app and CRM so database credentials and business rules stay private.

```text
Flutter app
  -> Backend API
      -> Sunlife CRM/database (source of truth)
      -> Document object storage
      -> Payment gateway
      -> Inverter provider APIs
      -> Firebase Cloud Messaging
```

## Login flow

1. A sales executive creates the customer with a verified mobile number in the CRM.
2. `POST /v1/auth/request-otp` verifies that the number is eligible and sends an OTP.
3. `POST /v1/auth/verify-otp` returns short-lived access and refresh tokens.
4. Flutter stores the refresh token in platform secure storage.
5. The backend derives the customer ID from the token for every request. Never use a customer ID supplied by the app as authorization.

## Suggested API

```text
POST /v1/auth/request-otp
POST /v1/auth/verify-otp
GET  /v1/me
GET  /v1/projects/current
GET  /v1/projects/{id}/timeline
GET  /v1/projects/{id}/documents
GET  /v1/projects/{id}/payments
GET  /v1/projects/{id}/subsidy
GET  /v1/plants/{id}/generation?period=month
GET  /v1/service-tickets
POST /v1/service-tickets
POST /v1/device-tokens
```

CRM changes should emit events such as `survey.completed`, `quotation.uploaded`, `payment.received`, and `subsidy.status_changed`. The API exposes the updated data and sends a push notification when needed. Use presigned short-lived URLs for documents/uploads. Verify payment webhooks server-side; never trust payment amounts from Flutter.

## Flutter packages for the production connection

- `dio`: HTTP and token-refresh interceptor
- `flutter_secure_storage`: refresh-token storage
- `firebase_messaging`: push notifications
- `flutter_riverpod` or `bloc`: state and repository wiring
- OpenAPI-generated Dart models: shared request/response contract

## Information needed from your CRM

- CRM technology and database type
- Existing API documentation, if any
- Customer/project tables and stable identifiers
- Status values and allowed transitions
- Document storage location
- OTP, payment, WhatsApp, and notification providers
- Inverter brands and API access

With these details, define an OpenAPI contract, build a staging API, then replace this app's demo data with authenticated repositories.
