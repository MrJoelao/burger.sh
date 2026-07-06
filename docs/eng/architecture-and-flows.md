***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***

# Architecture and Flows

## Table of Contents

1. [Document Purpose](#document-purpose)
2. [Architecture Overview](#architecture-overview)
3. [Frontend](#frontend)
4. [Backend](#backend)
5. [MongoDB Integration](#mongodb-integration)
6. [External Service: OpenStreetMap](#external-service-openstreetmap)
7. [Main Flows](#main-flows)
8. [Reference Diagrams](#reference-diagrams)
9. [Relationship with Other Documents](#relationship-with-other-documents)
10. [Document Scope](#document-scope)

---

## Document Purpose

This document describes the high-level architecture of the **FastFood** project: how the frontend, backend, database, and external services work together.
It acts as a bridge between the requirements (`requirements.md`), the data model (`data-model.md`), and the future implementation of the code.

---

## Architecture Overview

FastFood is a **client-server web application** made up of three main components and one supporting external service.

| Component | Technology | Role |
|---|---|---|
| Frontend | HTML5, CSS3, Bootstrap, JavaScript | User interface and interaction with the API |
| Backend | Node.js + Express | Application logic and exposure of REST APIs |
| Database | MongoDB | Data persistence |
| External service | OpenStreetMap API | Distance calculation for home deliveries |

---

## Frontend

The frontend handles the user interface and content presentation.

- **HTML** for page structure.
- **CSS + Bootstrap** for styling and responsiveness.
- **JavaScript** for client-side logic and `fetch` calls to the REST APIs.

Main features offered to the user:

- registration and login;
- browsing restaurants and menus;
- creating and confirming orders;
- tracking order status;
- dedicated views for Customer, Manager, and Admin.

---

## Backend

The backend implements the application logic and exposes a set of **REST APIs** documented with **Swagger/OpenAPI**.

Main responsibilities:

- user authentication and authorization (by role: Customer, Manager, Admin);
- management of users, restaurants, dishes, and orders;
- order status updates;
- home delivery management;
- generation of aggregated data for dashboards and statistics.

---

## MongoDB Integration

MongoDB is the system's persistence layer. The modeling follows what is defined in `data-model.md`:

- **Embedded**: data tied to the order's lifecycle (order lines, delivery).
- **Referenced**: reusable or shared data (users, restaurants, dishes, ingredients).

This balance between embedding and referencing reduces duplication while still allowing fast access to the most frequently used data.

---

## External Service: OpenStreetMap

For home delivery orders, the backend queries the **OpenStreetMap API** to estimate the distance between the branch and the delivery address.
The resulting distance determines the delivery fee, which is saved in the order.

---

## Main Flows

The flows describe the interaction between user, frontend, backend, database, and external service.

### 1. Registration and login

1. The Customer or Manager submits their data through a frontend form.
2. The backend validates the data, hashes the password, and creates the document in `users`.
3. If the user is a Manager, the account is created with a "pending approval" status and cannot yet manage a branch.
4. At login, the backend verifies the credentials and issues a session/JWT token used to authorize subsequent requests.

### 2. Browsing restaurants and dishes

1. The frontend calls the REST APIs to get the list of restaurants (`restaurants`) and their dishes (`dishes`).
2. The backend applies any search filters (name, city, ingredient, allergen) directly in the MongoDB query.
3. The results are returned to the frontend and shown to the Customer in the relevant views.

### 3. Composing and confirming the order

1. The Customer selects one or more dishes from a restaurant's menu; each selection is added to a draft order (`orders`, with embedded `orderItems`).
2. The frontend calculates and displays subtotals and totals based on data received from the backend.
3. The Customer chooses the fulfillment mode (pickup or home delivery) and confirms the order.
4. The backend validates the order, generates the identifying alphanumeric code, and sets the status to `ordered`.

### 4. Home delivery management

1. If home delivery is chosen, the Customer provides the destination address.
2. The backend calls the OpenStreetMap API to estimate the distance between the branch and the address.
3. The delivery fee is calculated based on the distance and saved in the order's `delivery` subdocument.
4. Upon receiving the order, the Customer confirms delivery and the order status changes from `out for delivery` to `delivered`.

### 5. Order status update by the Manager

1. The Manager views the orders received by the branch from their dashboard.
2. The Manager updates the order status following the flow defined for the chosen mode (pickup or home delivery).
3. The backend persists the update and the Customer can see the new status in their order history.

### 6. Administrative management of branches and managers by the Admin

1. The Admin views Manager accounts pending approval and requests to open new branches.
2. The Admin approves or rejects a Manager account, or creates/closes a branch.
3. The backend updates the status of the involved user/restaurant and makes the related features available.

---

## Reference Diagrams

The documentation currently includes the domain model diagram in the `docs/eng/diagrams/` folder:

| Diagram | File | Description |
|---|---|---|
| Domain model | `docs/eng/diagrams/fastfood-domain-model.*` | Representation of the system's main entities and their relationships |

---

## Relationship with Other Documents

| Document | Content |
|---|---|
| `requirements.md` | What the system must do |
| `data-model.md` | How data is organized in MongoDB |
| `architecture-and-flows.md` | How components collaborate to implement the features |

---

## Document Scope

This file does **not** describe:

- the details of individual REST endpoints (payload, status codes) — see the Swagger documentation;
- the complete internal project folder structure — this belongs to the implementation phase.
