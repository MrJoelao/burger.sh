***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***
# Data Model

This section describes how the FastFood domain model is translated into MongoDB collections and documents.  
The goal is to keep the schema consistent with the application's main access patterns, preserving a clear separation between shared data, reusable data, and order-specific data.

## 1. Main collections

| Collection | Brief description |
|---|---|
| **users** | Customers, managers, and admins |
| **restaurants** | Chain branches |
| **dishes** | Standard and custom dishes |
| **ingredients** | Ingredients reused across dishes |
| **orders** | Orders (draft and confirmed), including order items and delivery |
| **paymentMethods** | Customers' payment methods |

## 2. Collection design

### 2.1 users
The `users` collection stores all application users, including customers, managers, and admins.

- A `role` field distinguishes the user type.
- Shared attributes (name, surname, email, password, address) are stored in the same document.

### 2.2 restaurants
The `restaurants` collection stores the chain's branches.

- Each restaurant is associated with exactly one manager through a reference to the corresponding user document.

### 2.3 dishes
The `dishes` collection stores both standard chain dishes and restaurant-specific custom dishes.

- A flag identifies whether a dish is custom or not.
- An optional reference to the restaurant is used only for custom dishes.

### 2.4 ingredients
The `ingredients` collection stores the ingredients used to compose dishes.

- Each ingredient can be associated with multiple dishes.
- This relationship is handled through references rather than full embedding.

### 2.5 orders
The `orders` collection stores both draft orders and confirmed orders.

- Each order contains an embedded array of `orderItems`, since order lines are tightly bound to the order itself and are typically read and updated together.
- An `orderItem` stores the selected dish, the quantity, and the unit price at the time of purchase.
- The order also stores its current status, order mode, and total amount.

#### 2.5.1 delivery (optional subdocument)
Delivery information is embedded within the `orders` document as an optional subdocument.

- This choice is appropriate because delivery only exists for home-delivery orders and does not need to live independently from the order.

### 2.6 paymentMethods
The `paymentMethods` collection stores the payment methods associated with customers.

- Each payment method holds a reference to the owning customer through the user identifier.

## 3. Embedding and referencing

The data model uses both embedding and referencing:

| Strategy | When it applies | Examples in the project |
|---|---|---|
| **Embedding** | Data that shares the same lifecycle as the parent document | `orderItems` and `delivery` inside `orders` |
| **Referencing** | Reusable or shared data | restaurant ↔ manager, dish ↔ ingredients, customer ↔ payment methods |

This approach reduces unnecessary duplication while keeping the most frequently accessed order data available within a single document.

## 4. Design choices

The following design choices were adopted:

- The `orders` collection also represents the cart in draft state, so a separate cart collection is not needed.
- The `delivery` subdocument is present only when the order mode is home delivery.
- Standard and custom dishes are stored in the same collection, using a flag to distinguish between them.
- Ingredients are modeled as a separate collection, since they are shared across multiple dishes and can be reused in allergen-related filters.

## 5. Model boundaries

This data model does not include API routes, business logic, or frontend behavior.  
These aspects belong to later stages of architectural design and implementation.

## 6. Final notes

The schema was designed to remain consistent with the project requirements and the expected access patterns.  
In particular, it favors embedding for order-related data and referencing for reusable domain elements.
