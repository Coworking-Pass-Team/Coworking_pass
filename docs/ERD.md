# Entity Relationship Diagram (ERD) - Master Version

This ERD encompasses all system entities: foundational booking logic (Waitlists, Durations), the Aggregator logic (B2B, Packages, QR Check-ins, Payouts), Workspace Sections (Desks, Meeting Rooms, Theaters), Notifications & OTP, Amenities Management, and the Loyalty Points & Rules System.

> **Total Entities: 20 | Total Relationships: 24**

```mermaid
erDiagram

    %% ===== CORE ENTITIES =====

    USERS {
        uuid id PK
        string name
        string email
        string password_hash
        enum role "GUEST, B2C, HR_ADMIN, PARTNER_ADMIN, SUPER_ADMIN"
        uuid company_id FK "Nullable - links to COMPANIES if B2B employee"
        boolean email_verified "default false"
    }

    COMPANIES {
        uuid id PK
        string company_name
        uuid hr_admin_id FK
        int total_passes_allocated "Legacy: passes"
        float shared_wallet_balance "New: For Shared Wallet feature"
    }

    PARTNERS {
        uuid id PK
        string brand_name
        string contact_email
        string tax_number
        float revenue_share_percentage
    }

    %% ===== WORKSPACE & SECTIONS =====

    WORKSPACES {
        uuid id PK
        uuid partner_id FK
        string name
        string city
        string location_map_url
        float daily_rate "Reference desk daily rate"
        float monthly_rate "Reference desk monthly rate"
        float yearly_rate "Reference desk yearly rate"
        float pass_visit_value "Value compensated to partner per QR check-in"
        int total_capacity
    }

    WORKSPACE_SECTIONS {
        uuid id PK
        uuid workspace_id FK
        enum type "DESK, MEETING_ROOM, THEATER"
        string name "e.g. Open Desks Area, Meeting Room 1, Main Theater"
        int capacity
        float daily_rate "Nullable - for DESK only"
        float monthly_rate "Nullable - for DESK only"
        float yearly_rate "Nullable - for DESK only"
    }

    HOURLY_PACKAGES {
        uuid id PK
        uuid section_id FK "Links to MEETING_ROOM or THEATER section"
        string package_name "e.g. 2 Hours Per Day or 8 Hours Per Month"
        int hours_amount
        enum period_type "PER_DAY, PER_MONTH"
        float price
    }

    %% ===== AMENITIES MANAGEMENT =====

    AMENITIES_CATALOG {
        uuid id PK
        string name "e.g. Fast Wi-Fi, Coffee, Cleaning Service"
        string icon "Icon identifier for UI"
        boolean is_default "true = platform default - false = partner suggested"
        enum status "APPROVED, PENDING_APPROVAL, REJECTED"
        uuid requested_by FK "Nullable - null for platform defaults - FK to USERS"
        datetime created_at
    }

    WORKSPACE_AMENITIES {
        uuid id PK
        uuid workspace_id FK
        uuid amenity_id FK "Links to AMENITIES_CATALOG"
    }

    %% ===== PLANS & SUBSCRIPTIONS =====

    MEMBERSHIP_PLANS {
        uuid id PK
        string plan_name
        enum type "B2C, B2B"
        int total_visits_allowed
        float price
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        date start_date
        date end_date
        int visits_used
        enum status "ACTIVE, EXPIRED, CANCELLED"
    }

    %% ===== BOOKINGS =====

    DIRECT_BOOKINGS {
        uuid id PK
        uuid user_id FK
        uuid workspace_id FK
        uuid section_id FK "Links to WORKSPACE_SECTIONS"
        enum duration_type "DAILY, MONTHLY, YEARLY"
        date booking_date
        enum status "CONFIRMED, WAITLISTED, CANCELLED"
        datetime created_at "Used for waitlist queue ordering"
    }

    HOURLY_BOOKINGS {
        uuid id PK
        uuid user_id FK
        uuid section_id FK "Links to MEETING_ROOM or THEATER section"
        uuid package_id FK "Links to HOURLY_PACKAGES"
        date start_date
        date end_date "Calculated based on package period type"
        float hours_used "Tracks consumed hours against package"
        enum status "ACTIVE, EXPIRED, CANCELLED"
        datetime created_at
    }

    %% ===== VERIFICATION & SECURITY =====

    QR_CHECK_INS {
        uuid id PK
        uuid user_id FK
        uuid workspace_id FK
        uuid section_id FK "Links to WORKSPACE_SECTIONS"
        datetime scanned_at
        string qr_code_hash
        enum status "VALID, FRAUD_ATTEMPT"
    }

    OTP_CODES {
        uuid id PK
        uuid user_id FK
        string code_hash "Hashed OTP code"
        enum purpose "EMAIL_VERIFICATION, PASSWORD_RESET"
        datetime expires_at
        boolean is_used "default false"
        datetime created_at
    }

    %% ===== FINANCIAL =====

    PAYMENTS {
        uuid id PK
        uuid user_id FK
        float amount
        enum method "MADA, VISA, APPLE_PAY, SAMSUNG_PAY"
        string gateway_transaction_id
        enum payment_for "DIRECT_BOOKING, HOURLY_BOOKING, SUBSCRIPTION, POINTS_REDEMPTION"
        uuid reference_id "FK to the relevant booking or subscription"
        enum status "SUCCESS, FAILED"
    }

    PAYOUTS {
        uuid id PK
        uuid partner_id FK
        string billing_month
        int total_visits_received
        float amount_due
        enum status "PENDING, PAID"
    }

    %% ===== NOTIFICATIONS =====

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        enum type "BOOKING_CONFIRMED, BOOKING_CANCELLED, WAITLIST_PROMOTED, MEETING_BOOKED, PAYMENT_SUCCESS, PAYMENT_FAILED, PASS_ASSIGNED, PASS_EXPIRING, ACCOUNT_VERIFIED, POINTS_EARNED, POINTS_REDEEMED, PAYOUT_PROCESSED, PARTNER_APPROVED, AMENITY_REQUEST_STATUS"
        string title
        string message
        enum channel "EMAIL, IN_APP, BOTH"
        boolean is_read "default false"
        datetime sent_at
        datetime created_at
    }

    %% ===== LOYALTY POINTS =====

    LOYALTY_POINTS {
        uuid id PK
        uuid user_id FK "One record per user"
        int total_earned
        int total_redeemed
        int available_balance
    }

    POINTS_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        enum type "EARNED, REDEEMED"
        int points
        string description "e.g. Earned from monthly booking or Redeemed for daily desk"
        uuid reference_id "Nullable - FK to PAYMENTS or DIRECT_BOOKINGS"
        datetime created_at
    }

    LOYALTY_RULES {
        uuid id PK
        string rule_name "e.g. Earn 10 points per 100 SAR"
        enum rule_type "EARNING, REDEMPTION"
        int points_value "Points earned or required for redemption"
        float monetary_value "SAR amount tied to the rule"
        string description "Detailed rule explanation"
        enum status "APPROVED, PENDING_APPROVAL, REJECTED"
        uuid proposed_by FK "FK to USERS - Partner Admin who proposed"
        uuid approved_by FK "Nullable - FK to USERS - Super Admin"
        boolean is_active "default false until approved"
        datetime created_at
    }

    %% ===== RELATIONSHIPS =====

    USERS ||--o{ SUBSCRIPTIONS : "buys packages"
    USERS }o--o| COMPANIES : "is employee of"
    USERS ||--o{ DIRECT_BOOKINGS : "books duration"
    USERS ||--o{ HOURLY_BOOKINGS : "books hourly section"
    USERS ||--o{ PAYMENTS : "makes payments"
    USERS ||--o{ QR_CHECK_INS : "checks in via QR"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ OTP_CODES : "verifies with"
    USERS ||--o| LOYALTY_POINTS : "has points balance"
    USERS ||--o{ POINTS_TRANSACTIONS : "earns and redeems"
    USERS ||--o{ LOYALTY_RULES : "proposes rules"
    PARTNERS ||--o{ WORKSPACES : "manages branches"
    PARTNERS ||--o{ PAYOUTS : "earns from platform"
    WORKSPACES ||--o{ WORKSPACE_SECTIONS : "divided into"
    WORKSPACES ||--o{ WORKSPACE_AMENITIES : "features"
    WORKSPACES ||--o{ DIRECT_BOOKINGS : "fulfills bookings"
    WORKSPACES ||--o{ QR_CHECK_INS : "validates check-ins"
    WORKSPACE_SECTIONS ||--o{ DIRECT_BOOKINGS : "booked as"
    WORKSPACE_SECTIONS ||--o{ HOURLY_PACKAGES : "offers hourly packages"
    WORKSPACE_SECTIONS ||--o{ HOURLY_BOOKINGS : "reserved for hourly use"
    HOURLY_PACKAGES ||--o{ HOURLY_BOOKINGS : "applied to booking"
    AMENITIES_CATALOG ||--o{ WORKSPACE_AMENITIES : "selected by workspaces"
    MEMBERSHIP_PLANS ||--o{ SUBSCRIPTIONS : "has subscribers"
```$hint

## ًں“Œ طھظپطµظٹظ„ ط£ظ‚ط³ط§ظ… ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ (ERD Breakdown)

ظ„ظƒظٹ طھظƒظˆظ† ظ‡ظٹظƒظ„ط© ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ظˆط§ط¶ط­ط© ظˆظ…ظ‚ط±ظˆط،ط© ظ„ظƒطŒ ظ‚ظ…ظ†ط§ ط¨طھظ‚ط³ظٹظ…ظ‡ط§ ط¥ظ„ظ‰ **7 ط£ظ‚ط³ط§ظ… ط±ط¦ظٹط³ظٹط©**:

### 1. ط§ظ„ظƒظٹط§ظ†ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط© (Core Entities)
- **`USERS`**: ظٹط®ط²ظ† ط¨ظٹط§ظ†ط§طھ ط¬ظ…ظٹط¹ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† (ط²ظˆط§ط±طŒ ط£ظپط±ط§ط¯طŒ ط¥ط¯ط§ط±ظٹظٹظ†طŒ ط´ط±ظƒط§ط،) ظˆطµظ„ط§ط­ظٹط§طھظ‡ظ….
- **`COMPANIES`**: ظ„ظ„ط´ط±ظƒط§طھ ط§ظ„ظ…ظ†ط¶ظ…ط© (B2B) ظˆطھط­ط¯ظٹط¯ ط¹ط¯ط¯ ط§ظ„ط¹ط¶ظˆظٹط§طھ ط§ظ„ظ…ط®طµطµط© ظ„ظ…ظˆط¸ظپظٹظ‡ط§.
- **`PARTNERS`**: ط´ط±ظƒط§ط، ظ…ط³ط§ط­ط§طھ ط§ظ„ط¹ظ…ظ„ (ظ…ط«ظ„ ط²ظ…ظƒط§ظ†طŒ ط±ظٹط¬ط³) ظˆط¨ظٹط§ظ†ط§طھظ‡ظ… ط§ظ„ط¶ط±ظٹط¨ظٹط©.

### 2. ط§ظ„ظ…ط³ط§ط­ط§طھ ظˆط§ظ„ظ…ط±ط§ظپظ‚ (Workspace & Sections)
- **`WORKSPACES`**: طھظپط§طµظٹظ„ ظƒظ„ ظپط±ط¹ ظ…ط³ط§ط­ط© ط¹ظ…ظ„ (ط§ظ„ظ…ط¯ظٹظ†ط©طŒ ط§ظ„ظ…ظˆظ‚ط¹طŒ ط§ظ„طھط³ط¹ظٹط±ط© ط§ظ„ط£ط³ط§ط³ظٹط©).
- **`WORKSPACE_SECTIONS`**: طھظ‚ط³ظٹظ…ط§طھ ط§ظ„ظ…ط³ط§ط­ط© ظ…ظ† ط§ظ„ط¯ط§ط®ظ„ (ظ…ظƒط§طھط¨طŒ ظ‚ط§ط¹ط§طھ ط§ط¬طھظ…ط§ط¹ط§طھطŒ ظ…ط³ط§ط±ط­) ط¨ط³ط¹طھظ‡ط§ ظˆط£ط³ط¹ط§ط±ظ‡ط§ ط§ظ„ط®ط§طµط©.
- **`HOURLY_PACKAGES`**: ط¨ط§ظ‚ط§طھ ط§ظ„ط³ط§ط¹ط§طھ ط§ظ„ظ…ط®طµطµط© ظ„ظ‚ط§ط¹ط§طھ ط§ظ„ط§ط¬طھظ…ط§ط¹ط§طھ ظˆط§ظ„ظ…ط³ط§ط±ط­ (ظ…ط«ظ„: ط¨ط§ظ‚ط© 8 ط³ط§ط¹ط§طھ/ط´ظ‡ط±).

### 3. ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظٹط²ط§طھ (Amenities Management)
- **`AMENITIES_CATALOG`**: ط§ظ„ظ‚ط§ظ…ظˆط³ ط§ظ„ط´ط§ظ…ظ„ ظ„ظ„ظ…ظٹط²ط§طھ (ط§ظ„ط§ظپطھط±ط§ط¶ظٹط© ظ…ظ† ط§ظ„ظ…ظ†طµط© + ط§ظ„طھظٹ ظٹظ‚طھط±ط­ظ‡ط§ ط§ظ„ط´ط±ظƒط§ط، ظˆطھظ†طھط¸ط± ط§ظ„ظ…ظˆط§ظپظ‚ط©).
- **`WORKSPACE_AMENITIES`**: ط¬ط¯ظˆظ„ ظˆط³ظٹط· (Junction) ظٹط±ط¨ط· ط¨ظٹظ† ظƒظ„ ظ…ط³ط§ط­ط© ط¹ظ…ظ„ ظˆط§ظ„ظ…ظٹط²ط§طھ ط§ظ„ظ…طھظˆظپط±ط© ظپظٹظ‡ط§.

### 4. ط§ظ„ط­ط¬ظˆط²ط§طھ ظˆط§ظ„ط¹ط¶ظˆظٹط§طھ (Plans & Bookings)
- **`MEMBERSHIP_PLANS` & `SUBSCRIPTIONS`**: ظ„طھط®ط²ظٹظ† ط§ظ„ط¹ط¶ظˆظٹط§طھ ط§ظ„ط´ط§ظ…ظ„ط© (Universal Pass) ظˆظ…ط¯ط© ط§ط´طھط±ط§ظƒ ط§ظ„ظ…ط³طھط®ط¯ظ… ظپظٹظ‡ط§.
- **`DIRECT_BOOKINGS`**: ط§ظ„ط­ط¬ظˆط²ط§طھ ط§ظ„ظ…ط¨ط§ط´ط±ط© ط§ظ„ط«ط§ط¨طھط© ظ„ظ„ظ…ظƒط§طھط¨ (ط¨ط§ظ„ظٹظˆظ…طŒ ط§ظ„ط´ظ‡ط±طŒ ط§ظ„ط³ظ†ط©) ظˆظٹط´ظ…ظ„ (ط·ط§ط¨ظˆط± ط§ظ„ط§ظ†طھط¸ط§ط±).
- **`HOURLY_BOOKINGS`**: ط­ط¬ظˆط²ط§طھ ظ‚ط§ط¹ط§طھ ط§ظ„ط§ط¬طھظ…ط§ط¹ط§طھ ظˆط§ظ„ظ…ط³ط§ط±ط­ ط§ظ„طھظٹ طھط³طھظ‡ظ„ظƒ ظ…ظ† ط±طµظٹط¯ ط³ط§ط¹ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ….

### 5. ط§ظ„ط¯ظپط¹ ظˆط§ظ„ظ…ط§ظ„ظٹط© (Financial)
- **`PAYMENTS`**: ط¬ظ…ظٹط¹ ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط¯ظپط¹ (ط§ظ„ظˆظ‡ظ…ظٹط© ط­ط§ظ„ظٹط§ظ‹ ط£ظˆ ط§ظ„ط­ظ‚ظٹظ‚ظٹط© ظ…ط³طھظ‚ط¨ظ„ط§ظ‹)طŒ ط³ظˆط§ط، ظ„ط­ط¬ط² ظ…ط¨ط§ط´ط±طŒ ط§ط´طھط±ط§ظƒطŒ ط£ظˆ ط؛ظٹط±ظ‡.
- **`PAYOUTS`**: ط§ظ„طھط³ظˆظٹط§طھ ط§ظ„ظ…ط§ظ„ظٹط© ط§ظ„طھظٹ طھطµط±ظپظ‡ط§ ط§ظ„ظ…ظ†طµط© ط´ظ‡ط±ظٹط§ظ‹ ظ„ظƒظ„ ط´ط±ظٹظƒ ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ط²ظٹط§ط±ط§طھ.

### 6. ط§ظ„طھط­ظ‚ظ‚ ظˆط§ظ„ط£ظ…ط§ظ† (Verification & Security)
- **`QR_CHECK_INS`**: ط§ظ„ط³ط¬ظ„ ط§ظ„ظ„ط­ط¸ظٹ ظ„ظ…ط³ط­ ط±ظ…ظˆط² ط§ظ„ظ€ QR ط¹ظ†ط¯ ط£ط¨ظˆط§ط¨ ظ…ط³ط§ط­ط§طھ ط§ظ„ط¹ظ…ظ„ ظ„ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¯ط®ظˆظ„.
- **`OTP_CODES`**: طھط®ط²ظٹظ† ط£ظƒظˆط§ط¯ ط§ظ„طھط­ظ‚ظ‚ ط§ظ„ظ…ط¤ظ‚طھط© ط§ظ„ظ…ط±ط³ظ„ط© ط¹ط¨ط± ط§ظ„ط¥ظٹظ…ظٹظ„ ظ„ظ„طھط³ط¬ظٹظ„ ظˆط§ط³طھط¹ط§ط¯ط© ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±طŒ ظ„ط¶ظ…ط§ظ† طھط´ظپظٹط±ظ‡ط§ ظˆظ…ط¯ط© طµظ„ط§ط­ظٹطھظ‡ط§.

### 7. ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ظˆظ†ظ‚ط§ط· ط§ظ„ظˆظ„ط§ط، (Notifications & Loyalty)
- **`NOTIFICATIONS`**: ط¬ظ…ظٹط¹ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„طµط§ط¯ط±ط© (ط¨ط±ظٹط¯ ط£ظˆ طھط·ط¨ظٹظ‚) ظ„ظƒظ„ ظ…ط³طھط®ط¯ظ… ظˆطھطھط¨ط¹ ط­ط§ظ„ط© ظ‚ط±ط§ط،طھظ‡ط§.
- **`LOYALTY_RULES`**: ط§ظ‚طھط±ط§ط­ط§طھ ط§ظ„ط´ط±ظƒط§ط، ظ„ظ‚ظˆط§ط¹ط¯ ط§ظ„ظ†ظ‚ط§ط· ظˆط§ظ„طھظٹ ظٹط±ط§ط¬ط¹ظ‡ط§ ط§ظ„ظ€ Super Admin ظ„ظ„ظ…ظˆط§ظپظ‚ط©.
- **`LOYALTY_POINTS` & `POINTS_TRANSACTIONS`**: ط±طµظٹط¯ ظƒظ„ ظ…ط³طھط®ط¯ظ… ظ…ظ† ط§ظ„ظ†ظ‚ط§ط· ظˆط³ط¬ظ„ ط§ظ„ط§ظƒطھط³ط§ط¨ ظˆط§ظ„ط§ط³طھط¨ط¯ط§ظ„.
