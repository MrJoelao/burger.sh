***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***
# Data Model

This section describes how the FastFood domain model is mapped to MongoDB collections and documents.  
The goal is to keep the schema consistent with the application access patterns while preserving a clear separation between shared data, reusable data, and order-specific data.

## Main collections

The main collections are:

- **users**
- **restaurants**
- **dishes**
- **ingredients**
- **orders**
- **paymentMethods**

## Collection design

### users
The `users` collection stores all application users, including customers, managers, and admins.  
A role field is used to distinguish the user type, while shared fields such as name, surname, email, password, and address are stored in the same document.

### restaurants
The `restaurants` collection stores the branches of the chain.  
Each restaurant is associated with exactly one manager through a reference to the corresponding user document.

### dishes
The `dishes` collection stores both standard dishes and restaurant-specific custom dishes.  
A flag identifies whether a dish is custom or not, and an optional reference to the restaurant is used only for custom dishes.

### ingredients
The `ingredients` collection stores the ingredients used to compose dishes.  
Each ingredient can be linked to multiple dishes, so this relationship is handled through references rather than full embedding.

### orders
The `orders` collection stores both draft orders and confirmed orders.  
Each order contains an embedded array of `orderItems`, because order lines are tightly bound to the order and are normally read and updated together.

An `orderItem` stores the selected dish, the quantity, and the unit price at the time of purchase.  
The order also stores its current status, order mode, and the total amount.

### delivery
The delivery information is embedded inside the `orders` document as an optional subdocument.  
This choice is appropriate because delivery exists only for home-delivery orders and does not need to live independently from the order.

### paymentMethods
The `paymentMethods` collection stores the payment methods associated with customers.  
Each payment method references the owning customer through the user identifier.

## Embedding and referencing

The data model uses both embedding and referencing:

- **Embedding** is used for data that belongs to the same lifecycle as its parent document, such as `orderItems` and `delivery` inside `orders`.
- **Referencing** is used for reusable or shared data, such as the link between restaurants and managers, dishes and ingredients, and customers and payment methods.

This approach reduces unnecessary duplication while keeping frequently accessed order data available in a single document.

## Design choices

The following design choices were made:

- The `orders` collection also represents the cart in draft state, so no separate cart collection is needed.
- The `delivery` subdocument is present only when the order mode is home delivery.
- Standard dishes and custom dishes are stored in the same collection, with a flag to distinguish them.
- Ingredients are modeled as a separate collection because they are shared across multiple dishes and can be reused in filters related to allergens.

## Model boundaries

This data model does not include API routes, business logic, or frontend behavior.  
Those aspects belong to the architecture and implementation phases.

## Final notes

The schema was designed to fit the project requirements and the expected access patterns.  
In particular, it favors embedding for order-related data and referencing for reusable domain elements.
