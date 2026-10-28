# Vyapaari

A responsive, chat-first inventory dashboard for kirana shop owners. Owner accounts use Firebase Authentication; each account's products, stock activity, and customer balances are stored in Cloud Firestore.

## Run locally

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app configuration.
3. In Firebase Console, enable **Authentication → Email/Password** and create a **Cloud Firestore** database.
4. Publish the included `firestore.rules` to the `vyapaari-b27da` project's Firestore database. From PowerShell, run `npx.cmd firebase-tools login`, then `npx.cmd firebase-tools deploy --only firestore:rules`. The included Firebase CLI config selects the correct project and rules file. Alternatively, paste the rules in Firebase Console → Firestore Database → Rules → Publish. The app cannot read or create inventory until these owner-only rules are published.
5. Run `npm install`, then `npm run dev`.

The app displays a setup screen when Firebase environment variables are missing. It does not silently switch to sample or local-only storage.

## Chat examples

- `sold 3 Maggi and 2 milk packets`
- `received 20 rice bags`
- `damaged 1 cooking oil`
- `returned 1 rice`
- `Ramesh took 2 rice on credit`
- `Ramesh paid ₹200`

Products are initialized with a 25-item starter catalog for each owner. Existing accounts automatically receive missing starter products without overwriting existing stock or reorder levels. To add or rename products, add the corresponding product document under `users/{uid}/products` in Firestore. Chat updates support quantities and item names already in that account's inventory. Sales, credit sales, receipts, damages, returns, and payments are recorded as owner-scoped activity documents; stock changes and credit balances are applied atomically.

The **Customers (Udhaar)** page lets an owner add a named credit amount (adding credit to an existing customer increases their balance) and record a payment against that customer's outstanding amount. Each balance change and its activity history are written in one Firestore transaction. Payments above the current balance are rejected.

Voice input uses the browser Web Speech API when available. Choose English (India) or Kannada before speaking; the chat extracts action, product, quantity, and customer/payment keywords regardless of whether the action comes before or after products. It understands common Kannada action, number, and product terms plus mixed Kannada-English messages; examples include `ಮೂರು ಮ್ಯಾಗಿ ಮತ್ತು ಎರಡು ಹಾಲು ಮಾರಿದೆ`, `ಮ್ಯಾಗಿ ಮಾರಿದೆ ಮೂರು`, `೨೦ ಅಕ್ಕಿ ಚೀಲ ಬಂದಿದೆ`, `ರಮೇಶ್ 2 ಅಕ್ಕಿ ಸಾಲವಾಗಿ ತೆಗೆದುಕೊಂಡರು`, and `ರಮೇಶ್ ₹200 ಕೊಟ್ಟರು`. Kannada speech recognition availability depends on the browser speech service; use a current Chrome or Edge browser, allow microphone access, and use localhost or HTTPS. Browsers without recognition can still use typed messages.

Set `VITE_SUPPLIER_PHONE` to a supplier's WhatsApp number in international digits (without `+`) to prefill the reorder click-to-chat link. Without it, WhatsApp opens with the generated message so the owner can choose a recipient.

## Firebase data and access

- `users/{uid}`: shop profile.
- `users/{uid}/products/{productId}`: stock, minimum stock level, unit, and unit price.
- `users/{uid}/activities/{activityId}`: append-only transaction history.
- `users/{uid}/customers/{customerId}`: customer name and outstanding balance.

The Firestore rules restrict access to the signed-in owner’s user document and nested collections. Review and deploy the rules to your Firebase project before sharing the app.
