# Proposal: Libertario loyalty app

Design, without a production build. Libertario Coffee Roasters, October 2026.
The market context is in [loyalty-study.md](loyalty-study.md). Arrival,
passes, and the table QR are in [store-experience.md](store-experience.md).

This is not legal, tax, or data-protection advice. DIAN, SII, and data
rules have to be closed by legal and accounting before any production program
is written.

## Why it exists

Libertario already sells in store with Odoo (POS, restaurant, inventory,
invoicing, eCommerce) and already has a loyalty signal at the register. The
app is not a second points system. It is the face of the program that should
already live in Odoo: the guest sees balance and rewards; the register keeps
earning, redeeming, and invoicing.

Markets in the brief: Colombia first, Chile later. A point from one country
does not travel to another. The currency, the tax, and the company are
different, and a point is not money.

## Product decisions

1. The accounting balance is Odoo's (`loyalty.card` on the contact). The app
   only shows it.
2. Earning and redeeming happen on the POS order, before the invoice closes.
3. At the register the guest is identified with the card code. Signup asks
   for phone, email, name, and ID number, in one step.
4. Level looks at visits. The point looks at eligible pesos. They are
   different accounts.
5. Redemption does not earn points. A tip does not either. Tax should not;
   that has to be confirmed against the POS base (with or without VAT).
6. There is no prepaid balance and no Odoo eWallet in the MVP. That is the
   guest's money. Apple Wallet and Google Wallet do enter: they show stamps
   and points, and they do not hold cash.
7. There is no brand network. Libertario is not Leal.
8. Payment is at the register. The table order does not charge. There is no
   payment inside the app.
9. The arrival promo is a local notification fired by the app's geofence, and
   it opens that store's menu. The pass location is an optional extra.

### What the guest sees

Inside Odoo, 1 point = 1 eligible peso (COP or CLP by company). In the app
the guest sees "points" = that balance divided by 100, with no decimals.
$18,500 eligible shows as 185 points.

The reward catalog is loaded in guest-facing points and translated to Odoo
points when the reward is applied.

MVP expiry: the balance expires after 12 months without an eligible purchase.
It is not FIFO per purchase. FIFO looks like Juan Valdez and needs a lot
ledger Odoo does not ship; it stays on the roadmap only if finance requires it.

### Levels

Evaluated on the first day of each month, from the previous three months.
A visit is a paid, identified POS order that is not only a redemption.
Initial thresholds, to discuss with operations:

| Level | Visits in 3 months | What changes |
| --- | --- | --- |
| House | On signup | Earns and redeems. Birthday if a date was left |
| Bar | 6 or more | One extra point per 100 pesos on one day a month, told in the app |
| Craft | 18 or more | What Bar has, plus an invitation to a cupping or a filter coffee when the store builds one. Finite seats |

There is no permanent multiplier. In specialty coffee the margin does not
hold a rate that rises forever. Dropping a level does not erase points. It
only changes next month's benefit. That has to be said at signup, on a
screen, not in a PDF.

In the MVP everyone is House. The visit calculation is left in the model,
turned off.

### Rewards in the live program

The demo uses the catalog already on the house account:

| Reward | Points |
| --- | --- |
| Americano Paz o Libre | 700 |
| Cappuccino Paz o Libre | 910 |
| Almond croissant | 2,000 |

Every $100 at the register earns one point. Signup leaves a bonus of 1,000.
All three can be requested until 31 December 2026 and are redeemed whole:
they are not completed with cash. Redemption does not earn points. The ledger
is written per store, for example Libertario calle 93.

The gap on the home screen is computed: reward cost minus the balance on
screen. A balance of 898 against the croissant is 1,102, not 1,000.

An earlier table, with 1,200, 800, and 2,000, was a margin hypothesis before
this catalog was read. Finance can review it. The demo does not use it.

## MVP, Colombia

The guest can:

- Create the account with phone, email, name, and ID number, in one step.
- See the balance, the points still needed for the nearest reward, the level,
  and the date the balance would expire if they do not return.
- Show the card code so the register can scan it before charging.
- See the history of identified orders: date, store, points earned or used.
- Choose a reward and get a short single-use code that the register applies
  in the POS. It expires in minutes and dies when it is used.
- Ask for the account to be deleted.

The register, in Odoo, keeps doing:

- Assign the contact when the code is read.
- Show the points the order is going to add.
- Apply the chosen reward and close the order.
- Issue the electronic invoice with the Jorels flow already installed.

The app does not charge in the MVP. Payment is at the register, as today.

### Explicitly out of the MVP

- Order ahead and pick up in store.
- Payment in the app or at the table, including PSE, Nequi, Daviplata, or a
  stored card.
- Prepaid balance, gift card, and Leal Coins of our own.
- Chile, and the other countries.
- A promo from the Wallet location. It can be added later; it is not the channel.
- Automated Bar and Craft levels.
- Challenges, games, referrals, and points for opening the app.
- Rappi or another aggregator. Those sales do not identify the member and
  do not earn.

### Signup

One step: phone, email, name, and ID number. There is no carousel before the
form. At the register the card code is shown large. The test does not send
SMS, WhatsApp, or email: the code is read from the test database, and in the
local demo it appears on the card. Asking for the ID number does not decide
whose name is on the invoice.

### Notifications

| Moment | Channel in the MVP | Why |
| --- | --- | --- |
| Access code, in test | Shown by the test database | No SMS, WhatsApp, or email |
| Points posted and redemption | Email, if an email was left | The ticket leads; email is a copy |
| Birthday and Bar day | Email, with a separate opt-in | Marketing, not required to operate |
| Arrival promo | Local geofence notification | Opens that store's menu. The coordinate does not travel to Odoo |
| Wallet location | Optional extra | Surfaces the pass. It does not replace the promo or open the menu |

## Architecture

```text
phone
  └─ app
        geofence per store → local promo and that store's menu
        Apple / Google pass → stamps and balance, updated when charged
        └─ Libertario API
              test database only
              rejects libertariocoffee.odoo.com
              └─ test Odoo
                    res.partner
                    loyalty.program / rule / reward
                    loyalty.card          ← balance
                    pos.order              ← table order and register charge
                    test invoice
```

The drawing with the table QR and the environment variables is in
[store-experience.md](store-experience.md). The API does not open production.

Minimum contract:

| Operation | Reads or writes | Owner of the fact |
| --- | --- | --- |
| Ask for and confirm the phone code | Creates or finds `res.partner` and the company's `loyalty.card` | API |
| See balance and rewards | Reads the card, the program, and the rewards | Odoo |
| See history | Reads that contact's paid POS orders | Odoo |
| Register code | The `loyalty.card` code the POS already knows how to find | Odoo |
| Redeem intent | Single-use hold, minutes of life | API, and the POS consumes it |
| Apply the reward and add points | `pos.order` when it is charged | POS. The app does not write the balance |

If the API and the POS write the balance at the same time, the invoice fix
and the balance drift. That is why the phone does not add points.

### Register

- The code is scanned before charging. If the order is already paid, it is
  not attached afterwards.
- Do not leave a default customer on the registers that use loyalty.
- Test a real redemption against the Jorels module already installed: a free
  drink, a partial discount, and the difference paid. If the DIAN XML fails,
  the reward does not go to the store.

### Data

What is stored is what the program needs to operate: phone, name, email if
given, birthday if given, store, and the link to the Odoo contact. The
document is not stored "just in case". Colombia (Law 1581 of 2012) and Chile
have their own rules; the app text comes from the policy legal approves, not
from this document.

Deleting the account archives the contact according to what accounting must
keep from the invoice, and turns off the loyalty card. The invoice is not
deleted because the guest closes the app.

## Build order, when it is authorized

1. Test database, loyalty, one promo with a schedule, one table. Do not touch
   production.
2. Host guard. A call to the production host has to fail.
3. QR without payment, floor alert, and charge at the register.
4. Points and stamps on that charged order.
5. Geofence and local notification on our own build.
6. Signed passes, only if the certificate and the Google account are already
   outside the repo.
7. Wallet locations extra, last, and off by default.

Until that passes on the test POS, there is no pilot with guests.

## Roadmap

| Cut | Enters | Stays out |
| --- | --- | --- |
| 0. Test register | Loyalty, scheduled promo, table, charge at the register, no default customer | Production, payment on the phone |
| 1. MVP | Geofence with local push, QR without payment, points, stamps, and passes if the accounts exist | Wallet location, Chile |
| 2. Habit | House / Bar / Craft levels, birthday, email with consent | Payment in the app |
| 3. More stores in Colombia | One geofence per store | Another currency |
| 4. Chile | Company, program in CLP, SII test, the same app, charge at the register | Adding points across countries |
| 5. Wallet extra | Up to ten stores on the pass, as orientation | Using it as the promo channel |
| 6. Only if finance asks | Odoo gift card, separate from the point. FIFO lots if inactivity expiry is not enough | An eWallet dressed as points |

## Open decisions

Closed for the MVP: payment is at the register, and the promo is a native
push with a geofence in the app. The Wallet location stays an optional extra.

Still without an owner:

1. **Apple Developer account and Google Wallet issuer.** Still pending. There
   is no deploy and no signed pass. The demo draws the card on the phone and
   nothing else. The certificate, the password, and the service account, when
   they exist, go to environment variables or a vault. Not to the repository.
2. **Pilot store and Odoo version.** The table QR and the floor button are
   tested on a test database, never on `libertariocoffee.odoo.com`.

Signup is no longer open: it asks for phone, email, name, and ID number.

## What was not built

There is no Odoo module, no signed pass, and there was no call to production.
No email or message was sent. The local demo is this Expo project, web and
native in the same code. How to run it is in the README.
