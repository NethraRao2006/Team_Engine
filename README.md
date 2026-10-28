# Vyapaari

Vyapaari is a responsive, chat-first inventory assistant for kirana shop owners. Record sales, receipts, damage, customer credit, and payments using everyday messages; monitor stock and customer balances; and review transaction history in one place.

The public landing page leads to an owner sign-in or account-creation page. After signing in, each owner gets a private workspace backed by Firebase Authentication and Cloud Firestore.

## Features

- **Chat-based stock updates:** Type or speak natural messages to record sales, stock received, damage, and customer returns. Multiple products can be included in one update.
- **Inventory management:** Start with a 25-product catalog, see current stock and minimum stock levels, and change reorder thresholds. Existing product stock is preserved when the catalog is initialized.
- **Voice input:** Use browser speech recognition where supported. Choose English (India) or Kannada; typed English, Kannada, and mixed-language messages are also supported.
- **Low-stock alerts and reordering:** See products at or below their reorder threshold and generate a supplier message that opens WhatsApp.
- **Sales & Reports:** Review recorded transactions, including sales, receipts, damage, customer returns, credit, payments, and supplier returns.
- **Customers (Udhaar):** Add a credit balance for a named customer, record payments, and see the remaining balance. Payments greater than the outstanding amount are rejected.
- **Dead Stock:** Find products with stock remaining and no recorded sale or restock activity for at least 30 days. Record a return to the supplier by quantity; inventory and the supplier-return history entry are saved together.
- **Responsive interface:** Use the dashboard on desktop, tablet, or mobile.
- **Shop settings:** Set the shop name for the owner workspace.

## Chat examples

```text
sold 3 Maggi and 2 milk packets
received 20 rice bags
damaged 1 cooking oil
returned 1 rice
Ramesh took 2 rice on credit
Ramesh paid ₹200
```

The parser uses product names, quantities, and action keywords; action and quantity wording can vary. Kannada and mixed-language examples:

```text
ಮೂರು ಮ್ಯಾಗಿ ಮತ್ತು ಎರಡು ಹಾಲು ಮಾರಿದೆ
ಮ್ಯಾಗಿ ಮಾರಿದೆ ಮೂರು
೨೦ ಅಕ್ಕಿ ಚೀಲ ಬಂದಿದೆ
ರಮೇಶ್ 2 ಅಕ್ಕಿ ಸಾಲವಾಗಿ ತೆಗೆದುಕೊಂಡರು
ರಮೇಶ್ ₹200 ಕೊಟ್ಟರು
```

## Requirements

- Node.js 18 or newer
- A Firebase project with Email/Password Authentication and Cloud Firestore enabled
- A modern browser; Chrome or Edge on localhost or HTTPS is recommended for voice recognition

## Firebase setup

1. Copy `.env.example` to `.env.local`.
2. Fill in the Firebase web app configuration:

   ```dotenv
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. In the Firebase Console, enable **Authentication → Email/Password** and create a **Cloud Firestore** database.
4. Publish `firestore.rules` to the same Firebase project. The checked-in Firebase CLI configuration targets project `vyapaari-b27da`. From PowerShell:

   ```powershell
   npx.cmd firebase-tools login
   npx.cmd firebase-tools deploy --only firestore:rules
   ```

   Alternatively, paste the contents of `firestore.rules` into **Firestore Database → Rules** in the Firebase Console and publish them. These owner-only rules are required for inventory, customer, and activity access.

5. Restart the development server after editing `.env.local`.

When Firebase configuration is missing, the app displays a setup screen; it does not switch to sample or local-only storage.

## Run and test locally

```powershell
npm.cmd install
npm.cmd run dev
```

Run the production build and tests:

```powershell
npm.cmd run build
npm.cmd test
```

The `preview` script can serve the production build locally with `npm.cmd run preview`.

## Supplier WhatsApp message

Set `VITE_SUPPLIER_PHONE` in `.env.local` to the supplier’s international phone number using digits only, without a leading `+`:

```dotenv
VITE_SUPPLIER_PHONE=919876543210
```

The reorder action opens a WhatsApp click-to-chat link with a generated message. If no number is configured, WhatsApp opens the message so the owner can select a recipient. Restart the development server after changing the value.

## Dead Stock behavior and limitations

Dead Stock uses recorded activity history to identify a product’s most recent sale or stock receipt. It flags the product when at least 30 days have passed since that activity and stock remains. A new sale or restock starts a new inactivity period.

Starter products that were already in inventory before their activity history was recorded do not have a reliable stock age. They are not assigned an assumed receipt date and will not appear as dead stock until relevant activity has been recorded. The feature records a stock return to the supplier; it does not contact the supplier or initiate a refund.

The chat action **“returned”** adds a customer return back into inventory. **Return to seller** in Dead Stock is a separate action that removes the selected quantity from inventory and records a supplier-return transaction.

Voice recognition depends on browser speech-service support and microphone permission. Kannada voice recognition may not be available in every browser or region; typed Kannada messages remain available.

## Firestore data and access

- `users/{uid}`: shop profile.
- `users/{uid}/products/{productId}`: product name, stock, minimum stock level, unit, and unit price.
- `users/{uid}/activities/{activityId}`: stock movements, sales, credit, payments, and supplier-return history.
- `users/{uid}/customers/{customerId}`: customer name and outstanding balance.

Each owner’s documents are scoped to their Firebase Authentication UID. Stock transactions, customer balance changes, and supplier returns are written with Firestore transactions so the corresponding records stay consistent.
