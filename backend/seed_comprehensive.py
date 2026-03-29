"""
seed_comprehensive.py
─────────────────────
Comprehensive database seeding with departments, admins, and sample data.

Creates:
  - 1 Super Admin (org-wide access)
  - 5 Departments (Maintenance, Cafeteria, IT Support, Housekeeping, Security)
  - 5 Department Heads (one per department)
  - 10 Regular Users (students)
  - 20 Sample Complaints (with dept assignments, various statuses)
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.database import Base, DATABASE_URL
from models.user import UserORM
from models.department import DepartmentORM, DepartmentAdminORM
from models.complaint import ComplaintORM
from services.auth_service import hash_password

# ── Configuration ────────────────────────────────────────────────────────────

DEPARTMENTS = [
    {"name": "Maintenance",  "location": "Building A"},
    {"name": "Cafeteria",    "location": "Dining Hall"},
    {"name": "IT Support",   "location": "Computer Lab"},
    {"name": "Housekeeping", "location": "Campus Wide"},
    {"name": "Security",     "location": "Main Gate"},
]

SUPER_ADMIN = {
    "user_id":   "admin-001",
    "full_name": "System Admin",
    "email":     "admin@gst.sies.edu.in",
    "password":  "admin123",
}

DEPARTMENT_HEADS = [
    {"user_id": "head-maintenance", "full_name": "Mr. Sharma",  "email": "maintenance@gst.sies.edu.in", "dept": "Maintenance"},
    {"user_id": "head-cafeteria",   "full_name": "Ms. Patel",   "email": "cafeteria@gst.sies.edu.in",   "dept": "Cafeteria"},
    {"user_id": "head-it",          "full_name": "Dr. Gupta",   "email": "it@gst.sies.edu.in",          "dept": "IT Support"},
    {"user_id": "head-housekeeping","full_name": "Mr. Kumar",   "email": "housekeeping@gst.sies.edu.in","dept": "Housekeeping"},
    {"user_id": "head-security",    "full_name": "Mr. Singh",   "email": "security@gst.sies.edu.in",    "dept": "Security"},
]

SAMPLE_USERS = [
    {"user_id": f"student-{i:03d}", "full_name": f"Student {i}", "email": f"student{i}@gst.sies.edu.in", "prn": f"124A{1000 + i}"}
    for i in range(1, 11)
]

COMPLAINT_TEMPLATES = [
    {"text": "AC is not working in classroom",   "category": "HVAC/Climate",       "location": "Building A"},
    {"text": "Water tap is leaking",             "category": "Water/Plumbing",     "location": "Building B"},
    {"text": "WiFi down in lab",                 "category": "Internet/WiFi",      "location": "Computer Lab"},
    {"text": "Food quality is poor",             "category": "Food Quality",       "location": "Cafeteria"},
    {"text": "Lights not working",               "category": "Electricity/Power",  "location": "Building C"},
    {"text": "Campus is dirty",                  "category": "Cleanliness",        "location": "Campus Wide"},
    {"text": "Door lock broken",                 "category": "Maintenance",        "location": "Hostel"},
    {"text": "Furniture damaged",                "category": "Furniture",          "location": "Library"},
    {"text": "Noise from construction",          "category": "Noise",              "location": "Building A"},
    {"text": "Security gate issue",              "category": "Security",           "location": "Main Gate"},
]

STATUSES    = ["Open", "In Progress", "Resolved"]
PRIORITIES  = ["Low", "Medium", "High", "Critical"]

# ── Main Seeding Function ────────────────────────────────────────────────────

def seed_database():
    """Main seeding function."""
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data
        db.query(ComplaintORM).delete()
        db.query(DepartmentAdminORM).delete()
        db.query(DepartmentORM).delete()
        db.query(UserORM).delete()
        db.commit()
        print("✓ Cleared existing data")

        # 1. Create Super Admin
        super_admin = UserORM(
            user_id       = SUPER_ADMIN["user_id"],
            full_name     = SUPER_ADMIN["full_name"],
            email         = SUPER_ADMIN["email"],
            password_hash = hash_password(SUPER_ADMIN["password"]),
            role          = "super_admin",
            is_super_admin= True,
            is_active     = True,
        )
        db.add(super_admin)
        db.commit()
        print(f"✓ Created super admin: {SUPER_ADMIN['email']}")

        # 2. Create Departments
        dept_map = {}
        for dept_info in DEPARTMENTS:
            dept = DepartmentORM(
                name     = dept_info["name"],
                location = dept_info["location"],
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            dept_map[dept_info["name"]] = dept.id
            print(f"✓ Created department: {dept_info['name']} (ID: {dept.id})")

        # 3. Create Department Heads
        for head_info in DEPARTMENT_HEADS:
            head = UserORM(
                user_id       = head_info["user_id"],
                full_name     = head_info["full_name"],
                email         = head_info["email"],
                password_hash = hash_password("defaultpass123"),
                role          = "department_head",
                is_super_admin= False,
                is_active     = True,
                dept_id       = dept_map[head_info["dept"]],
            )
            db.add(head)
            db.commit()
            db.refresh(head)

            # Link to department_admins table
            admin_link = DepartmentAdminORM(
                user_id = head.user_id,
                dept_id = dept_map[head_info["dept"]],
            )
            db.add(admin_link)
            db.commit()
            print(f"✓ Created dept head: {head_info['full_name']} for {head_info['dept']}")

        # 4. Create Regular Users
        for user_info in SAMPLE_USERS:
            user = UserORM(
                user_id       = user_info["user_id"],
                full_name     = user_info["full_name"],
                email         = user_info["email"],
                password_hash = hash_password("userpass123"),
                role          = "user",
                is_super_admin= False,
                is_active     = True,
                prn           = user_info["prn"],
            )
            db.add(user)
            db.commit()
        print(f"✓ Created {len(SAMPLE_USERS)} regular users")

        # 5. Create Sample Complaints
        base_date = datetime.utcnow()
        dept_list = list(dept_map.values())
        for _ in range(20):
            template = random.choice(COMPLAINT_TEMPLATES)
            complaint = ComplaintORM(
                user_id         = random.choice(SAMPLE_USERS)["user_id"],
                text            = template["text"],
                category        = template["category"],
                priority        = random.choice(PRIORITIES),
                status          = random.choice(STATUSES),
                location        = template["location"],
                dept_id         = random.choice(dept_list),
                submitted_at    = (base_date - timedelta(days=random.randint(0, 30))).date(),
                sentiment       = random.randint(30, 70),
                is_emergency    = random.random() < 0.2,
                demoted_by_admin= False,
                cluster_id      = None,
                root_cause      = "Pattern-based analysis",
            )
            db.add(complaint)
            db.commit()

        print("✓ Created 20 sample complaints")

        print("\n" + "=" * 60)
        print("✓ Database seeding completed successfully!")
        print("=" * 60)
        print("\nLogin Credentials:")
        print(f"  Super Admin:            {SUPER_ADMIN['email']} / {SUPER_ADMIN['password']}")
        print(f"  Dept Head (Maintenance): {DEPARTMENT_HEADS[0]['email']} / defaultpass123")
        print(f"  Student:                {SAMPLE_USERS[0]['email']} / userpass123")
        print("\n✓ Now test the Analytics dashboard!")

    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
