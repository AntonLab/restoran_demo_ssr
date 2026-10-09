# Restoran Demo SSR

A restaurant's website rendered on the server: guests browse the Menu, order
delivery, reserve a table and leave Reviews or Complaints; signed-in Users also
keep Favorites and Order templates; the Admin runs everything from the admin
area. UI text is English, prices are US dollars.

## Language

### People and access

**Guest**:
Someone with no session. May browse, fill a Cart, place an Order, make a
Booking, leave a Review or a Complaint.
_Avoid_: Anonymous user, visitor

**User**:
A registered account with role `user`. Everything a Guest may do, plus
Favorites, Order templates and the Account area.
_Avoid_: Customer (that is the contact on an Order), member

**Admin**:
The account with role `admin`. Created only by the Seed from `ADMIN_EMAIL` and
`ADMIN_PASSWORD`; never through registration.
_Avoid_: Manager, staff, superuser

**Session**:
A signed-in browser, identified by the `sid` cookie. The database keeps only
the SHA-256 of its token; it lasts 7 days and every sign-in starts a new one.

**Account area**:
A User's own pages: Order history, contact details, Order templates and
Favorites.
_Avoid_: Cabinet, profile, dashboard

### Menu

**Menu**:
The public list of Dishes on one page, one section per Category, with filters
(name, price range, In stock) that apply to every section and sorting (price,
Popular first) inside each section. A section left empty by the filters is
hidden.

**Category**:
A Menu section such as Breakfasts or Desserts. Active or inactive; an inactive
Category hides its Dishes. A Category that still has Dishes cannot be deleted.
"Chef's choice" is the first section, not a Category: it lists Dishes marked
Chef's choice, which also appear in their own Category.

**Dish**:
One item on the Menu, with a price in cents, two image sizes, ingredients, a
Weight and a Category. Active or inactive, In stock or not, and soft-deleted instead of
removed.
_Avoid_: Product, item (except as Cart item or Order item)

**Weight**:
The serving size shown on a Dish as free text, such as "300 g" or
"150/200/150 g" for a Dish of several parts. Never used in calculations.
_Avoid_: Portion, size

**Chef's choice**:
A flag on a Dish (`isChefChoice`) that puts it in the Chef's choice section.

**In stock**:
Whether a Dish can be ordered now (`inStock`). Separate from active: an active
Dish out of stock still shows on the Menu.

**Favorite**:
A User's mark on a Dish. The Favorite documents are the source of truth;
`Dish.favoritesCount` is a counter updated atomically with them.
_Avoid_: Like, bookmark

**Popular**:
Ordered by `favoritesCount`, then by Dish order. The home page Carousel shows
the top 8 active Dishes In stock.

### Ordering

**Cart**:
The Dishes a Guest or User intends to order, stored in the database. A Guest's
Cart is keyed by an anonymous httpOnly cookie and merges into the User's Cart
at sign-in.
_Avoid_: Basket

**Order**:
A delivery request: Customer contacts, address, delivery time, Order items and
total. Paid in cash on delivery. A Guest's Orders are found by name and phone
and attach to a User who registers with the same phone.
_Avoid_: Purchase, checkout (that is the step, not the record)

**Price snapshot**:
The Dish name and price copied into an Order item or Booking pre-order when it
is placed. Later price changes never touch it; an Admin's edit recalculates
the total from the snapshots.

**Order template**:
A User's saved name, phone and address for Orders. The last used one is
preselected.
_Avoid_: Saved address, profile address

**Delivery time**:
When an Order should arrive: inside opening hours and no earlier than now plus
1 hour.

### Bookings

**Booking**:
A table reservation: contact, start time, number of guests and an optional
Pre-order. Lasts 2 hours, starts on a 30-minute Slot, must fit inside opening
hours, and is refused when the Concurrent booking limit is reached. There is
no table entity.
_Avoid_: Reservation (in code), table order

**Slot**:
A 30-minute step a Booking may start on.

**Pre-order**:
Dishes chosen with a Booking, with Price snapshots.

**Concurrent booking limit**:
`Settings.maxConcurrentBookings`: how many Bookings may overlap at once.

### Feedback

**Feedback page**:
The public page where a Guest or User leaves a Review or a Complaint and reads
approved Reviews. A page, not a record.

**Review**:
Two ratings of 1 to 5 stars, one for Dishes and one for Service, with
required text and an optional contact. Public only after an Admin approves it.
_Avoid_: Comment, feedback

**Rating**:
One star score of 1 to 5 inside a Review: the Dishes rating or the Service
rating. Not a record of its own.

**Complaint**:
A reason and a contact, sent to the admin area and never shown publicly. Not a
kind of Review.
_Avoid_: Issue, ticket, report

### Venue and operations

**Settings**:
The single document describing the venue: description, contacts, address,
weekly Schedule, social links, timezone and the Concurrent booking limit. The
admin area calls it Venue info.
_Avoid_: Config (that is `src/config/`)

**Schedule**:
Opening and closing time, or closed, for each of the 7 days of the week, in
the Settings timezone. Delivery times and Bookings must fit inside it.

**Number**:
The human-readable id of an Order, Booking or Complaint, issued by the Counter
collection with an atomic `$inc`.
_Avoid_: id (that is the Mongo `_id`)

**New indicator**:
The icon on an admin tab showing that Orders, Bookings, Complaints or Reviews
in status new (or pending) exist. Kept live over SSE; the count of documents
in that status is the source of truth.

**Mail emulator**:
The `log` mail delivery: each email is printed to the server log as
`Mail to {to}: {subject}` with its text. Password reset links are copied from
there.

**Seed**:
`npm run seed`: idempotent; creates the Admin, default Settings, 12 Categories
and demo Dishes with images and `favoritesCount`.

## Statuses

- **Order**: new, accepted, delivery, completed; cancelled from new, accepted
  or delivery. completed and cancelled are final. A User may cancel only a new
  Order.
- **Booking**: new, confirmed, done; cancelled from new or confirmed.
- **Complaint**: new, in_review; in_review and resolved toggle.
- **Review**: pending, then approved or rejected by the Admin.

The server refuses any other transition; each machine is a pure function with
unit tests.
