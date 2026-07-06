***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***
# Architecture and Flows

## Table of Contents

1. [Document Objective](#1-document-objective)
2. [Architecture Overview](#2-architecture-overview)
3. [Frontend](#3-frontend)
4. [Backend](#4-backend)
5. [MongoDB Integration](#5-mongodb-integration)
6. [External Service: OpenStreetMap](#6-external-service-openstreetmap)
7. [Authentication and Session](#7-authentication-and-session)
8. [Main Flows](#8-main-flows)
9. [Reference Diagrams](#9-reference-diagrams)
10. [Relationship with Other Documents](#10-relationship-with-other-documents)
11. [Document Boundaries](#11-document-boundaries)

---

## 1. Document Objective

This document describes the high-level architecture of the **FastFood** project: how frontend, backend, database, and external services collaborate.
It bridges the requirements (`requirements.md`), the data model (`data-model.md`), and the future implementation of the code.

---

## 2. Architecture Overview

FastFood is a **client-server web application** made up of three main components and one supporting external service.

| Component | Technology | Role |
|---|---|---|
| Frontend | HTML5, CSS3, Bootstrap, JavaScript | User interface and interaction with the API |
| Backend | Node.js + Express | Application logic and exposure of REST APIs |
| Database | MongoDB | Data persistence |
| External service | OpenStreetMap API | Distance calculation for home delivery |

---

## 3. Frontend

The frontend handles the user interface and content presentation.

- **HTML** for page structure.
- **CSS + Bootstrap** for styling and responsiveness.
- **JavaScript** for client-side logic and `fetch` calls to the REST APIs.

Main features offered to the user:

- registration and login;
- browsing restaurants and menus;
- composing and confirming orders;
- tracking order status;
- dedicated views for Customer, Manager, and Admin.

---

## 4. Backend

The backend implements the application logic and exposes a set of **REST APIs** documented with **Swagger/OpenAPI**.

Main responsibilities:

- authentication and authorization of users (by role: Customer, Manager, Admin);
- management of users, restaurants, dishes, and orders;
- updating order status;
- managing home deliveries;
- producing aggregated data for dashboards and statistics.

---

## 5. MongoDB Integration

MongoDB is the system's persistence layer. The modeling follows what is defined in `data-model.md`:

- **Embedded**: data tied to the order's lifecycle (order lines, delivery).
- **Referenced**: reusable or shared data (users, restaurants, dishes, ingredients).

This balance between embedding and referencing reduces duplication while still keeping fast access to the most frequently queried data.

---

## 6. External Service: OpenStreetMap

For home-delivery orders, the backend queries the **OpenStreetMap API** to estimate the distance between the branch and the delivery address.
The resulting distance determines the delivery cost, which is saved on the order.

---

## 7. Authentication and Session

User authentication (Customer, Manager, Admin) follows a token-based flow, described in detail in the "Registration and login" flow (section 8.1).

- At login, the backend verifies the credentials and, if correct, issues a session/JWT token.
- The frontend includes the token in every subsequent request to protected APIs, typically in the `Authorization` header.
- The backend validates the token on every request and derives the user's role and identity from it to apply authorization checks.
- A Manager with `managerStatus: "pending"` can authenticate, but branch-management features remain locked until approval by an Admin.

The implementation details of the token mechanism (format, expiration, refresh) are left to the implementation phase and are not covered by this document.

---

## 8. Main Flows

The flows describe the interaction between user, frontend, backend, database, and external service.

### 8.1 Registration and Login

1. The Customer or Manager submits their data through a frontend form.
2. The backend validates the data, hashes the password, and creates the document in `users`.
3. If the user is a Manager, the account is created with `managerStatus: "pending"` and cannot yet manage a branch.
4. At login, the backend verifies the credentials and issues a session/JWT token used to authorize subsequent requests (see section 7).

### 8.2 Browsing Restaurants and Dishes

1. The frontend calls the REST APIs to get the list of restaurants (`restaurants`) and their dishes (`dishes`).
2. The backend applies any search filters (name, city, ingredient, allergen) directly in the MongoDB query.
3. The results are returned to the frontend and shown to the Customer in the relevant views.

### 8.3 Composing and Confirming the Order

1. The Customer selects one or more dishes from a restaurant's menu; each selection is added to a draft order (`orders`, with embedded `orderItems`).
2. The frontend calculates and displays subtotals and final totals based on data received from the backend.
3. The Customer chooses the completion mode (in-store pickup or home delivery) and confirms the order.
4. The backend validates the order, generates the identifying alphanumeric code, and sets the status to `ordered`.

### 8.4 Home Delivery Management

1. If home delivery is chosen, the Customer provides the destination address.
2. The backend calls the OpenStreetMap API to estimate the distance between the branch and the address.
3. The delivery cost is calculated based on the distance and saved in the order's `delivery` subdocument.
4. Upon receipt, the Customer confirms the delivery and the order status changes from `out for delivery` to `delivered`.

### 8.5 Order Status Update by the Manager

1. The Manager views the branch's received orders from their dashboard.
2. The Manager updates the order status following the flow defined for the chosen mode (pickup or home delivery), as defined in `data-model.md`.
3. The backend persists the update, and the Customer can see the new status in their order history.

### 8.6 Administrative Management of Branches and Managers by the Admin

1. The Admin views Manager accounts with `managerStatus: "pending"` and requests to open new branches.
2. The Admin approves or rejects a Manager account, or creates/closes a branch.
3. The backend updates the status of the involved user/restaurant and makes the related features available.

---

## 9. Reference Diagrams

The documentation currently includes the domain model diagram in the `docs/eng/diagrams/` folder:

| Diagram | File | Description |
|---|---|---|
| Domain model | `docs/eng/diagrams/fastfood-domain-model.*` | Representation of the system's main entities and their relationships |

> **Note**: a sequence diagram dedicated to the authentication flow (sections 7 and 8.1) is not yet available and may be added in a future version of the documentation.

---

## 10. Relationship with Other Documents

| Document | Content |
|---|---|
| `requirements.md` | What the system must do |
| `data-model.md` | How data is organized in MongoDB |
| `architecture-and-flows.md` | How the components collaborate to implement the features |

---

## 11. Document Boundaries

This file does **not** describe:

- the detail of individual REST endpoints (payload, status codes) — see Swagger documentation;
- the complete internal project folder structure — belongs to the implementation phase.
