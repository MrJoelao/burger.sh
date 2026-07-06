***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***

# Data Model

## Table of Contents

1. [Document Purpose](#document-purpose)
2. [Main Collections](#1-main-collections)
3. [Collection Design](#2-collection-design)
4. [Embedding and Referencing](#3-embedding-and-referencing)
5. [Modeling Choices](#4-modeling-choices)
6. [Model Scope](#5-model-scope)
7. [Final Notes](#6-final-notes)

---

## Document Purpose

This section describes how the FastFood domain model is translated into MongoDB collections and documents.
The goal is to keep the schema consistent with the application's main access patterns, preserving a clear separation between shared data, reusable data, and order-specific data.

---

## 1. Main Collections

| Collection | Brief description |
|---|---|
| **users** | Customers, managers, and admins |
| **restaurants** | Chain branches |
| **dishes** | Standard and custom dishes |
| **ingredients** | Ingredients reusable across dishes |
| **orders** | Orders (draft and confirmed), with order lines and delivery |
| **paymentMethods** | Customers' payment methods |

---

## 2. Collection Design

### users

The `users` collection stores all application users, including customers, managers, and admins.

- A `role` field distinguishes the user type.
- Common attributes (first name, last name, email, password, address) are stored in the same document.

Simplified document example:

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
  "managerStatus": null,
  "createdAt": "ISODate"
}
```

The `managerStatus` field is present only for users with `role: "manager"` and can take values such as `"pending"` or `"approved"`.

### restaurants

The `restaurants` collection stores the chain's branches.

- Each restaurant is associated with a single manager via a reference to the related user document.

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

The `dishes` collection stores both the chain's standard dishes and the custom dishes of a specific restaurant.

- An `isCustom` flag identifies whether a dish is custom or not.
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

The `ingredients` collection stores the ingredients used to make up dishes.

- Each ingredient can be associated with multiple dishes.
- The relationship is managed via references rather than full embedding.

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
- An `orderItem` stores the selected dish, the quantity, and the unit price at the time of purchase.
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

Allowed values for `status`: `ordered`, `preparing`, `ready`, `out for delivery`, `delivered` (the actually applicable intermediate values depend on the order mode, see `requirements.md`).

#### delivery (optional subdocument)

Delivery information is embedded inside the `orders` document as an optional subdocument.

- This choice fits because delivery only exists for home delivery orders and should not live independently from the order.
- The subdocument is absent (or `null`) when `mode` is `"pickup"`.

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

## 3. Embedding and Referencing

The data model uses both embedding and referencing:

| Strategy | When it applies | Examples in the project |
|---|---|---|
| **Embedding** | Data sharing the same lifecycle as the parent document | `orderItems` and `delivery` inside `orders` |
| **Referencing** | Reusable or shared data | restaurant ↔ manager, dish ↔ ingredients, customer ↔ payment methods |

This approach reduces unnecessary duplication while keeping the most frequently used order data available in a single document.

---

## 4. Modeling Choices

The following choices were made in the data model:

- The `orders` collection also represents the draft cart, so a separate cart collection is not needed.
- The `delivery` subdocument is present only when the order mode is home delivery.
- Standard and custom dishes are stored in the same collection, using a flag to distinguish them.
- Ingredients are modeled as a separate collection, since they are shared across multiple dishes and can be reused in allergen-related filters.

---

## 5. Model Scope

This data model does not include API routes, business logic, or frontend behavior.
These aspects belong to the later architectural design and implementation phases.

---

## 6. Final Notes

The schema was designed to be consistent with the project requirements and the expected access patterns.
In particular, it favors embedding for order-related data and referencing for reusable domain elements.
