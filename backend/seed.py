"""
seed.py
────────
Seeds the database with:
  - 1 admin account
  - 20 student accounts (various branches/years)
  - 160 realistic SIES GST complaints
  - 10 emergency complaints

Run: python seed.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from db.database import engine, SessionLocal, Base
from models.complaint import ComplaintORM
from models.user import UserORM
from models.department import DepartmentORM, DepartmentAdminORM
from models.location import LocationORM
from models.branch import BranchORM, AcademicBranchDeptORM
from services.nlp import score_urgency
from services.decision_engine import classify
from services.complaint_service import _recluster
from services.auth_service import hash_password
from services.location_utils import get_dept_name_for_location
from datetime import date, datetime, timedelta
import random

Base.metadata.create_all(bind=engine)

# ── Campus locations ──────────────────────────────────────────────────────────
LOCATIONS = [
    "Ground Floor - Admin Office",
    "Ground Floor - Seminar Hall",
    "Ground Floor - Sports Room",
    "Ground Floor - Principal's Office",
    "Ground Floor - Washroom",
    "First Floor - Classroom 101",
    "First Floor - Classroom 102",
    "First Floor - Classroom 103",
    "First Floor - Classroom 104",
    "First Floor - Classroom 111",
    "First Floor - Lab",
    "First Floor - NSS Room",
    "First Floor - Staff Room",
    "First Floor - Washroom",
    "Second Floor - Classroom 201",
    "Second Floor - Classroom 202",
    "Second Floor - Classroom 203",
    "Second Floor - Classroom 204",
    "Second Floor - Classroom 211",
    "Second Floor - Lab",
    "Second Floor - Library",
    "Second Floor - Staff Room",
    "Second Floor - Washroom",
    "Third Floor - Classroom 301",
    "Third Floor - Classroom 302",
    "Third Floor - Classroom 303",
    "Third Floor - Classroom 304",
    "Third Floor - Classroom 311",
    "Third Floor - Lab",
    "Third Floor - Staff Room",
    "Third Floor - Washroom",
    "Fourth Floor - CR1",
    "Fourth Floor - CR2",
    "Fourth Floor - CR3",
    "Fourth Floor - CR4",
    "Fourth Floor - CR5",
    "Fourth Floor - CR6",
    "Fourth Floor - Lab 1",
    "Fourth Floor - Lab 2",
    "Fourth Floor - Lab 3",
    "Fourth Floor - Lab 4",
    "Fourth Floor - Lab 5",
    "Fourth Floor - Lab 6",
    "Fourth Floor - Lab 7",
    "Fourth Floor - Lab 8",
    "Fourth Floor - Staff Room",
    "Fourth Floor - Washroom",
    "Canteen",
    "Auditorium Floor - GST Auditorium",
    "Auditorium Floor - Mechanical Workshop 1",
    "Auditorium Floor - Mechanical Workshop 2",
    "Common - Staircase",
    "Common - Corridor",
    "Common - Entrance Gate",
    "Common - Parking Area",
]

# ── Student accounts ──────────────────────────────────────────────────────────
STUDENTS = [
    ("Aarav Mehta",        "124A1001", "aaravmaids124@gst.sies.edu.in",    "AIDS",       "Second Year"),
    ("Priya Sharma",       "124A1002", "priyasaids124@gst.sies.edu.in",    "AIDS",       "Second Year"),
    ("Rohan Verma",        "124M1003", "rohanvaiml124@gst.sies.edu.in",    "AIML",       "Second Year"),
    ("Sneha Patil",        "124M1004", "snehapaim124@gst.sies.edu.in",     "AIML",       "Second Year"),
    ("Karan Desai",        "124C1005", "karandcs124@gst.sies.edu.in",      "CSE",        "Second Year"),
    ("Ananya Joshi",       "124C1006", "ananyajcs124@gst.sies.edu.in",     "CSE",        "Second Year"),
    ("Vikram Nair",        "124T1007", "vikramnitit124@gst.sies.edu.in",   "IT",         "Second Year"),
    ("Ishita Gupta",       "124T1008", "ishitagit124@gst.sies.edu.in",     "IT",         "Second Year"),
    ("Dev Kulkarni",       "124I1009", "devkiot124@gst.sies.edu.in",       "IoT",        "Second Year"),
    ("Meera Iyer",         "124I1010", "meeraiiot124@gst.sies.edu.in",     "IoT",        "Second Year"),
    ("Arjun Bhat",         "123A2001", "arjunbaids123@gst.sies.edu.in",    "AIDS",       "Third Year"),
    ("Tanvi Rao",          "123A2002", "tanviraids123@gst.sies.edu.in",    "AIDS",       "Third Year"),
    ("Nikhil Sawant",      "123C2003", "nikhilscs123@gst.sies.edu.in",     "CSE",        "Third Year"),
    ("Pooja Bhosale",      "123C2004", "poojabcs123@gst.sies.edu.in",      "CSE",        "Third Year"),
    ("Siddharth More",     "123T2005", "siddharthmit123@gst.sies.edu.in",  "IT",         "Third Year"),
    ("Kavya Pillai",       "123T2006", "kavyapit123@gst.sies.edu.in",      "IT",         "Third Year"),
    ("Rahul Tiwari",       "123I2007", "rahultiot123@gst.sies.edu.in",     "IoT",        "Third Year"),
    ("Divya Naik",         "123I2008", "divyaniot123@gst.sies.edu.in",     "IoT",        "Third Year"),
    ("Aditya Shetty",      "122C3001", "adityascs122@gst.sies.edu.in",     "CSE",        "Fourth Year"),
    ("Shruti Kadam",       "122M3002", "shrutikaiml122@gst.sies.edu.in",   "AIML",       "Fourth Year"),
]

# ── Complaint templates ───────────────────────────────────────────────────────
COMPLAINTS = [
    # Water & Sanitation (20)
    ("Water & Sanitation", "The water cooler on the fourth floor near CR3 is not working since Monday. AIDS and AIML students have no drinking water during labs.", "Fourth Floor - CR3", False, "Open",         "2026-01-05"),
    ("Water & Sanitation", "The tap in the washroom on the second floor is leaking continuously. Water is being wasted and the floor is always wet.", "Second Floor - Washroom", False, "In Progress", "2026-01-07"),
    ("Water & Sanitation", "Water cooler on the first floor near classroom 101 has been out of order for over a week. CSE students are suffering.", "First Floor - Classroom 101", False, "Open",    "2026-01-08"),
    ("Water & Sanitation", "The washroom on the third floor has no running water. This is very unhygienic for students and staff.", "Third Floor - Washroom", False, "Open",                          "2026-01-10"),
    ("Water & Sanitation", "Water supply to the canteen has been disrupted since yesterday. Food preparation is being affected.", "Canteen", False, "In Progress",                                    "2026-01-12"),
    ("Water & Sanitation", "The water cooler near the fourth floor staff room is dispensing warm water. It has not been serviced.", "Fourth Floor - Staff Room", False, "Resolved",                  "2026-01-14"),
    ("Water & Sanitation", "Washroom tap on the ground floor near the admin office is broken and water is overflowing.", "Ground Floor - Admin Office", False, "Open",                               "2026-01-16"),
    ("Water & Sanitation", "The water cooler on the second floor near the library is not working. Students studying in the library have no water access.", "Second Floor - Library", False, "Open",   "2026-01-18"),
    ("Water & Sanitation", "Water pressure on the third floor is very low. Takes 10 minutes to fill a bottle from the cooler.", "Third Floor - Classroom 301", False, "In Progress",                 "2026-01-20"),
    ("Water & Sanitation", "The drinking water cooler outside Lab 5 on the fourth floor has been broken for 2 weeks now.", "Fourth Floor - Lab 5", False, "Open",                                    "2026-01-22"),
    ("Water & Sanitation", "Water cooler on the first floor near NSS Room is leaking from the bottom. Water is collecting on the floor creating a slip hazard.", "First Floor - NSS Room", False, "Open", "2026-01-25"),
    ("Water & Sanitation", "Both washroom taps on the fourth floor are not working. Students are going to the third floor washroom wasting time.", "Fourth Floor - Washroom", False, "Open",          "2026-01-28"),
    ("Water & Sanitation", "The water cooler near the seminar hall on the ground floor has not been cleaned for months. The water tastes bad.", "Ground Floor - Seminar Hall", False, "Resolved",    "2026-02-01"),
    ("Water & Sanitation", "Washroom on the first floor near classroom 111 has a broken flush. Very unhygienic situation.", "First Floor - Washroom", False, "Open",                                 "2026-02-04"),
    ("Water & Sanitation", "Water cooler outside Lab 2 on the fourth floor is showing an error light and not dispensing water.", "Fourth Floor - Lab 2", False, "In Progress",                      "2026-02-06"),
    ("Water & Sanitation", "The water cooler near CR6 on the fourth floor has been making a loud noise and dispensing very little water.", "Fourth Floor - CR6", False, "Open",                     "2026-02-09"),
    ("Water & Sanitation", "Pipe under the sink in the second floor washroom is leaking. Water has damaged the floor tiles.", "Second Floor - Washroom", False, "Open",                             "2026-02-12"),
    ("Water & Sanitation", "Water cooler on the third floor near Lab area is not working. IoT students have no water source on that floor.", "Third Floor - Lab", False, "Resolved",                "2026-02-15"),
    ("Water & Sanitation", "The washroom near the auditorium floor is always dirty and taps do not have proper water flow.", "Auditorium Floor - GST Auditorium", False, "Open",                    "2026-02-18"),
    ("Water & Sanitation", "Water cooler on the ground floor near principal office is not working. Visitors and admin staff have no water.", "Ground Floor - Principal's Office", False, "Open",    "2026-02-20"),

    # Electrical & Power (25)
    ("Electrical & Power", "The AC in Lab 3 on the fourth floor is not working. The room temperature is unbearable during practicals, especially for AIDS students.", "Fourth Floor - Lab 3", False, "Open",          "2026-01-06"),
    ("Electrical & Power", "Power cut in classroom 202 on the second floor since yesterday afternoon. Lectures cannot be conducted.", "Second Floor - Classroom 202", False, "In Progress",                         "2026-01-09"),
    ("Electrical & Power", "The fan in classroom 301 on the third floor is making a loud noise and vibrating. It may fall soon.", "Third Floor - Classroom 301", False, "Open",                                     "2026-01-11"),
    ("Electrical & Power", "Three power sockets in Lab 6 on the fourth floor are not working. Students cannot charge laptops during practicals.", "Fourth Floor - Lab 6", False, "Open",                           "2026-01-13"),
    ("Electrical & Power", "AC in classroom CR2 on the fourth floor stopped working last week. The room gets very hot in the afternoon.", "Fourth Floor - CR2", False, "In Progress",                              "2026-01-15"),
    ("Electrical & Power", "Frequent power cuts in classroom 104 on the first floor. CSE students are losing unsaved work on lab computers.", "First Floor - Classroom 104", False, "Resolved",                    "2026-01-17"),
    ("Electrical & Power", "The fan in the second floor library area has stopped working. It becomes very hot and students cannot concentrate.", "Second Floor - Library", False, "Open",                           "2026-01-19"),
    ("Electrical & Power", "All power sockets in Lab 4 on the fourth floor are dead. AIML practical sessions are completely disrupted.", "Fourth Floor - Lab 4", False, "Open",                                    "2026-01-21"),
    ("Electrical & Power", "AC unit in CR5 on the fourth floor is leaking water onto students sitting below it. Very dangerous.", "Fourth Floor - CR5", False, "In Progress",                                      "2026-01-24"),
    ("Electrical & Power", "Power supply to the third floor staff room is fluctuating. Computers and printers are getting damaged.", "Third Floor - Staff Room", False, "Open",                                    "2026-01-26"),
    ("Electrical & Power", "The electric switchboard near Lab 7 on the fourth floor has exposed wiring. This is a safety hazard.", "Fourth Floor - Lab 7", False, "Open",                                         "2026-01-29"),
    ("Electrical & Power", "No power in Mechanical Workshop 1 since this morning. Workshop sessions have been cancelled.", "Auditorium Floor - Mechanical Workshop 1", False, "In Progress",                      "2026-02-02"),
    ("Electrical & Power", "Fan in classroom 203 on the second floor fell from the ceiling during a lecture. Fortunately no one was hurt.", "Second Floor - Classroom 203", False, "Resolved",                    "2026-02-05"),
    ("Electrical & Power", "AC in the seminar hall on the ground floor is not working. All seminar sessions are being affected.", "Ground Floor - Seminar Hall", False, "Open",                                    "2026-02-07"),
    ("Electrical & Power", "Power outlet near the board in classroom 102 first floor is sparking when a plug is inserted.", "First Floor - Classroom 102", False, "Open",                                         "2026-02-10"),
    ("Electrical & Power", "The lights in Lab 8 on the fourth floor keep tripping every 30 minutes. Cannot run any practicals.", "Fourth Floor - Lab 8", False, "Open",                                          "2026-02-13"),
    ("Electrical & Power", "Fan in NSS room on the first floor is broken. The room is stuffy and unusable.", "First Floor - NSS Room", False, "Resolved",                                                        "2026-02-16"),
    ("Electrical & Power", "Power cuts in the canteen during lunch hours every day this week. The food counter equipment is affected.", "Canteen", False, "Open",                                                  "2026-02-19"),
    ("Electrical & Power", "The inverter backup in Lab 1 on the fourth floor is not working during power cuts. Students lose all work.", "Fourth Floor - Lab 1", False, "Open",                                   "2026-02-21"),
    ("Electrical & Power", "Wiring in the corridor between CR4 and CR5 on fourth floor is visible and hanging. Safety concern for students.", "Fourth Floor - CR4", False, "In Progress",                        "2026-02-23"),
    ("Electrical & Power", "AC in classroom 311 on the third floor has a foul burning smell. It has not been serviced all year.", "Third Floor - Classroom 311", False, "Open",                                   "2026-02-25"),
    ("Electrical & Power", "Power supply issue in Mechanical Workshop 2. Machines are not starting and practical exams are next week.", "Auditorium Floor - Mechanical Workshop 2", False, "Open",               "2026-02-27"),
    ("Electrical & Power", "The ceiling fan in classroom 204 on second floor is wobbling dangerously. Students afraid to sit under it.", "Second Floor - Classroom 204", False, "Open",                          "2026-03-01"),
    ("Electrical & Power", "All ACs on the fourth floor CR classrooms stopped working simultaneously since yesterday morning.", "Fourth Floor - CR1", False, "In Progress",                                      "2026-03-03"),
    ("Electrical & Power", "Socket in Lab 2 on fourth floor caught fire briefly yesterday. It has been taped over but not properly fixed.", "Fourth Floor - Lab 2", False, "Open",                               "2026-03-05"),

    # IT & Network (22)
    ("IT & Network", "WiFi is not working on the entire fourth floor since Monday morning. AIDS and AIML students cannot access cloud tools during practicals.", "Fourth Floor - CR1", False, "Open",           "2026-01-06"),
    ("IT & Network", "The projector in classroom CR3 on the fourth floor is not displaying properly. Screen shows lines and distorted images.", "Fourth Floor - CR3", False, "In Progress",                    "2026-01-08"),
    ("IT & Network", "5 computers in Lab 1 on the fourth floor are not turning on. Practical exam for AIDS is scheduled tomorrow.", "Fourth Floor - Lab 1", False, "Open",                                     "2026-01-10"),
    ("IT & Network", "Internet speed on the second floor is extremely slow. IT students cannot download lab files or access online resources.", "Second Floor - Lab", False, "Open",                            "2026-01-12"),
    ("IT & Network", "The smart board in classroom 301 on the third floor is not responding to touch. Lectures are being disrupted.", "Third Floor - Classroom 301", False, "Resolved",                       "2026-01-14"),
    ("IT & Network", "Network connection in Lab 5 on the fourth floor drops every 10 minutes. Cannot complete any cloud-based practicals.", "Fourth Floor - Lab 5", False, "Open",                             "2026-01-16"),
    ("IT & Network", "Projector in classroom 201 second floor is not working. IT department lectures are affected.", "Second Floor - Classroom 201", False, "In Progress",                                     "2026-01-18"),
    ("IT & Network", "WiFi in the library on the second floor has not been working for 3 days. Students cannot research for assignments.", "Second Floor - Library", False, "Open",                            "2026-01-20"),
    ("IT & Network", "Keyboard and mouse of 8 computers in Lab 3 on fourth floor are broken. Practicals cannot be conducted.", "Fourth Floor - Lab 3", False, "Open",                                         "2026-01-23"),
    ("IT & Network", "The LAN connection in Classroom 104 on the first floor is not working. CSE networking lab sessions cancelled.", "First Floor - Classroom 104", False, "Resolved",                       "2026-01-25"),
    ("IT & Network", "The campus server went down during our practical exam in Lab 6 fourth floor. We lost all our work.", "Fourth Floor - Lab 6", False, "Open",                                              "2026-01-27"),
    ("IT & Network", "Projector in CR5 on the fourth floor has been broken for 2 weeks. Faculty are using laptops without projection.", "Fourth Floor - CR5", False, "Open",                                   "2026-01-30"),
    ("IT & Network", "WiFi router on the third floor needs replacement. Connection drops regularly affecting IoT practical assignments.", "Third Floor - Lab", False, "Open",                                  "2026-02-03"),
    ("IT & Network", "Computer systems in Lab 4 on fourth floor are running very slowly. Even opening files takes 5 minutes.", "Fourth Floor - Lab 4", False, "In Progress",                                   "2026-02-06"),
    ("IT & Network", "The printer in the second floor staff room is not working. Faculty cannot print question papers.", "Second Floor - Staff Room", False, "Resolved",                                       "2026-02-08"),
    ("IT & Network", "Network is completely down in Mechanical Workshop 1. CAD software cannot be accessed.", "Auditorium Floor - Mechanical Workshop 1", False, "Open",                                       "2026-02-11"),
    ("IT & Network", "Smart board in CR2 on fourth floor is stuck and cannot be turned off or reset. Faculty cannot use the board.", "Fourth Floor - CR2", False, "Open",                                      "2026-02-14"),
    ("IT & Network", "Projector bulb in classroom 102 on first floor has burned out. Replacement has been pending for 3 weeks.", "First Floor - Classroom 102", False, "Open",                                 "2026-02-17"),
    ("IT & Network", "All systems in Lab 7 on the fourth floor have outdated antivirus and are getting virus warnings. Cannot run programs.", "Fourth Floor - Lab 7", False, "Open",                           "2026-02-20"),
    ("IT & Network", "WiFi access points on the ground floor seminar hall area do not cover the full hall. Signal drops at the back rows.", "Ground Floor - Seminar Hall", False, "In Progress",               "2026-02-22"),
    ("IT & Network", "The biometric attendance system on the fourth floor is not working. Faculty are manually taking attendance.", "Fourth Floor - Staff Room", False, "Resolved",                           "2026-02-25"),
    ("IT & Network", "Internet connectivity in Lab 8 on fourth floor goes down every afternoon. This is affecting AIDS project submissions.", "Fourth Floor - Lab 8", False, "Open",                          "2026-03-02"),

    # Infrastructure & Furniture (20)
    ("Infrastructure & Furniture", "Two chairs in classroom CR4 on the fourth floor are broken. Students are sitting on damaged chairs during 3-hour lectures.", "Fourth Floor - CR4", False, "Open",           "2026-01-07"),
    ("Infrastructure & Furniture", "The door of Lab 5 on the fourth floor does not close properly. It creates a disturbance during ongoing practicals.", "Fourth Floor - Lab 5", False, "In Progress",         "2026-01-09"),
    ("Infrastructure & Furniture", "Ceiling in classroom 211 on the second floor is leaking when it rains. Water is dripping onto students' desks.", "Second Floor - Classroom 211", False, "Open",            "2026-01-11"),
    ("Infrastructure & Furniture", "Multiple tiles on the staircase between the second and third floor are cracked. Very dangerous for students.", "Common - Staircase", False, "Open",                        "2026-01-13"),
    ("Infrastructure & Furniture", "The whiteboard in CR1 on the fourth floor is completely worn out. Writing is not visible from the back rows.", "Fourth Floor - CR1", False, "Resolved",                   "2026-01-15"),
    ("Infrastructure & Furniture", "Benches in the seminar hall on the ground floor are broken. An event is scheduled this Friday.", "Ground Floor - Seminar Hall", False, "In Progress",                     "2026-01-17"),
    ("Infrastructure & Furniture", "The window in classroom 303 on the third floor does not close. Rain and wind enter the classroom.", "Third Floor - Classroom 303", False, "Open",                         "2026-01-19"),
    ("Infrastructure & Furniture", "Desks in classroom 103 on the first floor are very old and shaky. Students cannot write comfortably.", "First Floor - Classroom 103", False, "Open",                      "2026-01-21"),
    ("Infrastructure & Furniture", "The railing on the fourth floor corridor is loose. Very dangerous considering there is no lift in the building.", "Fourth Floor - CR6", False, "Open",                    "2026-01-24"),
    ("Infrastructure & Furniture", "Door handle of Lab 2 on the fourth floor broke off completely. Students are stuck inside after hours.", "Fourth Floor - Lab 2", False, "Resolved",                       "2026-01-26"),
    ("Infrastructure & Furniture", "Flooring near the canteen entrance is broken and uneven. Several students have tripped and fallen.", "Canteen", False, "Open",                                             "2026-01-29"),
    ("Infrastructure & Furniture", "The staff room door on the second floor is jammed. Faculty are having trouble entering and exiting.", "Second Floor - Staff Room", False, "In Progress",                  "2026-02-02"),
    ("Infrastructure & Furniture", "Wall plaster in classroom CR3 on the fourth floor is falling off. Pieces fall on students during class.", "Fourth Floor - CR3", False, "Open",                           "2026-02-04"),
    ("Infrastructure & Furniture", "The podium in the GST Auditorium is broken. An event is planned next week and it cannot be used.", "Auditorium Floor - GST Auditorium", False, "Open",                   "2026-02-07"),
    ("Infrastructure & Furniture", "Parking area flooring has large potholes. Two-wheelers are getting damaged while entering campus.", "Common - Parking Area", False, "Open",                               "2026-02-09"),
    ("Infrastructure & Furniture", "The entrance gate to the college has a broken latch. Gate swings open in strong wind creating security issues.", "Common - Entrance Gate", False, "In Progress",          "2026-02-12"),
    ("Infrastructure & Furniture", "Chairs in Lab 8 on the fourth floor are too short for the computer tables. Very uncomfortable for students.", "Fourth Floor - Lab 8", False, "Resolved",                 "2026-02-15"),
    ("Infrastructure & Furniture", "The steps leading to the auditorium floor are very steep with no handrail. Students have slipped multiple times.", "Auditorium Floor - GST Auditorium", False, "Open",   "2026-02-18"),
    ("Infrastructure & Furniture", "Window glass in classroom 104 first floor is cracked. Safety hazard especially during windy days.", "First Floor - Classroom 104", False, "Open",                        "2026-02-21"),
    ("Infrastructure & Furniture", "Multiple tube light covers in the corridor on the third floor have fallen. Sharp plastic on the floor.", "Third Floor - Corridor", False, "Open",                         "2026-02-24"),

    # Cleanliness & Hygiene (18)
    ("Cleanliness & Hygiene", "Garbage near the canteen has not been collected for 3 days. Foul smell is spreading to nearby classrooms and the corridor.", "Canteen", False, "Open",                          "2026-01-08"),
    ("Cleanliness & Hygiene", "Washroom on the fourth floor is extremely dirty and unhygienic. It has not been cleaned today.", "Fourth Floor - Washroom", False, "In Progress",                               "2026-01-10"),
    ("Cleanliness & Hygiene", "There is a rat sighting near the canteen food storage area. This is a health hazard.", "Canteen", False, "Open",                                                                "2026-01-13"),
    ("Cleanliness & Hygiene", "The area near Mechanical Workshop 1 has accumulated a lot of scrap and debris. Needs urgent cleaning.", "Auditorium Floor - Mechanical Workshop 1", False, "Open",             "2026-01-16"),
    ("Cleanliness & Hygiene", "Washroom on the first floor near classroom 111 has a blocked drain. Water is overflowing on the floor.", "First Floor - Washroom", False, "In Progress",                       "2026-01-19"),
    ("Cleanliness & Hygiene", "Corridors on the second floor are not being swept in the morning. Dirt and footprints everywhere.", "Second Floor - Classroom 211", False, "Resolved",                         "2026-01-22"),
    ("Cleanliness & Hygiene", "The canteen tables and floors are not cleaned after lunch. Leftover food is left for hours attracting insects.", "Canteen", False, "Open",                                      "2026-01-25"),
    ("Cleanliness & Hygiene", "Dustbins on the fourth floor are overflowing and have not been emptied for 2 days.", "Fourth Floor - CR2", False, "Open",                                                      "2026-01-28"),
    ("Cleanliness & Hygiene", "Strong foul smell from the washroom on the third floor is spreading to classroom 304. Difficult to sit in class.", "Third Floor - Classroom 304", False, "Open",               "2026-02-01"),
    ("Cleanliness & Hygiene", "Cockroaches spotted in the canteen kitchen area on multiple occasions this week.", "Canteen", False, "In Progress",                                                             "2026-02-04"),
    ("Cleanliness & Hygiene", "The staircase between third and fourth floor has garbage accumulated in the corners. Cleaning staff are not covering this area.", "Common - Staircase", False, "Open",         "2026-02-07"),
    ("Cleanliness & Hygiene", "Washroom on the second floor near the library is not being cleaned regularly. Very unhygienic for students.", "Second Floor - Washroom", False, "Resolved",                   "2026-02-10"),
    ("Cleanliness & Hygiene", "The sports room on the ground floor has a musty smell and is visibly dusty. Equipment has not been cleaned.", "Ground Floor - Sports Room", False, "Open",                     "2026-02-13"),
    ("Cleanliness & Hygiene", "Garbage bin near the entrance gate is always overflowing. Garbage is falling on the pathway.", "Common - Entrance Gate", False, "Open",                                        "2026-02-16"),
    ("Cleanliness & Hygiene", "Lab 6 on the fourth floor has not been cleaned properly after yesterday's practical. Equipment and tables are dirty.", "Fourth Floor - Lab 6", False, "In Progress",           "2026-02-19"),
    ("Cleanliness & Hygiene", "Dead pigeons found on the roof access staircase. Health hazard for students who use that area.", "Common - Staircase", False, "Open",                                          "2026-02-22"),
    ("Cleanliness & Hygiene", "Canteen food quality has degraded. Students found insects in food twice this week.", "Canteen", False, "Open",                                                                  "2026-02-25"),
    ("Cleanliness & Hygiene", "The area outside the NSS room on the first floor is used for dumping old furniture. Creates a mess and blocks the corridor.", "First Floor - NSS Room", False, "Open",         "2026-02-28"),

    # Lighting (15)
    ("Lighting", "The tube light in the corridor between CR4 and CR5 on the fourth floor has been fused for 5 days. Very dark at night.", "Fourth Floor - CR4", False, "Open",                               "2026-01-09"),
    ("Lighting", "Lights in Lab 7 on the fourth floor are flickering constantly during practicals. Causing headaches and eye strain.", "Fourth Floor - Lab 7", False, "In Progress",                         "2026-01-12"),
    ("Lighting", "The staircase between the second and third floor is very dark. There is no working light. Dangerous after 6 PM.", "Common - Staircase", False, "Open",                                     "2026-01-15"),
    ("Lighting", "Classroom 302 on the third floor has 3 out of 4 tube lights not working. Faculty cannot write on the board clearly.", "Third Floor - Classroom 302", False, "Resolved",                   "2026-01-18"),
    ("Lighting", "The parking area has no working lights. Students who stay late for exams find it completely dark outside.", "Common - Parking Area", False, "Open",                                         "2026-01-21"),
    ("Lighting", "Light in the washroom on the fourth floor has been not working for 3 days. Students cannot use it after evening.", "Fourth Floor - Washroom", False, "Open",                               "2026-01-24"),
    ("Lighting", "The entrance to the GST Auditorium floor is very poorly lit. The steps are not visible leading to trips.", "Auditorium Floor - GST Auditorium", False, "In Progress",                     "2026-01-27"),
    ("Lighting", "Classroom 201 on the second floor has no working lights. IT students are sitting in dim conditions.", "Second Floor - Classroom 201", False, "Open",                                       "2026-01-30"),
    ("Lighting", "Emergency exit lights on the third floor corridor are not working. This is a safety compliance issue.", "Third Floor - Corridor", False, "Open",                                           "2026-02-03"),
    ("Lighting", "Lights in the library on the second floor are too dim. Students are straining their eyes while reading.", "Second Floor - Library", False, "Resolved",                                     "2026-02-06"),
    ("Lighting", "The external lights near the entrance gate are not working. Campus is very dark after 7 PM.", "Common - Entrance Gate", False, "Open",                                                     "2026-02-09"),
    ("Lighting", "CR6 on the fourth floor has tube lights that flicker every few minutes. Distracting during lectures.", "Fourth Floor - CR6", False, "Open",                                                "2026-02-12"),
    ("Lighting", "Corridor on the first floor near classroom 111 has 2 lights fused. Dark during evening practical sessions.", "First Floor - Classroom 111", False, "In Progress",                         "2026-02-15"),
    ("Lighting", "Light in the sports room on the ground floor has been fused for over a month. Room cannot be used in evenings.", "Ground Floor - Sports Room", False, "Open",                              "2026-02-18"),
    ("Lighting", "The Mechanical Workshop 2 has inadequate lighting. Students are finding it difficult to work on machine assignments.", "Auditorium Floor - Mechanical Workshop 2", False, "Open",          "2026-02-21"),

    # Drainage & Plumbing (12)
    ("Drainage & Plumbing", "The drain near the canteen is blocked causing water to stagnate near the entrance. Very unhygienic and slippery.", "Canteen", False, "Open",                                      "2026-01-10"),
    ("Drainage & Plumbing", "Water is leaking from the ceiling of the first floor corridor near classroom 102. There is a pipe above that is broken.", "First Floor - Classroom 102", False, "In Progress",  "2026-01-13"),
    ("Drainage & Plumbing", "Drain in the washroom on the second floor is blocked. Water does not drain and the floor is always flooded.", "Second Floor - Washroom", False, "Open",                          "2026-01-16"),
    ("Drainage & Plumbing", "Pipe burst near Mechanical Workshop 1. Water is flowing into the workshop and damaging equipment.", "Auditorium Floor - Mechanical Workshop 1", False, "In Progress",            "2026-01-19"),
    ("Drainage & Plumbing", "There is water leakage from the slab between the third and fourth floor. Water drips into classroom 311.", "Third Floor - Classroom 311", False, "Open",                        "2026-01-22"),
    ("Drainage & Plumbing", "Drain on the terrace is blocked. During rain the water flows down the staircase creating a waterfall.", "Common - Staircase", False, "Open",                                     "2026-01-25"),
    ("Drainage & Plumbing", "The drain outside the main entrance gate gets blocked every time it rains. Waterlogging at the entry point.", "Common - Entrance Gate", False, "Resolved",                      "2026-01-28"),
    ("Drainage & Plumbing", "Seepage in the wall of classroom CR1 on the fourth floor. Wall paint is peeling and mold is forming.", "Fourth Floor - CR1", False, "Open",                                     "2026-02-03"),
    ("Drainage & Plumbing", "Water supply pipe near the second floor lab is leaking. Water is running down the wall.", "Second Floor - Lab", False, "In Progress",                                            "2026-02-08"),
    ("Drainage & Plumbing", "Washroom drain on the third floor is producing foul smell due to blockage. The smell reaches classroom 304.", "Third Floor - Classroom 304", False, "Open",                     "2026-02-13"),
    ("Drainage & Plumbing", "Pipe under the canteen sink is broken and water is pooling under the counter. Slipping hazard for canteen staff.", "Canteen", False, "Open",                                     "2026-02-18"),
    ("Drainage & Plumbing", "Water leaking through the ceiling in Lab 4 on the fourth floor after heavy rain. Computer equipment at risk.", "Fourth Floor - Lab 4", False, "Open",                           "2026-02-23"),

    # Facilities & Equipment (15)
    ("Facilities & Equipment", "The library on the second floor does not have enough seating. Students are standing or sitting on the floor during exams.", "Second Floor - Library", False, "Open",            "2026-01-11"),
    ("Facilities & Equipment", "Sports equipment in the ground floor sports room is very outdated and broken. Nothing usable for students.", "Ground Floor - Sports Room", False, "In Progress",              "2026-01-14"),
    ("Facilities & Equipment", "The GST Auditorium AC is not working. Events and seminars held there are very uncomfortable.", "Auditorium Floor - GST Auditorium", False, "Open",                           "2026-01-17"),
    ("Facilities & Equipment", "The canteen does not have enough seating. Students eat standing or on staircases during lunch break.", "Canteen", False, "Open",                                              "2026-01-20"),
    ("Facilities & Equipment", "Photocopier machine near the admin office on ground floor is broken. Faculty cannot make copies of materials.", "Ground Floor - Admin Office", False, "Resolved",             "2026-01-23"),
    ("Facilities & Equipment", "The NSS room on first floor has no chairs or tables for meetings. NSS activities are disrupted.", "First Floor - NSS Room", False, "Open",                                   "2026-01-26"),
    ("Facilities & Equipment", "Microphone system in the GST Auditorium is not working properly. Speakers cannot be heard at the back.", "Auditorium Floor - GST Auditorium", False, "In Progress",         "2026-01-29"),
    ("Facilities & Equipment", "The library does not have subscriptions to important engineering journals needed for final year projects.", "Second Floor - Library", False, "Open",                          "2026-02-02"),
    ("Facilities & Equipment", "Gym equipment in the sports room has not been maintained. Treadmill and cycle are both broken.", "Ground Floor - Sports Room", False, "Open",                                 "2026-02-05"),
    ("Facilities & Equipment", "Canteen refrigerator is not working. Cold drinks and dairy items are not being stored properly.", "Canteen", False, "Open",                                                   "2026-02-08"),
    ("Facilities & Equipment", "The scanner near the library entrance does not read student ID cards properly. Access is being denied incorrectly.", "Second Floor - Library", False, "In Progress",         "2026-02-11"),
    ("Facilities & Equipment", "Seminar hall projector screen is torn. Cannot be used for upcoming guest lecture.", "Ground Floor - Seminar Hall", False, "Open",                                              "2026-02-14"),
    ("Facilities & Equipment", "Lathe machines in Mechanical Workshop 2 have not been serviced. Three out of five are not operational.", "Auditorium Floor - Mechanical Workshop 2", False, "Open",         "2026-02-17"),
    ("Facilities & Equipment", "Benches outside the classrooms on the fourth floor are broken. Students have no place to sit between lectures.", "Fourth Floor - CR5", False, "Resolved",                   "2026-02-20"),
    ("Facilities & Equipment", "The notice board near the admin office has not been updated for weeks. Important announcements are being missed.", "Ground Floor - Admin Office", False, "Open",             "2026-02-23"),

    # Emergency complaints (10)
    ("Electrical & Power",        "URGENT — Short circuit in Lab 8 on the fourth floor. Sparks visible from the switchboard near computer row 3. Students evacuated. Immediate attention required.", "Fourth Floor - Lab 8", True, "Open",                        "2026-02-10"),
    ("Infrastructure & Furniture","URGENT — Student slipped and fell on the broken staircase tiles between second and third floor. Injury reported. Staircase needs to be blocked immediately.", "Common - Staircase", True, "In Progress",                       "2026-02-14"),
    ("Drainage & Plumbing",       "URGENT — Water pipe burst in Mechanical Workshop 2 on the auditorium floor. Water flooding the workshop. Machines at risk. Need immediate response.", "Auditorium Floor - Mechanical Workshop 2", True, "Open",              "2026-02-17"),
    ("Electrical & Power",        "URGENT — Smoke coming from the electrical panel on the third floor corridor. Burning smell reported by multiple students. Fire risk. Please respond immediately.", "Third Floor - Corridor", True, "Resolved",               "2026-02-20"),
    ("Infrastructure & Furniture","URGENT — Railing on the fourth floor broke when a student leaned on it. Student nearly fell. Railing now hanging loose. Very dangerous with no lift in building.", "Fourth Floor - CR6", True, "In Progress",               "2026-02-22"),
    ("Electrical & Power",        "URGENT — Power failure in all Fourth Floor labs during ongoing practical exam. Students cannot save their work. Backup power not working. Immediate intervention needed.", "Fourth Floor - Lab 4", True, "Resolved",          "2026-02-24"),
    ("Drainage & Plumbing",       "URGENT — Ceiling in classroom CR2 on the fourth floor is leaking heavily after heavy rain. Water dripping on computers and switchboards. Electrical hazard.", "Fourth Floor - CR2", True, "Open",                           "2026-02-26"),
    ("Cleanliness & Hygiene",     "URGENT — Gas leak smell reported near the canteen kitchen. Strong smell of gas since morning. Students and staff near canteen evacuated. Needs immediate inspection.", "Canteen", True, "Resolved",                          "2026-02-28"),
    ("Infrastructure & Furniture","URGENT — Part of the false ceiling in classroom 203 on the second floor collapsed during a lecture. Students were present. No injuries but structural inspection needed urgently.", "Second Floor - Classroom 203", True, "In Progress", "2026-03-02"),
    ("Electrical & Power",        "URGENT — Electric shock incident near the water cooler on the third floor. Wiring near the cooler appears exposed and wet. Student received mild shock. Area cordoned off.", "Third Floor - Lab", True, "Open",               "2026-03-04"),
]

RESOLVED_ACTIONS = {
    "Water & Sanitation":      "Water cooler serviced and restored to working condition.",
    "Electrical & Power":      "Electrical team inspected and repaired the fault. Power restored.",
    "Infrastructure & Furniture": "Maintenance team repaired the reported damage.",
    "Cleanliness & Hygiene":   "Housekeeping team dispatched. Area cleaned and sanitised.",
    "Lighting":                "Fused tube lights replaced. Lighting restored.",
    "IT & Network":            "IT department resolved the issue. Systems are operational.",
    "Drainage & Plumbing":     "Plumbing team cleared the blockage. Drainage restored.",
    "Facilities & Equipment":  "Reported facility/equipment repaired or replaced.",
    "General Complaint":       "Issue reviewed and resolved by the relevant department.",
}

# ── Departments ───────────────────────────────────────────────────────────────
DEPARTMENTS = [
    {"name": "Maintenance",  "location": "Campus Wide"},
    {"name": "Canteen",      "location": "Ground Floor - Canteen"},
    {"name": "AIDS",         "location": "Fourth Floor"},
    {"name": "CSE",          "location": "First Floor"},
    {"name": "AIML",         "location": "Fourth Floor"},
    {"name": "IT",           "location": "Second Floor"},
    {"name": "IoT",          "location": "Third Floor"},
]

# ── Department heads ──────────────────────────────────────────────────────────
# (full_name, user_id, email, password, dept_name)
DEPT_HEADS = [
    ("Maintenance Head",  "dhead_maintenance",  "maintenance_head@gst.sies.edu.in",  "maintenance123",  "Maintenance"),
    ("Canteen Head",      "dhead_canteen",      "canteen_head@gst.sies.edu.in",      "canteen123",      "Canteen"),
    ("AIDS Head",         "dhead_aids",         "aids_head@gst.sies.edu.in",         "aids123",         "AIDS"),
    ("CSE Head",          "dhead_cse",          "cse_head@gst.sies.edu.in",          "cse123",          "CSE"),
    ("AIML Head",         "dhead_aiml",         "aiml_head@gst.sies.edu.in",         "aiml123",         "AIML"),
    ("IT Head",           "dhead_it",           "it_head@gst.sies.edu.in",           "it123",           "IT"),
    ("IoT Head",          "dhead_iot",          "iot_head@gst.sies.edu.in",          "iot123",          "IoT"),
]

# ── Academic branches ─────────────────────────────────────────────────────────
BRANCHES = [
    {"name": "AIDS", "description": "Artificial Intelligence and Data Science"},
    {"name": "CSE",  "description": "Computer Science and Engineering"},
    {"name": "AIML", "description": "Artificial Intelligence and Machine Learning"},
    {"name": "IT",   "description": "Information Technology"},
    {"name": "IoT",  "description": "Internet of Things"},
]

# ── Campus locations ──────────────────────────────────────────────────────────
# (floor, room_name, facility_type, primary_branch)
LOCATIONS_DATA = [
    # Underground (-1) floor
    ("-1",      "GST Auditorium",       "Auditorium",   None),
    ("-1",      "Mechanical Workshop 1","Workshop",     None),
    ("-1",      "Mechanical Workshop 2","Workshop",     None),
    # Ground floor
    ("Ground",  "Admin Office",         "Office",       None),
    ("Ground",  "Seminar Hall",         "Seminar Hall", None),
    ("Ground",  "Sports Room",          "Sports Room",  None),
    ("Ground",  "Principal's Office",   "Office",       None),
    ("Ground",  "Washroom",             "Washroom",     None),
    ("Ground",  "Canteen",              "Canteen",      None),
    # First floor (CSE)
    ("1st",     "Classroom 101",        "Classroom",    "CSE"),
    ("1st",     "Classroom 102",        "Classroom",    "CSE"),
    ("1st",     "Classroom 103",        "Classroom",    "CSE"),
    ("1st",     "Classroom 104",        "Classroom",    "CSE"),
    ("1st",     "Classroom 111",        "Classroom",    "CSE"),
    ("1st",     "Lab 101",              "Lab",          "CSE"),
    ("1st",     "Lab 102",              "Lab",          "CSE"),
    ("1st",     "Lab 103",              "Lab",          "CSE"),
    ("1st",     "Lab 104",              "Lab",          "CSE"),
    ("1st",     "NSS Room",             "Staff Room",   "CSE"),
    ("1st",     "Staff Room",           "Staff Room",   "CSE"),
    ("1st",     "Washroom",             "Washroom",     "CSE"),
    # Second floor (IT)
    ("2nd",     "Classroom 201",        "Classroom",    "IT"),
    ("2nd",     "Classroom 202",        "Classroom",    "IT"),
    ("2nd",     "Classroom 203",        "Classroom",    "IT"),
    ("2nd",     "Classroom 204",        "Classroom",    "IT"),
    ("2nd",     "Classroom 211",        "Classroom",    "IT"),
    ("2nd",     "Lab 201",              "Lab",          "IT"),
    ("2nd",     "Lab 202",              "Lab",          "IT"),
    ("2nd",     "Lab 203",              "Lab",          "IT"),
    ("2nd",     "Lab 204",              "Lab",          "IT"),
    ("2nd",     "Library",              "Library",      "IT"),
    ("2nd",     "Staff Room",           "Staff Room",   "IT"),
    ("2nd",     "Washroom",             "Washroom",     "IT"),
    # Third floor (IoT)
    ("3rd",     "Classroom 301",        "Classroom",    "IoT"),
    ("3rd",     "Classroom 302",        "Classroom",    "IoT"),
    ("3rd",     "Classroom 303",        "Classroom",    "IoT"),
    ("3rd",     "Classroom 304",        "Classroom",    "IoT"),
    ("3rd",     "Classroom 311",        "Classroom",    "IoT"),
    ("3rd",     "Lab 301",              "Lab",          "IoT"),
    ("3rd",     "Lab 302",              "Lab",          "IoT"),
    ("3rd",     "Lab 303",              "Lab",          "IoT"),
    ("3rd",     "Lab 304",              "Lab",          "IoT"),
    ("3rd",     "Staff Room",           "Staff Room",   "IoT"),
    ("3rd",     "Washroom",             "Washroom",     "IoT"),
    # Fourth floor (AIDS + AIML)
    ("4th",     "CR1",                  "Classroom",    "AIDS"),
    ("4th",     "CR2",                  "Classroom",    "AIDS"),
    ("4th",     "CR3",                  "Classroom",    "AIDS"),
    ("4th",     "CR4",                  "Classroom",    "AIML"),
    ("4th",     "CR5",                  "Classroom",    "AIML"),
    ("4th",     "CR6",                  "Classroom",    "AIML"),
    ("4th",     "Lab 1",                "Lab",          "AIDS"),
    ("4th",     "Lab 2",                "Lab",          "AIDS"),
    ("4th",     "Lab 3",                "Lab",          "AIDS"),
    ("4th",     "Lab 4",                "Lab",          "AIDS"),
    ("4th",     "Lab 5",                "Lab",          "AIML"),
    ("4th",     "Lab 6",                "Lab",          "AIML"),
    ("4th",     "Lab 7",                "Lab",          "AIML"),
    ("4th",     "Lab 8",                "Lab",          "AIML"),
    ("4th",     "Staff Room",           "Staff Room",   "AIDS"),
    ("4th",     "Washroom",             "Washroom",     "AIDS"),
]

# ── Location string → responsible dept name ───────────────────────────────────
# Imported from services.location_utils: get_dept_name_for_location(location)


def seed():
    db = SessionLocal()

    # ── Departments ────────────────────────────────────────────────────────────
    dept_by_name: dict[str, int] = {}
    if db.query(DepartmentORM).count() == 0:
        for d in DEPARTMENTS:
            dept = DepartmentORM(
                name       = d["name"],
                location   = d["location"],
                created_at = datetime.utcnow(),
            )
            db.add(dept)
        db.commit()
        print(f"Seeded {len(DEPARTMENTS)} departments.")
    for dept in db.query(DepartmentORM).all():
        dept_by_name[dept.name] = dept.id

    # ── Branches ───────────────────────────────────────────────────────────────
    if db.query(BranchORM).count() == 0:
        for b in BRANCHES:
            branch = BranchORM(name=b["name"], description=b["description"])
            db.add(branch)
        db.commit()
        # Link branches to their academic departments
        for branch in db.query(BranchORM).all():
            dept_id = dept_by_name.get(branch.name)
            if dept_id:
                db.add(AcademicBranchDeptORM(branch_id=branch.id, dept_id=dept_id))
        db.commit()
        print(f"Seeded {len(BRANCHES)} academic branches.")

    # ── Locations ──────────────────────────────────────────────────────────────
    if db.query(LocationORM).count() == 0:
        for floor, room_name, facility_type, primary_branch in LOCATIONS_DATA:
            loc = LocationORM(
                floor          = floor,
                room_name      = room_name,
                facility_type  = facility_type,
                primary_branch = primary_branch,
            )
            db.add(loc)
        db.commit()
        print(f"Seeded {len(LOCATIONS_DATA)} campus locations.")

    # ── Super admin + Department heads ─────────────────────────────────────────
    if db.query(UserORM).count() == 0:
        admin = UserORM(
            user_id       = "admin1",
            full_name     = "Admin",
            email         = "admin@gst.sies.edu.in",
            prn           = None,
            branch        = None,
            year          = None,
            password_hash = hash_password("admin123"),
            role          = "super_admin",
            is_active     = True,
            is_super_admin= True,
            created_at    = datetime.utcnow(),
        )
        db.add(admin)

        for full_name, user_id, email, password, dept_name in DEPT_HEADS:
            dept_id = dept_by_name.get(dept_name)
            head = UserORM(
                user_id       = user_id,
                full_name     = full_name,
                email         = email,
                prn           = None,
                branch        = None,
                year          = None,
                password_hash = hash_password(password),
                role          = "dept_head",
                is_active     = True,
                is_super_admin= False,
                dept_id       = dept_id,
                created_at    = datetime.utcnow(),
            )
            db.add(head)
        db.commit()

        # Add dept heads to the junction table
        for _, user_id, _, _, dept_name in DEPT_HEADS:
            dept_id = dept_by_name.get(dept_name)
            user    = db.query(UserORM).filter(UserORM.user_id == user_id).first()
            if user and dept_id:
                db.add(DepartmentAdminORM(
                    user_id    = user_id,
                    dept_id    = dept_id,
                    created_at = datetime.utcnow(),
                ))
        db.commit()

        for full_name, prn, email, branch, year in STUDENTS:
            uid = "user_" + prn.lower()
            u = UserORM(
                user_id       = uid,
                full_name     = full_name,
                email         = email,
                prn           = prn,
                branch        = branch,
                year          = year,
                password_hash = hash_password("siesgst123"),
                role          = "user",
                is_active     = True,
                created_at    = datetime.utcnow(),
            )
            db.add(u)
        db.commit()
        print(f"Seeded 1 admin + {len(DEPT_HEADS)} dept heads + {len(STUDENTS)} students.")
    else:
        print("Users already seeded — skipping.")

    # ── Complaints ────────────────────────────────────────────────────────────
    if db.query(ComplaintORM).count() > 0:
        print("Complaints already seeded — skipping.")
        db.close()
        return

    student_users = db.query(UserORM).filter(UserORM.role == "user").all()
    user_pool     = student_users if student_users else []

    for i, (cat, text, location, is_emg, status, dt) in enumerate(COMPLAINTS):
        urgency  = score_urgency(text)
        decision = classify(text, urgency, is_emergency=is_emg)

        # Cycle through users
        user     = user_pool[i % len(user_pool)] if user_pool else None
        uid      = user.user_id if user else "user_seed"
        prn      = user.prn     if user else None
        branch   = user.branch  if user else None
        year     = user.year    if user else None

        action = RESOLVED_ACTIONS.get(cat, "") if status == "Resolved" else (
                 "Team dispatched. Resolution in progress." if status == "In Progress" else ""
        )

        # Auto-assign to responsible department based on location
        dept_name = get_dept_name_for_location(location)
        dept_id   = dept_by_name.get(dept_name)

        record = ComplaintORM(
            user_id          = uid,
            prn              = prn,
            branch           = branch,
            year             = year,
            text             = text,
            category         = decision.category,
            priority         = decision.priority,
            status           = status,
            sentiment        = urgency,
            location         = location,
            action_taken     = action,
            is_emergency     = is_emg,
            demoted_by_admin = False,
            submitted_at     = date.fromisoformat(dt),
            updated_at       = datetime.utcnow(),
            dept_id          = dept_id,
        )
        db.add(record)

    db.commit()
    _recluster(db)
    total = db.query(ComplaintORM).count()
    emg   = db.query(ComplaintORM).filter(ComplaintORM.is_emergency == True).count()
    print(f"Seeded {total} complaints ({emg} emergencies).")
    db.close()


if __name__ == "__main__":
    seed()