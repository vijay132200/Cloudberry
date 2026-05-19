# Cloudberry Health — Demo Credentials

All accounts use the pattern below — no real password verification is performed in demo mode (any password ≥6 characters is accepted).

---

## Patient Portal
**URL:** `/patient/signin`

Sign in with phone number only (password field accepts any value ≥6 chars).

| Name | Phone | Plan | Primary Goal | Risk Level |
|---|---|---|---|---|
| Rahul Sharma | `9876543210` | Comprehensive | Weight Loss | Low |
| Ananya Patel | `9765432109` | Premium | Diabetes Reversal | High |
| Vikram Singh | `9654321098` | Basic | Weight Loss | Medium |
| Meera Iyer | `9543210987` | Premium | PCOS Management | Medium |
| Karan Malhotra | `9432109876` | Comprehensive | Cholesterol Control | Low |

**After login you'll see:**
- Personal dashboard with weight-loss progress and streak count
- Upcoming appointments with care team members
- Nutrition and activity adherence metrics
- Recent check-in history

---

## Coach Portal
**URL:** `/coach/signin`

Sign in with email (password field accepts any value ≥6 chars).

| Name | Email | Specialty |
|---|---|---|
| Kavya Sharma | `coach@cloudberry.health` | Certified Dietician |
| Dr. Sneha Mehta | `dr.mehta@cloudberry.health` | Endocrinologist |
| Rohan Verma | `dietician@cloudberry.health` | Sports Nutritionist |

**After login you'll see:**
- Full patient list with risk levels and last check-in dates
- Per-patient detail view with check-in history and nutrition plan
- Ability to add notes and view metrics

---

## Ops Portal
**URL:** `/ops/signin`

Sign in with email (password field accepts any value ≥6 chars).

| Name | Email | Role |
|---|---|---|
| Priya Nair | `ops@cloudberry.health` | Ops |
| Arjun Kapoor | `admin@cloudberry.health` | Admin |

**After login you'll see:**
- Command center dashboard with total/active/high-risk patient counts
- Patient adherence monitoring across all enrolled patients

---

## Notes

- Tokens are base64-encoded JSON (not JWT) — for demo use only
- Database is seeded with 5 patients, each with 7–14 check-ins, weight metrics, and 3 upcoming appointments
- Ananya Patel (diabetes reversal) also has fasting glucose metrics seeded
- The `ops@cloudberry.health` and `admin@cloudberry.health` accounts are restricted to the Ops portal only
