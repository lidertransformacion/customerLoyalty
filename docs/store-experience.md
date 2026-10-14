# In-store experience

Four pieces asked for the Libertario app, read from public sources and from
our own artifacts. October 2026. A local demo lives at the root of this
repository. Production Odoo was not touched and there is no Wallet deploy.
The demo interface is Libertario. Other brands were read for the job a guest
does, not to copy their form.

The brand map is in [loyalty-study.md](loyalty-study.md). The product cut,
with these decisions already applied, is in
[loyalty-proposal.md](loyalty-proposal.md).

This is not legal or tax advice.

## Decisions already taken

Closed for the MVP:

1. **Payment happens at the register.** There is no payment in the app or at
   the table. The QR places an order and calls the floor. Money is taken at
   the counter, on that table's order.
2. **The arrival promo is a native push from a geofence inside the app.**
   On entering the store, the phone shows a promo with an expiry time and
   opens that store's menu. A Wallet pass location is an optional extra: it
   may surface the card on the lock screen. It does not replace the alert
   and it does not open the menu.

Still open, at the end of the proposal: the Apple Developer account, the
Google Wallet issuer, the pilot store, and the Odoo version. Signup already
asks for phone, email, name, and ID number, in one step.

## The four pieces

| Piece | What has to happen | Where the fact lives |
| --- | --- | --- |
| Geofence, arrival | One geofence per store. On enter, a push for a live promo and that store's menu | The app, on the phone. The server does not receive a location trace |
| Points, Juan Valdez style | Earned on eligible spend and redeemed for products | `loyalty.card` and the `pos.order` charged at the register |
| Wallet card | Stamps filled by purchase and a visible points balance. The pass updates after each purchase | Apple PassKit and Google Wallet. The balance remains Odoo's |
| Table, mini-program style | Table QR, order from the table, button to call the floor | QR menu of the **test** POS. Not payment |

## What the public sources say

Read on 14 October 2026.

### Arrival and promo

The MiMcDonald's Colombia FAQ read for the study does not describe geofences.
What is published is from the United States:

- The app asks for location to see the nearby restaurant and nearby offers
  ([location FAQ](https://www.mcdonalds.com/us/en-us/faq/how-do-i-turn-location-services-on-off.html)).
- Mobile Order & Pay appears when the person is within 5 miles of a store
  that offers it, and the menu is that store's
  ([Mobile Order & Pay](https://www.mcdonalds.com/us/en-us/mobile-order-and-pay.html)).
- Ready on Arrival uses the geofence to tell the kitchen the guest is close.
  McDonald's technical blog describes perimeters around the store, with an
  alert, a promo, and preparation
  ([Inside the geofence](https://medium.com/mcdonalds-technical-blog/inside-the-geofence-faster-pickups-start-here-8b7ec97717fe)).

That is a reference for the problem, not Colombia's behavior. For Libertario
the geofence opens the menu and shows a short promo. It does not fire the
kitchen: the order does not exist yet when the person crosses the door.

Leal, Tostao', Crepes & Waffles, and the Juan Valdez terms that were read do
not describe a geofence. That stays unknown, not denied.

### Points for spend, redemption for a product

Juan Valdez publishes 1 point per $100 COP paid, and redemption against a
catalog or, in the app, as a means of payment. Libertario keeps the useful
half: points for eligible spend and redemption for a product on the register
ticket. It does not copy the rate, the segments, or paying with points inside
the app.

Leal accrues per brand and redeems that brand's rewards; the rate is not on
the pages that were read. MiMcDonald's redeems products and, in the Colombia
FAQ, does not let the guest complete a reward with cash. Tostao' returns a
coupon for the month's spend, not a points currency. Crepes & Waffles, in
its FAQ, talks about vouchers.

### Wallet

No Apple Wallet or Google Wallet card for Leal, Juan Valdez, MiMcDonald's
Colombia, Tostao', or Crepes & Waffles appeared on the pages that were read.
That does not prove they do not exist.

The public pass contract is published:

- An Apple pass allows up to 10 `locations`. Each can carry `relevantText`.
  `maxDistance` can only shorten the radius Apple already uses. A `storeCard`
  shows the balance in fields and a `strip.png` behind the primary field.
  That is enough for the stamps.
- Updating the pass requires `webServiceURL` and `authenticationToken`. The
  server sends an empty push to Apple; the phone asks for the new pass.
- Google Wallet: `loyaltyObject.loyaltyPoints.balance` is the balance.
  `merchantLocations` allows 10 points per object and 10 per class. The
  nearby alert is written by Google and opens the pass, not Libertario's
  menu.

The pass cannot be the MVP geofence: ten points do not cover a network, the
platform writes the text, and it does not open the menu. It stays an extra.

### Order at the table

This is not a delivery app. Public guides to eating in China describe another
gesture: a QR on the table, opened with WeChat or Alipay, which raises the
venue's mini program, with categories, a cart, and often payment before the
food leaves the kitchen. Sometimes the guest pays at the end. A mini-program
template describes a button that calls the floor. That is a pattern, not an
official manual.

Odoo 18 publishes the closest thing that already exists in the POS:
[self-order](https://www.odoo.com/documentation/18.0/applications/sales/point_of_sale/self_order.html).
"QR menu" shows the catalog. "QR menu + Ordering" lets the guest order and
also pay. In a restaurant there is one QR per table, and the order falls onto
the preparation screen if a session is open. That page does not describe a
button to call the floor. Payment on the phone is off for the MVP: the order
stays open and is charged at the register.

## Short comparison

| | Geofence and menu on arrival | Points for spend, product redemption | Wallet pass | Table QR and floor call |
| --- | --- | --- | --- | --- |
| Leal | Not published | Points per brand; rate not published | Not published | Not published |
| MiMcDonald's CO | Not in the FAQ that was read. In the US there is location and a pickup geofence | Product redemption | Not published in what was read | Order in the app, not a table QR |
| Juan Valdez | Not published | Published: $100 = 1 point; catalog and pay with points | Not published | "Pick up in store", not a table |
| Tostao' | Not published | Month's spend and a coupon, not points | Not published | Not published |
| Crepes & Waffles | Not published | FAQ: vouchers, not points | Not published | Own delivery. Table QR unknown |
| Libertario, MVP | Local push on enter and that store's menu | Points per eligible peso, reward on the register ticket | Stamps + balance, updated when the order is charged. Pass location optional | QR, order without payment, button for the floor |

## Architecture

```text
phone
  local geofence, one per store
  on enter: local notification of the live promo
            and route /menu/{store}
  Wallet pass, optional, does not open that route

table QR  →  that store's menu on the test POS
             order without payment
             "call the floor" → alert on the open register session
register  →  charges
             adds points and a stamp
             updates Apple and Google

test Odoo only
  loyalty.card = balance
  pos.order    = order and charge
  test invoice
```

The API talks to the test database. It rejects the production host
`libertariocoffee.odoo.com` and any host that is not on an allowlist. The
list, the URL, the database, the user, and the key live in environment
variables or a vault. They do not enter the repository.

Planned names, without values:

| Variable | Use |
| --- | --- |
| `ODOO_TEST_URL` | Test database host |
| `ODOO_TEST_DB` | That database's name |
| `ODOO_TEST_LOGIN` | Test API user |
| `ODOO_TEST_API_KEY` | That user's key |
| `ODOO_TEST_HOST_ALLOWLIST` | Hosts the API accepts |
| `APPLE_PASS_TYPE_IDENTIFIER` | Pass type |
| `APPLE_TEAM_ID` | Apple team |
| `APPLE_PASS_CERT_PATH` | Certificate outside the repo |
| `APPLE_WWDR_CERT_PATH` | WWDR certificate outside the repo |
| `APPLE_PASS_CERT_PASSWORD` | Certificate secret |
| `GOOGLE_WALLET_ISSUER_ID` | Issuer |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_PATH` | Service account JSON, outside the repo |

### Points and stamps

- 1 internal Odoo point = 1 eligible peso. On the card the guest sees that
  balance divided by 100.
- Redemption is a product on the ticket, applied at the register before
  payment. That line does not earn points again.
- Eight stamps. One identified, paid purchase fills one. On the eighth, the
  register offers the card's reward and the strip returns to zero. The stamp
  reward is not the points catalog.
- The demo uses the live catalog: Americano Paz or Libre 700, Cappuccino Paz
  or Libre 910, almond croissant 2,000. The welcome bonus is 1,000. The gap
  to a reward is the cost minus the balance. 2,000 − 898 = 1,102.

### Table

On the test database, with the version that has `pos_self_order`:

- One QR per table. It opens that store's menu.
- The order stays on the table, with no payment method on the phone.
- "Call the floor" publishes an alert on the open register session.
- At the register, the floor opens that table and charges. Points, stamps,
  the test invoice, and the pass update run there.

## MVP

In one pilot store, against the test database:

- The API refuses to open the production host.
- A geofence for that store, on a test phone, shows the live promo and opens
  its menu. An expired promo is not shown.
- A table QR builds an order without payment. "Call the floor" is visible at
  the register. The charge happens at the counter.
- That purchase adds points for the eligible spend and fills a stamp.
- Redeeming a product is applied on the same ticket and does not add points
  on what was redeemed.
- If Apple and Google accounts already exist, the test phone's pass shows the
  new balance and stamps. If they do not, the pass row stays blocked and the
  rest of the MVP can still pass.
- No email or SMS goes out.

## What was not done

There is no published app, no certificate, no call to Odoo, and no message
was sent.
