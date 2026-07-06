***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***

## 1. Project Objective
The project aims to develop a web application for managing online orders within a fast food restaurant chain. The platform must allow users to interact with restaurants through features such as account registration, menu browsing, order placement, delivery management, and access to their account information.

The system must handle the following four main macro-scenarios:

- User profile management
- Restaurant management
- Order management
- Delivery management

## 2. System Actors
### Defined Actors

- **Customer**
- **Manager** (Restaurant Owner/Operator)

### Proposed Extension
- **Admin**, intended as the central administrator of the platform or chain, with the ability to manage every restaurant in the chain.

Although not explicitly required by the project specification, the introduction of the Admin role is a deliberate design choice to better represent a franchising context and to separate the global platform management from the management of individual branches. Specifically, the Admin can supervise branch activation and approve Manager accounts registered on the platform.

### Preliminary Role Permissions
#### Customer
- Register and authenticate
- Edit personal data
- Delete own account
- Browse restaurants
- Browse menu items (dishes)
- Place orders
- View current and past orders
- Confirm delivery receipt in case of home delivery

#### Manager
- Register and authenticate
- Edit personal data
- Delete own account, which results in closing the branch or transferring its management
- Manage own restaurant's data
- Manage own restaurant's menu
- View and update order statuses
- View statistics related to own branch

#### Admin/CEO (Design Choice)
- Approve Manager accounts
- Create a branch
- View all branches
- Monitor the entire platform
- Access aggregated data on users, restaurants, and orders
- Intervene on global system data

## 3. User Profile Management
The system must include a registration and login phase for users. For the Customer, the account is immediately usable after registration. For the Manager, registration is allowed but the account must be approved by an Admin before the Manager can operate a branch.

### Expected User Data
For each user, the system must manage:

- First name
- Last name
- Email address
- Password
- Address
- Account type
- Optional preferences
- Optional associated payment methods

### Profile Features
The user must be able to:

- View their own data
- Edit personal information
- Delete their account

### User Preferences
The system may associate certain preferences with a customer — both at registration and during usage — to personalize services, such as:

- Preferred product categories
- Special offers shown prominently
- Preferences related to the purchasing experience

> **TODO:** Clarify which preferences will actually be implemented.

## 4. Restaurant Management
Restaurant management primarily concerns the Manager role, who administers a single branch of the chain.

### Restaurant Information
For each restaurant, the following information must be managed:

- Restaurant name
- Address
- Location / City
- Phone number
- VAT number
- Associated owner / Manager

### Menu Management
The Manager must be able to:

- Add dishes to the menu
- Edit existing dishes
- Remove dishes from the menu

Common dishes shared across all restaurants will be loaded from `meal.json`, available during the initial system setup phase. These represent the shared base across branches.

### Dish Information
For each dish, the following information must be managed:

- Name
- Category / Type
- Price
- Ingredients
- Illustrative photo

In addition to the common dishes loaded at startup, the Manager can add custom dishes specific to their own restaurant.

### Manager Dashboard
It is assumed that every Manager has access to a dashboard displaying:

- Received orders
- Orders in preparation
- Completed orders
- Revenue / Earnings
- Statistics on best-selling dishes
- Number of orders broken down by status

## 5. Order Management
Order management covers the operations through which the customer selects one or more dishes and completes the purchase.

### General Flow
The customer must be able to:

- View the chain's restaurants
- Access a restaurant's menu
- Select one or more dishes
- Add dishes to the cart
- Confirm the order
- Pay via the app or in-person at the counter
- View the alphanumeric code associated with the order

### Shopping Cart
The system must include a cart containing:

- List of selected dishes
- Quantity
- Unit price
- Subtotal
- Grand total

### Order Data
For each order, the system must store at least:

- Associated customer
- Associated restaurant
- List of ordered dishes
- Quantity per dish
- Total price
- Order completion method
- Current order status
- Creation date and time
- Optional delivery address
- Alphanumeric order identifier / code

### Order Statuses
The expected order status flow is:

- `placed`
- `in preparation`
- `ready`
- `out for delivery`
- `delivered`

For **pickup orders**, the expected flow is:
`placed` → `in preparation` → `ready` → `delivered`

For **home delivery orders**, the expected flow is:
`placed` → `in preparation` → `out for delivery` → `delivered`

### Purchase History
The customer must be able to view:

- Ongoing orders
- Past orders
- Details of completed purchases

## 6. Delivery Management
The system must support at least two order completion methods:

- Pickup at the restaurant
- Home delivery

### In-Store Pickup
For pickup orders:

- The system must estimate a waiting time
- The Manager signals when the order is ready
- The customer collects the order at the counter

It is assumed that an alphanumeric code is associated with the order, to be shown at the time of pickup.

### Home Delivery
For home delivery orders:

- The customer provides a delivery address
- The system calculates the distance between the restaurant and the destination, estimated via the OpenStreetMap API
- The delivery cost depends on the distance in kilometers
- Upon receiving the order, the customer confirms delivery, transitioning the order status from `out for delivery` to `delivered`

## 7. Search Features
The platform must offer search functionality for both restaurants and dishes.

### Restaurant Search
Search by:

- Restaurant name
- Location / City
- Restaurants offering a specific dish

### Dish Search
Search by:

- Name
- Category / Type
- Price
- Ingredient
- Allergens

> **TODO:** Clarify how to model allergens — as an explicit list in the dish record or derived from the ingredients.

## 8. Design Assumptions
The following design choices are assumed at the initial stage:

- The system represents a **fast food chain** composed of multiple branches.
- Each branch is associated with a single responsible Manager.
- The customer can interact with all branches through a single unified platform.
- The **Admin** role is introduced as a design extension to manage the platform at a global level.
- The Manager can self-register, but their account must be approved by an Admin before becoming operational.
- Restaurant staff (employees) are not modeled within the system.

## 9. Excluded or Deferred Features
For the sake of design simplicity, the following features are not considered in the first version:

- Detailed employee management
- Inventory / stock management
- Raw materials management
- Delivery personnel management as an autonomous entity
- Full restaurant accounting

## 10. Technical Constraints
- **Frontend:** HTML5 + CSS3 + JavaScript
- **Backend:** Node.js + MongoDB
- **API:** REST, documented with Swagger
