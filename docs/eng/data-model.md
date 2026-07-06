***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***

The domain model represents the main concepts of the FastFood application domain and the relationships between them.  
Its purpose is to describe the problem in conceptual terms, without introducing implementation details related to the database, APIs, or code.

## Main entities
The entities identified in the domain are:

- **User**, specialized into **Customer**, **Manager**, and **Admin**.
- **Restaurant**, which represents a branch of the chain.
- **Dish**, which represents a product that can be ordered by the customer.
- **Ingredient**, associated with dishes to describe their composition.
- **Order**, which represents both the cart during the composition phase and the confirmed order.
- **Delivery**, which exists only in the case of home delivery.
- **OrderItem**, which represents the individual dishes contained in an order together with their quantity.
- **PaymentMethod**, associated with the customer.

## Main relationships
The main modeled relationships are the following:

- A **Customer** can place **Orders**.
- A **Manager** manages a **Restaurant**.
- A **Restaurant** offers **Dishes**.
- An **Order** is composed of multiple **OrderItems**.
- Each **OrderItem** refers to exactly one **Dish**.
- A **Dish** contains one or more **Ingredients**.
- An **Order** may include a **Delivery** only in the case of home delivery.
- A **Customer** can associate one or more **PaymentMethods**.

## Modeling choices
The following design choices were adopted in the diagram:

- The **User** entity was specialized into **Customer**, **Manager**, and **Admin** to clearly distinguish the system roles.
- The **Order** entity also includes the cart concept: an order that has not yet been confirmed is represented through an initial status, such as `draft`.
- The **Delivery** entity was modeled as an optional part of **Order**, since not all orders involve home delivery.
- The **Dish** entity includes both standard chain dishes and restaurant-specific custom dishes; this distinction is represented through a flag.

## Model boundaries
The domain model does not include technical or implementation-oriented elements such as MongoDB collections, REST endpoints, JWT authentication, or persistence details, because these belong to later phases of the design process.

## Design assumptions
The following assumptions were made in the model in order to stay consistent with the requirements:
- each branch is managed by a single manager;
- the admin is modeled as a role distinct from customer and manager;
- the cart is not introduced as an autonomous entity, but as an order in `draft` status;
- delivery is only expected for orders with home-delivery mode.

## Diagram notes
The multiplicities of the associations are shown in the attached UML diagram.  
The diagram was created to represent only the relevant domain concepts, without implementation details.  
The main modeling choices concern the generalization of User, the management of Order as an unconfirmed cart, and the optional presence of Delivery.
