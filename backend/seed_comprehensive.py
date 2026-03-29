"""
seed_comprehensive.py - FIXED VERSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Comprehensive database seeding with proper dept head setup.

Creates:
  - 1 Super Admin (org-wide access)
  - 5 Departments
  - 5 Department Heads (with login credentials)
  - 10 Regular Users
  - 20 Sample Complaints

DEPT HEADS CAN LOGIN AND:
  ✓ See all complaints in their department
  ✓ Mark complaints as Resolved (status change)
  ✓ View department-scoped analytics
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

# ── Configuration ─────────────────────────────────────────────────────────────

SUPER_ADMIN = {
    "user_id":   "admin-001",
    "full_name": "System Administrator",
    "email":     "admin@gst.sies.edu.in",
    "password":  "admin123",
}

DEPARTMENTS = [
    {"name": "Maintenance",  "location": "Building A"},
    {"name": "Cafeteria",    "location": "Dining Hall"},
    {"name": "IT Support",   "location": "Computer Lab"},
    {"name": "Housekeeping", "location": "Campus Wide"},
    {"name": "Security",     "location": "Main Gate"},
]

# Department heads - One per department
DEPARTMENT_HEADS = [
    {
        "user_id":   "head-maintenance-001",
        "full_name": "Mr. Sharma",
        "email":     "maintenance_head@gst.sies.edu.in",
        "password":  "maintenance123",
        "dept":      "Maintenance",
    },
    {
        "user_id":   "head-cafeteria-001",
        "full_name": "Ms. Patel",
        "email":     "cafeteria_head@gst.sies.edu.in",
        "password":  "cafeteria123",
        "dept":      "Cafeteria",
    },
    {
        "user_id":   "head-it-001",
        "full_name": "Dr. Gupta",
        "email":     "it_head@gst.sies.edu.in",
        "password":  "itsupport123",
        "dept":      "IT Support",
    },
    {
        "user_id":   "head-housekeeping-001",
        "full_name": "Mr. Kumar",
        "email":     "housekeeping_head@gst.sies.edu.in",
        "password":  "housekeeping123",
        "dept":      "Housekeeping",
    },
    {
        "user_id":   "head-security-001",
        "full_name": "Mr. Singh",
        "email":     "security_head@gst.sies.edu.in",
        "password":  "security123",
        "dept":      "Security",
    },
]

# Regular students
SAMPLE_USERS = [
    {
        "user_id":   f"student-{i:03d}",
        "full_name": f"Student {i}",
        "email":     f"student{i:03d}@gst.sies.edu.in",
        "password":  "student123",
        "prn":       f"124A{1000 + i}",
    }
    for i in range(1, 11)
]

COMPLAINT_TEMPLATES = [
    {"text": "AC is not working in classroom",   "category": "HVAC/Climate",       "location": "Building A"},
    {"text": "Water tap is leaking in bathroom", "category": "Water/Plumbing",     "location": "Building B"},
    {"text": "WiFi down in computer lab",        "category": "Internet/WiFi",      "location": "Computer Lab"},
    {"text": "Food quality is poor",             "category": "Food Quality",       "location": "Cafeteria"},
    {"text": "Lights not working",               "category": "Electricity/Power",  "location": "Building C"},
    {"text": "Campus is dirty",                  "category": "Cleanliness",        "location": "Campus Wide"},
    {"text": "Door lock broken",                 "category": "Maintenance",        "location": "Hostel"},
    {"text": "Furniture damaged in library",     "category": "Furniture",          "location": "Library"},
    {"text": "Noise from construction",          "category": "Noise",              "location": "Building A"},
    {"text": "Security gate issue",              "category": "Security",           "location": "Main Gate"},
]

STATUSES   = ["Open", "In Progress", "Resolved"]
PRIORITIES = ["Low", "Medium", "High", "Critical"]

# ── Main Seeding Function ───────────────────────────────────────────────────────

def seed_database():
    """Main seeding function."""
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data
        print("\n🔄 Clearing existing data...")
        db.query(ComplaintORM).delete()
        db.query(DepartmentAdminORM).delete()
        db.query(DepartmentORM).delete()
        db.query(UserORM).delete()
        db.commit()
        print("✓ Cleared all tables")

        # 1. Create Super Admin
        print("\n👑 Creating Super Admin...")
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
        print(f"✓ Super Admin created:")
        print(f"  Email: {SUPER_ADMIN['email']}")
        print(f"  Password: {SUPER_ADMIN['password']}")

        # 2. Create Departments
        print("\n🏢 Creating Departments...")
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
            print(f"  ✓ {dept_info['name']} (ID: {dept.id}) - {dept_info['location']}")

        # 3. Create Department Heads (WITH LOGIN CREDENTIALS)
        print("\n👔 Creating Department Heads...")
        for head_info in DEPARTMENT_HEADS:
            # Create user
            head_user = UserORM(
                user_id       = head_info["user_id"],
                full_name     = head_info["full_name"],
                email         = head_info["email"],
                password_hash = hash_password(head_info["password"]),
                role          = "department_head",
                is_super_admin= False,
                is_active     = True,
                dept_id       = dept_map[head_info["dept"]],
            )
            db.add(head_user)
            db.commit()

            # Link to department_admins table using the string user_id directly
            admin_link = DepartmentAdminORM(
                user_id = head_info["user_id"],
                dept_id = dept_map[head_info["dept"]],
            )
            db.add(admin_link)
            db.commit()

            print(f"  ✓ {head_info['full_name']} → {head_info['dept']}")
            print(f"    Email: {head_info['email']}")
            print(f"    Password: {head_info['password']}")

        # 4. Create Regular Users
        print("\n👨‍🎓 Creating Regular Users...")
        for user_info in SAMPLE_USERS:
            user = UserORM(
                user_id       = user_info["user_id"],
                full_name     = user_info["full_name"],
                email         = user_info["email"],
                password_hash = hash_password(user_info["password"]),
                role          = "user",
                is_super_admin= False,
                is_active     = True,
                prn           = user_info["prn"],
            )
            db.add(user)
            db.commit()
        print(f"✓ Created {len(SAMPLE_USERS)} regular users")

        # 5. Create Sample Complaints
        print("\n📝 Creating Sample Complaints...")
        base_date = datetime.utcnow()
        dept_list = list(dept_map.values())
        user_list = [u["user_id"] for u in SAMPLE_USERS]

        for i in range(20):
            template = random.choice(COMPLAINT_TEMPLATES)
            complaint = ComplaintORM(
                user_id         = random.choice(user_list),
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

        # Print summary
        print("\n" + "=" * 70)
        print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 70)

        print("\n📊 SUMMARY:")
        print(f"  Departments:       {len(DEPARTMENTS)}")
        print(f"  Department Heads:  {len(DEPARTMENT_HEADS)}")
        print(f"  Regular Users:     {len(SAMPLE_USERS)}")
        print(f"  Sample Complaints: 20")

        print("\n🔐 LOGIN CREDENTIALS:")
        print(f"\n  SUPER ADMIN (org-wide access):")
        print(f"    Email:    {SUPER_ADMIN['email']}")
        print(f"    Password: {SUPER_ADMIN['password']}")

        print(f"\n  DEPARTMENT HEADS (dept-scoped access):")
        for head in DEPARTMENT_HEADS:
            print(f"    {head['full_name']} ({head['dept']}):")
            print(f"      Email:    {head['email']}")
            print(f"      Password: {head['password']}")

        print(f"\n  REGULAR USERS:")
        print(f"    Email:    student001@gst.sies.edu.in ... student010@gst.sies.edu.in")
        print(f"    Password: student123")

        print("\n✨ PERMISSIONS:")
        print("  Super Admin: Can view all data, analytics, manage all departments")
        print("  Dept Head:   Can view & mark RESOLVED only their department's complaints")
        print("  Regular User: Can submit complaints, view own complaints")

        print("\n" + "=" * 70)

    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
