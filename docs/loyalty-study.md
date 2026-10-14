# Loyalty study

A plan for a functional and experience study, legal and ethical, of public
loyalty programs. Libertario Coffee Roasters, October 2026.

This document does not decompile apps, does not reproduce proprietary code,
and does not describe how to evade protections. The map below comes from
pages, terms, and public listings. Each row says which source it comes from
and what stays unknown.

Arrival, passes, and the table QR are in
[store-experience.md](store-experience.md). The product proposal is in
[loyalty-proposal.md](loyalty-proposal.md).

## Scope

Questions the study wants to answer:

1. What a guest sees and does in onboarding, purchase, earning, and redemption.
2. How points, or the substitute (coupon, star, coin), are earned and how they expire.
3. Whether there are levels and what moves them: spend, visits, or both.
4. Where the guest is identified at the POS: ID number, QR, short code.
5. Which payments live next to loyalty and which stay out.
6. How notifications arrive and what register integration is required.
7. What of that fits in Odoo POS without a parallel points ledger.

Out of scope:

- Third-party APKs, IPAs, or packages, even from a public store.
- Intercepted traffic, installed certificates, Frida, debuggers, or ADB
  against another brand's app.
- Accounts that are not the researcher's, other guests' data, and SQLite
  databases copied from a phone.
- Reproducing screens, long texts, brands, or mechanics as if they were
  Libertario assets.
- Claiming a public term is still live at the register if it was not checked.

## How evidence is ordered

| Layer | What it answers | Condition |
| --- | --- | --- |
| 1. Public sources | Rules the brand published | Cite URL and date. Do not treat marketing as the contract |
| 2. Own session as a guest | Real onboarding and redemption flow | Own account, of age, accept the terms. Do not share other people's data |
| 3. Public web without login | Structure of a brand page | Only if automated use fits the site's terms |
| 4. Libertario's own app or export | Graph, modules, contract with Odoo | Our own artifact |
| 5. Our own native engine or APK | Pseudocode or classes, if it is ever needed | Still does not authorize a competitor's binary |

On the 14 October 2026 run, layers 4 and the control example worked. Layer 5
did not: there is no Ghidra, Hopper, IDA, or JADX in the environment.

A protocol for an own session, when one is done:

1. One question per visit (for example: does redemption happen before or after payment?).
2. The researcher's account, a real store, a small purchase if needed.
3. Note what was seen, the time, and the store. Keep only our own captures.
4. Mark observation, inference, or unknown.
5. Do not record a PIN, a token, or the body of a payment.
6. Stop if the app asks to bypass a control to continue.

## Feature map

Evidence legend:

- **Published:** page, terms, or store listing cited.
- **Press:** a news note; it may be out of date.
- **Unknown:** it did not appear in the sources that were read. It is not a denial.

Read on 14 October 2026.

### Leal (multi-brand network, Colombia)

Sources: [leal.co/usuarios-app-leal](https://www.leal.co/usuarios-app-leal),
the help center
([what Leal is](https://centrodeayuda.leal.co/que-es-leal-para-usuarios),
[how to redeem](https://centrodeayuda.leal.co/c%C3%B3mo-redimo-mis-puntos),
[redemption code](https://centrodeayuda.leal.co/c%C3%B3mo-generar-el-c%C3%B3digo-para-redimir-mis-premios)),
and the public Google Play listing (`com.kubo.leal`).

| Piece | What was published | Evidence |
| --- | --- | --- |
| Role | Brand network. A shop's points are redeemed in that shop | Published |
| Onboarding | Download the app and register with the data | Published, store listing |
| Identification at the register | Share the ID number with the cashier | Published |
| Earning | When paying at a shop in the network. The rate per peso is not on these pages | The fact is published; the rate is unknown |
| Rewards | Each brand defines its list and the cost in points | Published |
| Redemption | In store. A 4-digit code at the top of the app, or an SMS the cashier sends | Published |
| Leal Coins | Cashback usable as payment at partners or for vouchers. Colombia and El Salvador | Published |
| History | A "my movements" section | Published |
| Discovery | A map of brands | Published |
| Levels | Not described on these pages | Unknown |

Reading for Libertario: Leal solves the network, not the brand. A roaster
with its own stores does not need that network for the MVP. It does need an
identifier the cashier can use without the ID number being spoken aloud.

The live Libertario values used by the demo are not Leal's unpublished rate.
They are the house catalog: $100 = 1 point, Americano 700, Cappuccino 910,
almond croissant 2,000, welcome bonus 1,000.

### MiMcDonald's Colombia

Official source read:
[cloud.news.mcdonalds.com.co/MiM_CO](https://cloud.news.mcdonalds.com.co/MiM_CO).
The rate "1 point per $100" comes from launch press, not from the official
FAQ that was recovered.

| Piece | What holds | Evidence |
| --- | --- | --- |
| Signup | McDonald's app, register on the MiMcDonald's tab, and an order | Published, FAQ |
| Where it earns | Counter, AutoMac, desserts, McCafé, kiosks, order-and-pick-up, and the app's delivery | Published, FAQ |
| Identification | QR at the counter and kiosk; ID number at AutoMac | Published, FAQ |
| Posting | Between 15 minutes and 72 hours, with a cap of 31 days | Published, FAQ |
| Exclusion | Purchases in e-commerce that is not the app | Published, FAQ |
| Expiry | 6 months from the purchase | Published, FAQ |
| Redemption | Only inside the app. Not at the counter or through a third party | Published, FAQ |
| Cash difference | A reward cannot be completed by paying the difference | Published, FAQ |
| Rate | 1 point per $100 in the launch story | Press. Current validity unknown |
| Levels | They do not appear in the FAQ that was read | Unknown |

Reading: redemption lives on the digital order, so the discount sits on the
same ticket as the kitchen and the payment. In Odoo that is applying the
reward on the `pos.order` before invoicing, not in a separate notebook.

### Juan Valdez (Amigos Juan Valdez)

Sources: published terms, the program home, and the App Store listing for
Juan Valdez Colombia. The terms were read as text; if they change, the site
version wins.

| Piece | Published rule |
| --- | --- |
| Who | Natural persons of age. Not legal entities |
| Nature | A promotional point. Not money, a title, or a deposit |
| Rate | 1 point per $100 COP paid in member stores, the app, the online shop, or a kiosk |
| Visit | 1 purchase = 1 visit. Redeeming points and topping up prepaid balance do not count as a visit |
| Segments, twice a year | Friend, Good Friend, Best Friend, cut in January and July, by visits and/or points |
| Point life | 1 year, unless a different promo says otherwise. On redemption the one that expires first leaves first |
| In-store redemption | Catalog at fixed points, whole, not partial |
| App | Points as partial or total payment, minimum 500 points. That transaction does not earn. The app's equivalence is not the store catalog's |
| Invoice | If the electronic invoice is not in the member's name, that purchase does not earn |

Reading: this is the closest coffee reference. It separates status (visits)
from the redemption currency (points), and it ties earning to the electronic
invoice. Prepaid balance is another product (stored money), not the MVP.

### Tostao' (Club del Antojao')

Source: the terms PDF on the brand's site, declared in force from 1 May 2024
until the club ends. This reading did not find a Tostao' Café y Pan loyalty
app.

| Piece | Rule in the PDF |
| --- | --- |
| Signup | Web portal, ID number, phone, over 18. A 20% welcome coupon for one purchase, 30 days |
| Identification | Say the ID number at the register before paying. It is not attached afterwards |
| What accrues | The month's amount, not a points currency. It is erased when the month closes |
| Reward | Next month's coupon. The month is lost if the minimum is not reached |

Reading: monthly habit loyalty, simple for a high-traffic format. For
specialty coffee, a point that is not erased on the first of the month keeps
someone who visits less often and spends more per visit.

### Crepes & Waffles

Official source read: the FAQ. The instrument there is the gift voucher
(plastic or virtual). There is no points program in that FAQ. Points Colombia
and other catalogs sell the brand's vouchers. That is a third party's
loyalty, not Crepes & Waffles. Unknown: whether an internal club exists that
the FAQ does not mention.

Reading: a giftable voucher is an occasion product, different from the
repeated visit. Odoo already separates gift card and loyalty. They should not
share the MVP screen.

### Starbucks Rewards (United States)

This is not the Colombia program. It is included because the brief asked for
the global reference, and because it changed in 2026. Starbucks in Colombia
stays unknown. Do not use the US table as Colombia's rule.

Useful reading without copying the scheme: status speeds earning, redemption
has a price cap to protect margin, and topping up a stored balance is a
separate accelerator. For Libertario a stored balance has a legal and
reconciliation cost; it does not enter the MVP.

## Mechanics compared

| | Leal | MiMcDonald's CO | Juan Valdez | Tostao' | Crepes | Starbucks US |
| --- | --- | --- | --- | --- | --- | --- |
| Currency | Points per brand and Leal Coins | Points | Points | Month's spend | Voucher in pesos | Stars |
| Level | Not published | Not published | Visits and/or points, half year | Month's spend | Not published | Stars in 12 months |
| ID at the register | Document | QR or ID number | ID barcode | ID number spoken at the register | Not in the FAQ | App / card |
| Redemption | 4-digit code or SMS | Only inside the app order | In-store catalog; pay with points in the app | Next month's coupon | Voucher | Item with a price cap |
| Expiry | Not read | 6 months | 1 year, FIFO | The month | The voucher's | 6 months only at the base level |

Patterns that repeat, and that our own design can take as a problem, not as
a specification:

1. Identify before paying. Otherwise the point does not exist.
2. Redemption has to hit the same document as the kitchen and the tax authority.
3. Level and point do not have to be the same account.
4. What does not earn (redemption, top-up, tip, tax) has to be said.
5. A short code at the register reduces friction and also leaks; it needs an expiry and a single use.
6. A multi-brand network dilutes the brand. Libertario competes for habit in its own store.

## POS integration, in the abstract

No public source above hands over the technical contract with the POS. What
is visible is the operational moment:

```text
guest identified
  → ticket with eligible items
  → payment
  → posting (immediate or in hours)
redemption
  → applied to the ticket or to the app order
  → the currency is deducted
  → that line does not generate currency again
```

For Libertario that drawing already has an owner: Odoo POS, the native
loyalty program, and the electronic invoice. The detail is in the proposal.

## Questions still open

| Question | State |
| --- | --- |
| Current MiMcDonald's Colombia rate | Open. The FAQ that was read does not repeat it; the launch press does |
| Exact Tostao' Gourmet and Supremo thresholds | Open, because of the PDF's spelling |
| Crepes & Waffles own program | Open. The official FAQ talks about vouchers |
| Starbucks in Colombia | Open. Do not use the US table |
| Each brand's points rate inside Leal | Open |
| Exact Odoo version at Libertario and the loyalty rules already configured | Open |
| MiMcDonald's geofence in Colombia | Open. What is published in detail is from the United States |
| Wallet passes for these brands | Open. They did not appear on the pages that were read |
| Pay at the table versus pay at the register, for Libertario | Closed: payment is at the register. See the store experience |
| App push versus Wallet location | Closed: native push with a geofence. Wallet is an extra |

Those rows are not closed by reverse engineering a binary.
