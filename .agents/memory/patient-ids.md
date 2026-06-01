---
name: Patient IDs
description: Actual patient table IDs for seeded demo patients
---

Patient IDs as of current seed (confirmed via DB query):

| patient_id | Name           | Phone       | Check-ins |
|------------|----------------|-------------|-----------|
| 65         | Rahul Sharma   | 9876543210  | 9         |
| 66         | Ananya Patel   | 9765432109  | 13        |
| 67         | Vikram Singh   | 9654321098  | 9         |
| 68         | Meera Iyer     | 9543210987  | 9         |
| 69         | Karan Malhotra | 9432109876  | 10        |
| 70         | Divya Reddy    | 9321098765  | 14        |
| 71         | Arjun Nair     | 9210987654  | 10        |
| 72         | Preethi Menon  | 9109876543  | 15        |
| 73         | Vijay Mallya   | 1144886677  | 1         |

**Why:** Earlier test scripts used IDs 46/47 which produced false cross-portal mismatches. Use 65/66 for Rahul/Ananya in any future API tests.
