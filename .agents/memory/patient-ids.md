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

Existing patient_documents: patient 84 has 7 docs, patient 85 has 2 docs, patient 89 has 3 docs.

**Why:** IDs shifted from earlier seed (was 65-72) to 84-91. Any API test tokens must use staffId 96-100, patient IDs 84-91.
