---
name: Patient IDs
description: Actual patient table IDs for seeded demo patients (confirmed via DB query)
---

Patient IDs as of current DB state (confirmed via live query):

| patient_id | Phone       | assigned_physician_id | assigned_coach_id |
|------------|-------------|----------------------|-------------------|
| 84         | 9876543210  | 98 (Dr. Mehta)       | 98                |
| 85         | 9765432109  | 99 (Dr. Raj)         | 99                |
| 86         | 9654321098  | 100                   | 100               |
| 87         | 9543210987  | 98 (Dr. Mehta)       | 98                |
| 88         | 9432109876  | 99 (Dr. Raj)         | 99                |
| 89         | 9321098765  | 100                   | 100               |
| 90         | 9210987654  | 98 (Dr. Mehta)       | 98                |
| 91         | 9109876543  | 99 (Dr. Raj)         | 99                |

Staff IDs:
- ops@cloudberry.health → id=96
- ops2@cloudberry.health → id=97
- dr.mehta@cloudberry.health → id=98 (physician)
- dr.raj@cloudberry.health → id=99 (physician)
- dr.priya@cloudberry.health → id=100 (physician)

Rahul (9876543210) = patient 84, Ananya (9765432109) = patient 85.

**Why:** IDs shifted from earlier seed (was 65-72) to 84-91 due to reseed on local PG. Any API test tokens must use staffId 96-100, patient IDs 84-91. IDs are NOT stable across reseeds — always derive from credentials lookup by phone/email.

**Database note:** After removing the postgresql-16 module, the server now uses the Neon DATABASE_URL from Replit Secrets exclusively. The local postgresql module was injecting a conflicting DATABASE_URL into workflow processes, bypassing the Neon Secret.
