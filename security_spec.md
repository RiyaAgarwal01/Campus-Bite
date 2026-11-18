# CampusBite Firestore Security Specification (Phase 0)

## 1. Data Invariants

1. **PII Isolation (`users/{userId}`)**: User profiles containing email, phone, hostel/PG address, and wallet balance are strictly readable only by the profile owner (`request.auth.uid == userId`) or a verified Admin. Users cannot self-assign `role: 'admin'` or inflate `walletBalance` on creation or update.
2. **Authoritative Menu Integrity (`food_items/{foodId}`, `coupons/{couponCode}`, `banners/{bannerId}`)**: Only verified Admins can create, update, or delete menu items, prices, coupons, or promotional banners. Customers have read-only access.
3. **Cart Isolation (`carts/{userId}`)**: A shopping cart belongs strictly to `userId` and cannot be read or mutated by any other student.
4. **Order Ownership & State Machine (`orders/{orderId}`)**:
   - Orders must have `userId == request.auth.uid`, `orderStatus == 'placed'`, and server timestamp `createdAt == request.time` at creation.
   - Customers can only list/read their own orders (`resource.data.userId == request.auth.uid`).
   - Customers can only cancel (`orderStatus: 'cancelled'`) while `existing().orderStatus in ['placed', 'accepted']`.
   - Terminal order states (`delivered`, `cancelled`, `rejected`) lock customer updates permanently.
   - Only verified Admins can progress orders through `accepted -> preparing -> out_for_delivery -> delivered` or `rejected`.
5. **Subscription Ownership (`subscriptions/{subscriptionId}`)**: Customers can only create subscriptions for themselves (`status == 'active'`), read their own subscriptions, and toggle `status` (`active`, `paused`, `cancelled`) or `preferredMeals`. Only Admins can modify `remainingMeals` or `paymentStatus`.
6. **Review Authenticity (`reviews/{reviewId}`)**: Reviews require an authenticated verified user, `userId == request.auth.uid`, rating bounded `1 <= rating <= 5`, and `exists(/databases/$(database)/documents/food_items/$(incoming().foodId))` to prevent orphaned reviews.
7. **Path & Size Hardening**: All document IDs must match `^[a-zA-Z0-9_\-]+$` and stay under 128 characters. All strings and arrays have strict upper bounds.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Privilege Escalation (User Create)**: `{ uid: "u1", role: "admin", ... }` -> **DENIED** (`role == 'student'` enforced for non-admins).
2. **Wallet Tampering (User Update)**: `{ walletBalance: 99999 }` -> **DENIED** (`affectedKeys().hasOnly(...)` excludes `walletBalance` and `role`).
3. **Cross-User PII Read**: `GET /users/other_uid` by non-admin -> **DENIED**.
4. **Email Spoofing Admin Bypass**: Token with `email: "riyaagarwal132002@gmail.com"` and `email_verified: false` -> **DENIED** (`email_verified == true` enforced).
5. **Shadow Ghost Field on Order Create**: `{ ..., isFreeOverride: true }` -> **DENIED** (`keys().hasOnly(...)` rejects unknown fields).
6. **Order Price/Total Client Tampering after Placement**: Customer `UPDATE /orders/ord_1` changing `totalAmount: 1` -> **DENIED** (`affectedKeys().hasOnly(['orderStatus', 'updatedAt'])`).
7. **State Shortcutting (Customer Self-Deliver)**: Customer `UPDATE /orders/ord_1` setting `orderStatus: "delivered"` -> **DENIED** (customers can only set `'cancelled'`).
8. **Late Cancellation Bypass**: Customer `UPDATE /orders/ord_1` setting `orderStatus: "cancelled"` when existing status is `'preparing'` or `'delivered'` -> **DENIED**.
9. **Unscoped List Scraping on Orders**: `LIST /orders` without `where('userId', '==', uid)` -> **DENIED** (`resource.data.userId == request.auth.uid || isAdmin()`).
10. **ID Poisoning Attack**: `CREATE /orders/<1500-char-junk-id>` -> **DENIED** (`isValidId(orderId)` enforces `size() <= 128` and regex).
11. **Orphaned Review Injection**: `CREATE /reviews/r1` with `foodId: "nonexistent_dish"` -> **DENIED** (`exists(.../food_items/...)` check).
12. **Client Timestamp Forgery**: `CREATE /orders/ord_1` with `createdAt: "2020-01-01"` -> **DENIED** (`incoming().createdAt == request.time`).
