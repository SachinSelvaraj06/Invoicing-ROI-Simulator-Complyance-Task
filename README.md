# Invoicing ROI Simulator — Documentation

## 1. Planned Approach and Architecture
The Invoicing ROI Simulator calculates **ROI, cost savings, and payback** when switching from manual to automated invoicing.

**Architecture:**

- **Frontend:** React.js — handles user inputs and displays results  
- **Backend:** Node.js + Express — performs calculations and serves API requests  
- **Database:** MongoDB — stores saved simulation scenarios  

**Flow:**  
*React UI → Express API+Node.js → MongoDB*

---

## 2. Technologies and Frameworks

| Component | Technology |
|-----------|------------|
| Frontend  | React.js   |
| Backend   | Node.js, Express.js |
| Database  | MongoDB    |

---

## 3. Key Features
- Calculate **ROI, monthly savings, and payback period**  
- **Save, load, and delete** simulation scenarios  
- **Email-gated report** generation (PDF/HTML)  
- Always shows automation as **beneficial** (positive bias factor)
