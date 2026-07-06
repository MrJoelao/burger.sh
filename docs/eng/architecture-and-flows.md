***

> ⚠️ **Disclaimer:** This translation was produced with the assistance of an AI system. While every effort has been made to preserve accuracy, minor translation errors or imprecisions in technical terminology may be present. Please refer to the original Italian document in case of any ambiguity.

***

# Architecture and Flows

## Document Objective

This document describes the high-level architecture of the **FastFood** project: how the frontend, backend, database, and external services interact with each other.  
It acts as a bridge between the requirements (`requirements.md`), the data model (`data-model.md`), and the future code implementation.

***

## Architecture Overview

FastFood is a **client-server web application** composed of three main components and one supporting external service.

| Component | Technology | Role |
|---|---|---|
| Frontend | HTML5, CSS3, Bootstrap, JavaScript | User interface and API interaction |
| Backend | Node.js + Express | Application logic and REST API exposure |
| Database | MongoDB | Data persistence |
| External Service | OpenStreetMap API | Distance calculation for home delivery |

***

## Frontend

The frontend handles the user interface and content presentation.

- **HTML** for page structure  
- **CSS + Bootstrap** for styling and responsiveness  
- **JavaScript** for client-side logic and `fetch` calls to REST APIs  

Main features available to the user:

- registration and login  
- browsing restaurants and menus  
- order composition and confirmation  
- order status tracking  
- dedicated views for Customer, Manager, and Admin  

***

## Backend

The backend implements the application logic and exposes a set of **REST APIs** documented using **Swagger/OpenAPI**.

Main responsibilities:

- user authentication and authorization (role-based: Customer, Manager, Admin)  
- management of users, restaurants, dishes, and orders  
- order status updates  
- home delivery management  
- generation of aggregated data for dashboards and analytics  

***

## MongoDB Integration

MongoDB serves as the system’s persistence layer. The data modeling follows the specifications defined in `data-model.md`:

- **Embedded**: data tied to the order lifecycle (order items, delivery details)  
- **Referenced**: reusable or shared data (users, restaurants, dishes, ingredients)  

This balance between embedding and referencing reduces data duplication while maintaining fast access to frequently queried data.

***

## External Service: OpenStreetMap

For orders with home delivery, the backend queries the **OpenStreetMap APIs** to estimate the distance between the branch and the delivery address.  
The computed distance determines the delivery cost, which is then stored within the order.

***

## Main Flows

The flows describe the interaction between user, frontend, backend, database, and external service:

1. **Registration and login**  
2. **Browsing restaurants and dishes**  
3. **Order composition and confirmation**  
4. **Home delivery management**  
5. **Order status updates by the Manager**  
6. **Administrative management of branches and managers by the Admin**  

***

## Reference Diagrams

The documentation currently includes only the domain model diagram in the `docs/eng/diagrams/` folder:

| Diagram | File | Description |
|---|---|---|
| Domain model | `docs/eng/diagrams/fastfood-domain-model.*` | Representation of the main entities and their relationships |

***

## Relationship with Other Documents

| Document | Content |
|---|---|
| `requirements.md` | What the system must do |
| `data-model.md` | How data is structured in MongoDB |
| `architecture-and-flows.md` | How components collaborate to implement features |

***

## Document Scope

This file **does not** describe:

- detailed REST endpoint specifications (payloads, status codes) — see Swagger documentation  
- the complete internal project folder structure — this belongs to the implementation phase
