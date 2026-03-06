# Identity Reconciliation API

**Live API:**

https://bitespeed-assignment-xqrj.onrender.com/


## API Endpoint

### POST `/identify`

Identifies and consolidates customer contacts.

#### Request Body

```json
{
  "email": "example@email.com",
  "phoneNumber": "1234567890"
}
```

## Project Structure

```
src/
 ├── server.ts
 │    Express server entry point. Configures middleware and mounts routes.
 │
 ├── route/
 │    └── identify.route.ts
 │         Handles the `/identify` endpoint and validates incoming requests.
 │
 ├── service/
 │    └── identify.service.ts
 │         Contains the core business logic for identity reconciliation.
 │
 ├── queries/
 │    └── contact.repository.ts
 │         Contains SQL queries for interacting with the Contact table.
 │
 ├── model/
 │    └── userInputProp.ts
 │         Defines request input types.
 │
 ├── config/
 │    └── config.ts
 │         PostgreSQL connection pool configuration.
 │
 └── tests/
      └── db/
           └── connection.test.ts
           Simple database connectivity test.
```

---

## Scripts

| Command         | Description                                               |
| --------------- | --------------------------------------------------------- |
| `npm run dev`   | Starts the development server using **nodemon + ts-node** |
| `npm run build` | Compiles TypeScript source files to the `dist/` directory |
| `npm start`     | Runs the compiled server (`dist/server.js`)               |

---



Both fields are optional, but **at least one must be provided**.

#### Example Request

```bash
curl -X POST https://bitespeed-assignment-xqrj.onrender.com/identify \
-H "Content-Type: application/json" \
-d '{"email":"example@email.com","phoneNumber":"1234567890"}'
```

---

## Tech Stack

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* pg (PostgreSQL client)
* Render (deployment)
