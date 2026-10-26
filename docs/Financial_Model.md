# Financial Model — Coworking Pass

This document defines the platform's financial structure: how revenue is generated, digital wallet economics, and how partner settlements and loyalty points are calculated.

## 1. Revenue Streams
The platform relies on these main sources of revenue:
* **Direct booking commission:** a percentage (for example 15%) is deducted from every direct booking (daily, monthly or yearly) of desks, rooms and theaters.
* **Universal Pass subscriptions:** selling flexible memberships (monthly and yearly) to individuals and companies (B2C and B2B) and collecting the amounts in advance.
* **Hour package sales:** selling flexible packages for booking meeting rooms and theaters (for example an 8-hours-per-month package).
* **Float from wallets:** amounts prepaid into individual digital wallets and company balances (`Company.balance`) give the platform a strong operating cash float before the services are actually consumed.

---

## 2. Partner Payouts
To keep the system fair and encourage partners to join, they are compensated as follows:
* **Direct desk, room and hall bookings:** the full booking value is transferred to the partner after the platform commission is deducted. (Example: a 100 SAR booking − 15 SAR commission = 85 SAR due to the partner.)
* **Universal Pass holders:** the customer does not pay the partner directly. Instead, the platform pays the partner a **fixed amount per visit (Pass Visit Value)**.
  * *Example:* if the agreed value is 30 SAR and the customer visits the space 5 times this month with confirmed QR scans, 150 SAR is paid to the partner.
* **Payout cycle:** a monthly financial settlement runs on the first day of each Gregorian month for all confirmed QR scans, and is paid to the partners' commercial bank accounts after their commercial registration is verified as matching.

---

## 3. Digital Wallet and Refund Economics
The built-in digital wallet system (`Wallet` and `WalletTransaction`) delivers direct operational and economic savings to the platform:

| Criterion | Refund to the bank card (Gateway Refund) | Instant wallet refund (Instant Wallet Refund) |
| :--- | :--- | :--- |
| **Time to the customer** | 5 to 14 business days | **Instant (0 seconds)** |
| **Payment gateway fees** | Not refunded and borne by the platform (1.5% – 2.5% + fixed) | **0% additional refund fees** |
| **Keeping liquidity inside the platform** | Money leaves the platform's banking system | **100% of the money stays inside the platform** for rebooking |
| **Customer satisfaction and loyalty** | Medium (because of the bank wait) | **Very high** (speed, flexibility and reuse) |

* **Scope of the refund engine for packages and subscriptions**
  - The refund system covers direct bookings, hour packages for meeting rooms (returning unused hours or refunding their value), and Universal Pass packages before they take effect.
  - The instant wallet refund option protects the platform from bleeding bank refund fees (gateway chargebacks) and keeps the purchasing power of the packages inside the ecosystem.
* **Wallet integrity**
  - Wallet deductions are atomic and conditional on sufficient balance, and each payment carries an idempotency key, so a duplicate click or retry cannot double-charge a customer or double-refund them.
  - If a wallet-paid booking is rejected by the server, its share of the amount is returned to the same wallet automatically.
* **The corporate wallet (B2B shared balance)**
  - Lets companies deposit pooled amounts that cover their employees' consumption, recorded in a dedicated ledger (`CompanyWalletTransaction`).
  - Reduces the number of small bank transactions, which saves payment gateway interchange fees and makes the processing cost fixed and calculated in advance.

---

## 4. Loyalty Points Economics
The loyalty program is designed to be sustainable and not to harm the platform's net profit:
* **Base earning rate:** the customer earns [10 points] for every 100 SAR paid.
* **Cash value of a point:** every 100 points equal a [25 SAR] discount.
* **Financial responsibility:** the platform bears the cost of base loyalty points to encourage usage. If a partner proposes to give their space's customers "multiplied points" (as a promotional offer), the partner bears the additional cost from their dues.

---

## 5. Assumed Financial Projections
For planning purposes (MVP), the following figures are assumed for the first quarter after launch:

| Item | Expected count | Average value | Expected total revenue |
| :--- | :--- | :--- | :--- |
| Direct bookings | 1,000 bookings | 150 SAR | 150,000 SAR |
| Universal Passes sold | 500 memberships | 900 SAR | 450,000 SAR |
| Hall hour packages | 200 packages | 400 SAR | 80,000 SAR |
| Digital wallet and company deposits | 100 deposits | 1,000 SAR | 100,000 SAR (floating liquidity balance) |
| **Total revenue and liquidity inflow** | | | **780,000 SAR** |
