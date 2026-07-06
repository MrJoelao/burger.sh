***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***
# Data Model

## Table of Contents

1. [Document Objective](#1-document-objective)
2. [Main Collections](#2-main-collections)
3. [Collection Design](#3-collection-design)
4. [Embedding and Referencing](#4-embedding-and-referencing)
5. [Modeling Choices](#5-modeling-choices)
6. [Model Boundaries](#6-model-boundaries)
7. [Final Notes](#7-final-notes)

---

## 1. Document Objective

This section describes how the FastFood domain model is translated into MongoDB collections and documents.
The goal is to keep the schema consistent with the application's main access patterns, preserving a clear separation between shared data, reusable data, and order-specific data.

---

## 2. Main Collections

| Collection | Short Description |
|---|---|
| **users** | Customers, managers, and admins |
| **restaurants** | Chain branches |
| **dishes** | Standard and custom dishes |
| **ingredients** | Ingredients reusable across dishes |
| **orders** | Orders (draft and confirmed), with order lines and delivery |
| **paymentMethods** | Customers' payment methods |

---

## 3. Collection Design

### users

The `users` collection stores all application users, including customers, managers, and admins.

- A `role` field distinguishes the user type.
- Common attributes (first name, last name, email, password, address) are stored in the same document.
- The `managerStatus` field is **exclusively** present in documents with `role: "manager"` and can be `"pending"` or `"approved"`. For `role: "customer"` and `role: "admin"` the field is not included in the document at all (it is not set to `null`, it is simply absent), to avoid ambiguity between "manager not yet approved" and "user for whom the concept does not apply".

Simplified example of a customer document:

```json
{
  "_id": "ObjectId",
  "role": "customer",
  "firstName": "Mario",
  "lastName": "Rossi",
  "email": "mario.rossi@example.com",
  "passwordHash": "...",
  "address": {
    "street": "Via Roma 10",
    "city": "Vigevano",
    "zip": "27029"
  },
  "preferences": ["vegetarian"],
  "createdAt": "ISODate"
}
```

Simplified example of a manager document:

```json
{
  "_id": "ObjectId",
  "role": "manager",
  "firstName": "Anna",
  "lastName": "Bianchi",
  "email": "anna.bianchi@example.com",
  "passwordHash": "...",
  "address": {
    "street": "Via Torino 3",
    "city": "Vigevano",
    "zip": "27029"
  },
  "managerStatus": "pending",
  "createdAt": "ISODate"
}
```

### restaurants

The `restaurants` collection stores the chain's branches.

- Each restaurant is associated with a single manager via a reference to the corresponding user document.

```json
{
  "_id": "ObjectId",
  "name": "FastFood Vigevano Centro",
  "address": "Corso Vittorio Emanuele 5",
  "city": "Vigevano",
  "phone": "+39 0381 000000",
  "vatNumber": "IT01234567890",
  "managerId": "ObjectId (ref: users)"
}
```

### dishes

The `dishes` collection stores both the chain's standard dishes and dishes customized by a specific restaurant.

- An `isCustom` flag identifies whether a dish is customized or not.
- An optional `restaurantId` reference is used only for custom dishes.

```json
{
  "_id": "ObjectId",
  "name": "Classic Burger",
  "type": "burger",
  "price": 6.50,
  "photoUrl": "...",
  "ingredientIds": ["ObjectId (ref: ingredients)", "..."],
  "isCustom": false,
  "restaurantId": null
}
```

### ingredients

The `ingredients` collection stores the ingredients used to compose dishes.

- Each ingredient can be associated with multiple dishes.
- The relationship is managed through references rather than full embedding.

```json
{
  "_id": "ObjectId",
  "name": "Cheddar cheese",
  "allergens": ["lactose"]
}
```

### orders

The `orders` collection stores both draft and confirmed orders.

- Each order contains an embedded array of `orderItems`, since order lines are tightly coupled to the order itself and are normally read and updated together.
- An `orderItem` stores the selected dish, the quantity, and the unit price at purchase time.
- The order also stores its current status, order mode, and total amount.

```json
{
  "_id": "ObjectId",
  "customerId": "ObjectId (ref: users)",
  "restaurantId": "ObjectId (ref: restaurants)",
  "orderItems": [
    {
      "dishId": "ObjectId (ref: dishes)",
      "quantity": 2,
      "unitPrice": 6.50
    }
  ],
  "status": "ordered",
  "mode": "delivery",
  "totalAmount": 13.00,
  "orderCode": "FF-A1B2C3",
  "createdAt": "ISODate",
  "delivery": {
    "address": "Via Milano 20, Vigevano",
    "distanceKm": 3.2,
    "deliveryFee": 2.50
  }
}
```

Allowed values for `status`: `ordered`, `in preparation`, `ready`, `out for delivery`, `delivered`.
The subset of values actually reachable depends on the order mode (`mode`):

| Mode | Applicable status flow |
|---|---|
| `pickup` | `ordered` → `in preparation` → `ready` → `delivered` |
| `delivery` | `ordered` → `in preparation` → `out for delivery` → `delivered` |

This table is consistent with what is defined in `requirements.md`, section "Order Management".

#### delivery (optional subdocument)

Delivery information is embedded within the `orders` document as an optional subdocument.

- This choice is appropriate because delivery only exists for home-delivery orders and should not live independently of the order.
- The subdocument is absent (not set to `null`) when `mode` is `"pickup"`.

### paymentMethods

The `paymentMethods` collection stores the payment methods associated with customers.

- Each payment method contains a reference to the owning customer via the user identifier.

```json
{
  "_id": "ObjectId",
  "customerId": "ObjectId (ref: users)",
  "type": "card",
  "label": "Main card",
  "details": "**** **** **** 1234"
}
```

---

## 4. Embedding and Referencing

The data model uses both embedding and referencing:

| Strategy | When it applies | Examples in the project |
|---|---|---|
| **Embedding** | Data that shares the same lifecycle as the parent document | `orderItems` and `delivery` inside `orders` |
| **Referencing** | Reusable or shared data | restaurant ↔ manager, dish ↔ ingredients, customer ↔ payment methods |

This approach reduces unnecessary duplication while keeping the most frequently accessed order data available in a single document.

---

## 5. Modeling Choices

The following choices were adopted in the data model:

- The `orders` collection also represents the cart in draft state, so a separate cart collection is not needed.
- The `delivery` subdocument is present only when the order mode is home delivery.
- Standard and custom dishes are stored in the same collection, using a flag to distinguish them.
- Ingredients are modeled as a separate collection, since they are shared across multiple dishes and can be reused in allergen-related filters.
- The `managerStatus` field is modeled as an optional attribute, absent (not nullable) for roles that do not require it, to avoid semantic ambiguity during schema validation.

---

## 6. Model Boundaries

This data model does not include API routes, business logic, or frontend behavior.
These aspects belong to the subsequent architectural design and implementation phases.

---

## 7. Final Notes

The schema was designed to be consistent with the project requirements and the expected access patterns.
In particular, it favors embedding for order-related data and referencing for reusable domain elements.
