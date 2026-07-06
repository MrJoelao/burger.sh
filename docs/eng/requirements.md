***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***
# Project Requirements — FastFood

## Table of Contents
1. [Project Objective](#1-project-objective)
2. [System Actors](#2-system-actors)
3. [User Profile Management](#3-user-profile-management)
4. [Restaurant Management](#4-restaurant-management)
5. [Order Management](#5-order-management)
6. [Delivery Management](#6-delivery-management)
7. [Search Features](#7-search-features)
8. [Design Assumptions](#8-design-assumptions)
9. [Excluded or Postponed Features](#9-excluded-or-postponed-features)
10. [Technical Constraints](#10-technical-constraints)

---

## 1. Project Objective

The project aims to build a web application for managing online ordering within a fast food restaurant chain.

The platform must allow users to interact with restaurants through registration, menu browsing, order creation, delivery management, and viewing the main information of their own account.

The system must support the following four main macro-scenarios:

- user profile management
- restaurant management
- order management
- delivery management

---

## 2. System Actors

### Expected Actors

- **Customer**
- **Manager** (Restaurant owner)

### Proposed Extension

- **Admin**, understood as the central administrator of the platform or of the chain, with the ability to manage every restaurant in the chain.

Although not explicitly required by the assignment, the introduction of the Admin is considered a design choice to better represent a franchising context and to separate the global management of the platform from the management of a single branch.

In particular, the Admin can oversee the activation of branches and approve the accounts of Managers registered on the platform.

### Preliminary Role Permissions

| Customer | Manager | Admin/CEO (design choice) |
|---|---|---|
| register and authenticate | register and authenticate | approve registered Manager accounts |
| edit own data | edit own data | create a branch |
| delete own account | delete own account, closing the branch or changing its manager | view all branches |
| browse restaurants | manage own restaurant data | monitor the entire platform |
| browse dishes | manage own restaurant menu | access aggregated information on users, restaurants, and orders |
| place orders | view and update order status | intervene on global system data |
| view current and past orders | view statistics related to own branch | |
| confirm order receipt in case of home delivery | | |

---

## 3. User Profile Management

The system must provide a registration and login phase for users.

- **Customer**: the account is immediately usable after registration.
- **Manager**: registration is allowed, but the account must be approved by an Admin before it can manage a branch.

### Expected User Data

For each user, the system must manage:

- first name
- last name
- email
- password
- address
- account type
- optional preferences
- optional associated payment methods

### Profile Features

The user must be able to:

- view their own data
- edit their personal data
- delete their own account

### User Preferences

The system can associate certain preferences with the customer, at registration time and during system usage, to personalize services, for example:

- preferred product types
- special offers shown as highlights
- preferences related to the purchasing experience

> **TODO**: further specify which preferences will actually be implemented.

---

## 4. Restaurant Management

Restaurant management mainly concerns the Manager role, who administers a single branch of the chain.

### Restaurant Information

For each restaurant, the following information must be managed:

- restaurant name
- address
- location / city
- phone number
- VAT number
- owner / associated Manager

### Menu Management

The Manager must be able to:

- add dishes to their own menu
- edit existing dishes
- remove dishes from the menu

The dishes common to all restaurants will be loaded from `meal.json`, available during the initial system setup phase, and represent the common base shared across branches.

### Dish Information

For each dish, the following information must be managed:

- name
- type
- price
- ingredients
- illustrative photo

In addition to the initially loaded common dishes, the Manager can add custom dishes specific to their own restaurant.

### Manager Dashboard

Each Manager is assumed to have a dashboard to view:

- received orders
- orders in preparation
- completed orders
- revenue
- statistics on best-selling dishes
- number of orders broken down by status

---

## 5. Order Management

Order management concerns the operations through which the customer selects one or more dishes and completes the purchase.

### General Flow

The customer must be able to:

- view the chain's restaurants
- access a restaurant's menu
- select one or more dishes
- add dishes to the cart
- confirm the order
- pay through the app or in person at the counter
- view the alphanumeric code associated with the order

### Cart

The system must provide a cart containing:

- list of selected dishes
- quantity
- unit price
- subtotal
- final total

### Order Data

For each order, the system must store at least:

- associated customer
- associated restaurant
- list of ordered dishes
- quantity for each dish
- total price
- order completion mode
- current order status
- creation date and time
- optional delivery address
- identification / alphanumeric code associated with the order

### Order Statuses

The expected status flow for orders is as follows:

`ordered` → `in preparation` → `ready` → `out for delivery` → `delivered`

| Mode | Status flow |
|---|---|
| In-store pickup | `ordered` → `in preparation` → `ready` → `delivered` |
| Home delivery | `ordered` → `in preparation` → `out for delivery` → `delivered` |

### Purchase History

The customer must be able to view:

- ongoing orders
- past orders
- details of completed purchases

---

## 6. Delivery Management

The system must support at least two order completion modes:

- pickup at the restaurant
- home delivery

### In-Store Pickup

In the case of in-store pickup:

- the system must estimate a waiting time
- the Manager signals when the order is ready
- the customer picks up the order at the counter

An alphanumeric code is also assumed to be associated with the order, to be shown at pickup time.

### Home Delivery

In the case of home delivery:

- the customer enters the delivery address
- the system calculates the distance between the restaurant and the destination, estimating it via the OpenStreetMap APIs
- the delivery cost depends on the distance in km
- upon receiving the order, the customer confirms the delivery, and the order status changes from `out for delivery` to `delivered`

---

## 7. Search Features

The platform must offer search features for restaurants and dishes.

### Restaurant Search

Search by:

- restaurant name
- location / city
- restaurant offering a specific dish

### Dish Search

Search by:

- name
- type
- price
- ingredient
- allergen

> **TODO**: clarify how to model allergens: an explicit list on the dish, or one derived from the ingredients.

---

## 8. Design Assumptions

The following design choices are assumed in the initial phase:

- the system represents a **fast food chain** made up of multiple branches
- each branch is associated with a single responsible Manager
- the customer can interact with all branches through a single platform
- the **Admin** role is introduced as a design extension to manage the platform centrally
- the Manager can register independently, but their account must be approved by an Admin before becoming operational
- restaurant employees are not considered in the system

---

## 9. Excluded or Postponed Features

For the sake of design simplicity, the first version does not consider:

- detailed employee management
- warehouse management
- raw materials management
- delivery staff management as an autonomous entity
- full restaurant accounting

---

## 10. Technical Constraints

- **Frontend**: HTML5 + CSS3 + JS
- **Backend**: Node.js + MongoDB
- **API**: REST, documented with Swagger
