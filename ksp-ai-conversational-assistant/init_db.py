"""
init_db.py — Create all tables and seed 18 realistic Karnataka crime records.
Run once: python init_db.py
"""
import os
from dotenv import load_dotenv
from sqlalchemy import text
from db.database import engine

load_dotenv()

DDL = """
-- Lookup tables first (no FK dependencies)
CREATE TABLE IF NOT EXISTS State (
    StateID   INTEGER PRIMARY KEY,
    StateName TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS District (
    DistrictID   INTEGER PRIMARY KEY,
    DistrictName TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS Rank (
    RankID    INTEGER PRIMARY KEY,
    RankName  TEXT NOT NULL,
    Hierarchy INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS CaseStatusMaster (
    CaseStatusID   INTEGER PRIMARY KEY,
    CaseStatusName TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS CrimeHead (
    CrimeHeadID    INTEGER PRIMARY KEY,
    CrimeGroupName TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS CrimeSubHead (
    CrimeSubHeadID INTEGER PRIMARY KEY,
    CrimeHeadID    INTEGER REFERENCES CrimeHead(CrimeHeadID),
    CrimeHeadName  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS Act (
    ActCode         INTEGER PRIMARY KEY,
    ActDescription  TEXT NOT NULL,
    ShortName       TEXT,
    Active          INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS Section (
    ActCode         INTEGER REFERENCES Act(ActCode),
    SectionCode     TEXT NOT NULL,
    SectionDescription TEXT,
    Active          INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS Unit (
    UnitID     INTEGER PRIMARY KEY,
    UnitName   TEXT NOT NULL,
    DistrictID INTEGER REFERENCES District(DistrictID),
    StateID    INTEGER REFERENCES State(StateID)
);
CREATE TABLE IF NOT EXISTS Employee (
    EmployeeID    INTEGER PRIMARY KEY,
    KGID          TEXT NOT NULL,
    FirstName     TEXT NOT NULL,
    RankID        INTEGER REFERENCES Rank(RankID),
    DesignationID INTEGER,
    UnitID        INTEGER REFERENCES Unit(UnitID)
);

-- Core tables
CREATE TABLE IF NOT EXISTS CaseMaster (
    CaseMasterID          INTEGER PRIMARY KEY AUTOINCREMENT,
    CrimeNo               TEXT NOT NULL,
    CaseNo                TEXT,
    CrimeRegisteredDate   TEXT,
    PolicePersonID        INTEGER REFERENCES Employee(EmployeeID),
    PoliceStationID       INTEGER REFERENCES Unit(UnitID),
    CaseCategoryID        INTEGER,
    GravityOffenceID      INTEGER,  -- 1=Low, 2=Medium, 3=High
    CrimeMajorHeadID      INTEGER REFERENCES CrimeHead(CrimeHeadID),
    CrimeMinorHeadID      INTEGER REFERENCES CrimeSubHead(CrimeSubHeadID),
    CaseStatusID          INTEGER REFERENCES CaseStatusMaster(CaseStatusID),
    CourtID               INTEGER,
    IncidentFromDate      TEXT,
    IncidentToDate        TEXT,
    InfoReceivedPSDate    TEXT,
    latitude              REAL,
    longitude             REAL,
    BriefFacts            TEXT,
    IsConfidential        INTEGER DEFAULT 0  -- 1 = restricted/classified
);
CREATE TABLE IF NOT EXISTS ComplainantDetails (
    ComplainantID   INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID    INTEGER REFERENCES CaseMaster(CaseMasterID),
    ComplainantName TEXT,
    AgeYear         INTEGER,
    OccupationID    INTEGER,
    ReligionID      INTEGER,
    CasteID         INTEGER,
    GenderID        INTEGER  -- 1=Male, 2=Female
);
CREATE TABLE IF NOT EXISTS Accused (
    AccusedMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID    INTEGER REFERENCES CaseMaster(CaseMasterID),
    AccusedName     TEXT,
    AgeYear         INTEGER,
    GenderID        INTEGER,
    PersonID        INTEGER
);
CREATE TABLE IF NOT EXISTS Victim (
    VictimMasterID  INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID    INTEGER REFERENCES CaseMaster(CaseMasterID),
    VictimName      TEXT,
    AgeYear         INTEGER,
    GenderID        INTEGER,
    VictimPolice    TEXT
);
CREATE TABLE IF NOT EXISTS ArrestSurrender (
    ArrestSurrenderID       INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID            INTEGER REFERENCES CaseMaster(CaseMasterID),
    ArrestSurrenderTypeID   INTEGER,
    ArrestSurrenderDate     TEXT,
    ArrestSurrenderStateId  INTEGER,
    ArrestSurrenderDistrictId INTEGER,
    PoliceStationID         INTEGER,
    IOID                    INTEGER,
    CourtID                 INTEGER,
    AccusedMasterID         INTEGER REFERENCES Accused(AccusedMasterID),
    IsAccused               INTEGER DEFAULT 1,
    IsComplainantAccused    INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ActSectionAssociation (
    CaseMasterID INTEGER REFERENCES CaseMaster(CaseMasterID),
    ActID        INTEGER REFERENCES Act(ActCode),
    SectionID    INTEGER
);
"""

SEED = """
-- States & Districts
INSERT OR IGNORE INTO State VALUES (1,'Karnataka');
INSERT OR IGNORE INTO District VALUES
  (1,'Bengaluru Urban'),(2,'Mysuru'),(3,'Mangaluru'),(4,'Hubballi-Dharwad'),
  (5,'Belagavi'),(6,'Kalaburagi'),(7,'Shivamogga'),(8,'Tumakuru');

-- Ranks
INSERT OR IGNORE INTO Rank VALUES
  (1,'Director General of Police',1),(2,'Inspector General',2),
  (3,'Superintendent of Police',3),(4,'Inspector',4),
  (5,'Sub-Inspector',5),(6,'Head Constable',6),(7,'Constable',7);

-- Case Statuses
INSERT OR IGNORE INTO CaseStatusMaster VALUES
  (1,'Under Investigation'),(2,'Charge Sheet Filed'),(3,'Closed'),(4,'Referred to Court');

-- Crime Heads
INSERT OR IGNORE INTO CrimeHead VALUES
  (1,'Crimes Against Body'),(2,'Crimes Against Property'),
  (3,'Crimes Against Women'),(4,'Economic Offences'),(5,'Cyber Crimes');
INSERT OR IGNORE INTO CrimeSubHead VALUES
  (1,1,'Murder'),(2,1,'Assault'),(3,2,'House Burglary'),(4,2,'Vehicle Theft'),
  (5,3,'Harassment'),(6,3,'Kidnapping'),(7,4,'Fraud'),(8,5,'Online Fraud'),
  (9,1,'Attempt to Murder'),(10,2,'Robbery');

-- Acts
INSERT OR IGNORE INTO Act VALUES
  (1,'Indian Penal Code','IPC',1),(2,'Karnataka Police Act','KPA',1),
  (3,'Information Technology Act','IT Act',1);
INSERT OR IGNORE INTO Section VALUES
  (1,'302','Murder',1),(1,'307','Attempt to Murder',1),
  (1,'376','Rape',1),(1,'420','Cheating and Dishonestly',1),
  (1,'379','Theft',1),(1,'392','Robbery',1),(1,'354','Assault on Woman',1),
  (1,'363','Kidnapping',1);

-- Units (Police Stations)
INSERT OR IGNORE INTO Unit VALUES
  (1,'Mysuru South PS',2,1),(2,'Bengaluru Central PS',1,1),
  (3,'Mangaluru East PS',3,1),(4,'Hubballi City PS',4,1),
  (5,'Belagavi Urban PS',5,1),(6,'Kalaburagi PS',6,1),
  (7,'Shivamogga PS',7,1),(8,'Tumakuru PS',8,1);

-- Employees
INSERT OR IGNORE INTO Employee VALUES
  (1,'KG100001','Ravi Kumar',4,10,1),(2,'KG100002','Suresh Nayak',5,11,2),
  (3,'KG100003','Priya Sharma',4,10,3),(4,'KG100004','Mahesh Gowda',5,11,4),
  (5,'KG100005','Anitha Rao',4,10,5),(6,'KG100006','Deepak Hegde',7,12,6),
  (7,'KG100007','Kavitha Murthy',4,10,7),(8,'KG100008','Basavraj Patil',5,11,8);

-- CaseMaster (18 records)
INSERT OR IGNORE INTO CaseMaster
  (CaseMasterID,CrimeNo,CaseNo,CrimeRegisteredDate,PolicePersonID,PoliceStationID,
   CaseCategoryID,GravityOffenceID,CrimeMajorHeadID,CrimeMinorHeadID,CaseStatusID,
   CourtID,IncidentFromDate,IncidentToDate,InfoReceivedPSDate,latitude,longitude,BriefFacts,IsConfidential)
VALUES
(101,'104430006202600001','CR/101/2026','2026-01-05',1,1,1,2,2,3,1,1,
 '2026-01-04','2026-01-05','2026-01-05',12.2958,76.6394,
 'Complainant Ramesh reported that unknown persons broke into his house in Kuvempunagar, Mysuru during night hours and stole gold ornaments worth Rs 2.5 lakhs and cash Rs 50000. Accused fled before arrival of police. CCTV footage recovered from nearby shop.',0),

(102,'104430006202600002','CR/102/2026','2026-01-10',2,2,1,1,1,2,2,2,
 '2026-01-09','2026-01-10','2026-01-10',12.9716,77.5946,
 'Victim Sunil Kumar was attacked by a group of three persons near KR Market, Bengaluru following a dispute over parking space. Victim sustained grievous injuries on head and shoulder. Three accused identified as Manjunath, Sridhar, and Ramu were arrested within 24 hours.',0),

(103,'104430006202600003','CR/103/2026','2026-01-15',3,3,2,1,2,4,1,3,
 '2026-01-14','2026-01-15','2026-01-15',12.8698,74.8431,
 'Owner of a two-wheeler showroom in Mangaluru reported theft of 3 motorcycles from the premises overnight. Accused cut the security lock using bolt cutters. Surveillance video shows two masked individuals. Vehicles later traced to Udupi district.',0),

(104,'104430006202600004','CR/104/2026','2026-01-20',4,4,1,3,1,1,2,4,
 '2026-01-19','2026-01-20','2026-01-20',15.3647,75.1240,
 'Murder case registered in Hubballi. Victim Laxmi Devi found dead with stab wounds at her residence. Husband Gopal accused of the crime following domestic dispute over property. Accused arrested. Case involves minor children as witnesses. Classified due to witness protection concerns.',1),

(105,'104430006202600005','CR/105/2026','2026-02-02',5,5,2,2,3,5,1,5,
 '2026-02-01','2026-02-02','2026-02-02',15.8497,74.4977,
 'Complainant Deepa Kulkarni filed complaint against her neighbor Anil for continuous harassment and threatening behavior in Belagavi. Multiple prior complaints on record. Accused was previously warned. Case registered under IPC 354.',0),

(106,'104430006202600006','CR/106/2026','2026-02-08',6,6,1,2,5,8,3,6,
 '2026-02-05','2026-02-08','2026-02-08',17.3297,76.8343,
 'Cyber fraud case in Kalaburagi. Victim Venkatesh lost Rs 1.8 lakhs after clicking on fake KYC link. Fraudsters posed as bank officials. IP trace leads to Rajasthan. Case coordinated with Cyber Crime Cell Bengaluru for inter-state investigation.',0),

(107,'104430006202600007','CR/107/2026','2026-02-14',7,7,2,1,2,3,2,7,
 '2026-02-13','2026-02-14','2026-02-14',13.9299,75.5681,
 'House burglary reported in Shivamogga. Smt Radha Bai reported theft of household articles, cash Rs 30000 and silver articles from her locked house. Neighbour Prakash is prime suspect. Scene of crime examination done. Fingerprints lifted.',0),

(108,'104430006202600008','CR/108/2026','2026-02-20',8,8,1,2,4,7,1,8,
 '2026-02-19','2026-02-20','2026-02-20',13.3409,77.1010,
 'Cheating case registered in Tumakuru. Accused Nagaraj posing as a government contractor collected advance money from 12 labourers promising construction jobs in Bengaluru. Total fraud amount Rs 3.6 lakhs. Accused absconding. Look-out notice issued.',0),

(109,'104430006202600009','CR/109/2026','2026-03-01',1,1,2,1,3,6,1,1,
 '2026-02-28','2026-03-01','2026-03-01',12.3052,76.6552,
 'Minor girl aged 14 kidnapped from school premises in Mysuru. Accused Imran alias Bhai known to victim family. Child recovered within 48 hours from Mandya district. Accused arrested. Case registered under IPC 363 and POCSO Act.',0),

(110,'104430006202600010','CR/110/2026','2026-03-05',2,2,1,3,1,9,2,2,
 '2026-03-04','2026-03-05','2026-03-05',12.9716,77.5946,
 'Attempt to murder case in Bengaluru. Accused Riyaz allegedly opened fire at rival gang member Saleem near Shivajinagar. Victim injured but survived. Firearm recovered. Case linked to prior property dispute. High gravity offence. Classified for officer safety.',1),

(111,'104430006202600011','CR/111/2026','2026-03-10',3,3,1,1,2,10,3,3,
 '2026-03-09','2026-03-10','2026-03-10',12.8698,74.8431,
 'Robbery at a petrol station in Mangaluru. Three masked men threatened staff with knives and decamped with cash Rs 80000 from counter. Incident occurred at 10PM. Staff member Suresh sustained minor injuries while resisting. Two accused nabbed within 3 days.',0),

(112,'104430006202600012','CR/112/2026','2026-03-15',4,4,2,2,5,8,1,4,
 '2026-03-12','2026-03-15','2026-03-15',15.3647,75.1240,
 'Online job fraud case in Hubballi. Victim Shobha Desai duped of Rs 95000 through fake job portal. Accused collected fees for job placement which never materialized. Digital evidence includes WhatsApp chats and UPI transaction logs.',0),

(113,'104430006202600013','CR/113/2026','2026-03-20',5,5,1,2,1,2,2,5,
 '2026-03-19','2026-03-20','2026-03-20',15.8497,74.4977,
 'Assault case near Belagavi bus stand. Accused Rajendra and his associates attacked vendor Hussain over extortion money. Victim sustained fracture. Two out of three accused arrested. Third accused Santosh is absconding. Case charge sheet filed.',0),

(114,'104430006202600014','CR/114/2026','2026-04-01',6,6,2,1,2,4,3,6,
 '2026-03-31','2026-04-01','2026-04-01',17.3297,76.8343,
 'Three motorcycles stolen from residential parking in Kalaburagi. Same modus operandi as previous month incidents. Suspect believed to be same gang. One accused Farhan arrested with stolen vehicle. Investigation ongoing to identify accomplices.',0),

(115,'104430006202600015','CR/115/2026','2026-04-05',7,7,2,2,3,5,1,7,
 '2026-04-04','2026-04-05','2026-04-05',13.9299,75.5681,
 'Dowry harassment complaint filed by Savitha against husband Kiran and in-laws in Shivamogga. Victim alleges continuous physical and mental torture for additional dowry. Medical examination done. Case registered under IPC 498A and Dowry Prohibition Act.',0),

(116,'104430006202600016','CR/116/2026','2026-04-10',8,8,1,1,4,7,1,8,
 '2026-04-09','2026-04-10','2026-04-10',13.3409,77.1010,
 'Investment fraud in Tumakuru. Accused Shankara running fake chit fund scheme collected Rs 12 lakhs from 25 victims promising 30% returns. Scheme collapsed and accused attempted to flee. Arrested at Bengaluru airport. Bank accounts frozen.',0),

(117,'104430006202600017','CR/117/2026','2026-04-15',1,1,1,2,1,2,2,1,
 '2026-04-14','2026-04-15','2026-04-15',12.2958,76.6394,
 'Gang assault case in Mysuru South. Accused Mahesh and four others attacked rival group over land dispute in Nazarbad area. Two victims hospitalized. Case involves organized criminal group with prior history. Three accused arrested.',0),

(118,'104430006202600018','CR/118/2026','2026-04-20',2,2,2,3,5,8,1,2,
 '2026-04-18','2026-04-20','2026-04-20',12.9716,77.5946,
 'Classified cyber-espionage complaint registered in Bengaluru. Sensitive government data allegedly exfiltrated via phishing attack targeting Karnataka Secretariat. Three suspects identified with cross-border links. National security implications. All details restricted.',1);

-- Complainants
INSERT OR IGNORE INTO ComplainantDetails VALUES
  (1,101,'Ramesh Gowda',42,1,1,1,1),(2,102,'Sunil Kumar',35,2,1,1,1),
  (3,103,'Mohammed Farooq',50,3,2,2,1),(4,104,'Neighbour Complaint',30,1,3,3,2),
  (5,105,'Deepa Kulkarni',28,2,1,1,2),(6,106,'Venkatesh Reddy',45,4,1,2,1),
  (7,107,'Radha Bai',60,1,1,1,2),(8,108,'Labourers Group',35,5,1,3,1),
  (9,109,'Parent of Minor',38,2,1,1,1),(10,110,'Saleem Khan',32,2,2,2,1),
  (11,111,'Petrol Station Owner',48,3,1,1,1),(12,112,'Shobha Desai',26,2,1,1,2),
  (13,113,'Hussain Khan',40,5,2,2,1),(14,114,'Residential Assoc.',55,1,1,1,1),
  (15,115,'Savitha',24,2,1,1,2),(16,116,'Investors Group',45,4,1,2,1),
  (17,117,'Victim Group',30,1,1,1,1),(18,118,'Government Official',50,6,1,1,1);

-- Accused
INSERT OR IGNORE INTO Accused VALUES
  (1,101,'Unknown Accused 1',25,1,NULL),(2,101,'Unknown Accused 2',28,1,NULL),
  (3,102,'Manjunath H',30,1,201),(4,102,'Sridhar K',27,1,202),(5,102,'Ramu P',32,1,203),
  (6,103,'Unknown Masked 1',25,1,NULL),(7,103,'Unknown Masked 2',22,1,NULL),
  (8,104,'Gopal Nayak',45,1,204),
  (9,105,'Anil Kumar',38,1,205),
  (10,106,'Unknown Cyber Fraudster',30,1,NULL),
  (11,107,'Prakash S',35,1,206),
  (12,108,'Nagaraj T',40,1,207),
  (13,109,'Imran alias Bhai',24,1,208),
  (14,110,'Riyaz Ahmed',29,1,209),
  (15,111,'Unknown Robber 1',26,1,NULL),(16,111,'Unknown Robber 2',23,1,NULL),
  (17,112,'Unknown Fraudster',31,1,NULL),
  (18,113,'Rajendra B',34,1,210),(19,113,'Santosh V',28,1,211),
  (20,114,'Farhan M',26,1,212),
  (21,115,'Kiran Patil',32,1,213),
  (22,116,'Shankara N',50,1,214),
  (23,117,'Mahesh D',28,1,215),(24,117,'Associate 1',25,1,NULL),(25,117,'Associate 2',23,1,NULL),
  (26,118,'Suspect Alpha',35,1,NULL),(27,118,'Suspect Beta',40,1,NULL);

-- Victims
INSERT OR IGNORE INTO Victim VALUES
  (1,101,'Ramesh Gowda',42,1,'Mysuru South PS'),
  (2,102,'Sunil Kumar',35,1,'Bengaluru Central PS'),
  (3,103,'Showroom Owner',50,1,'Mangaluru East PS'),
  (4,104,'Laxmi Devi',38,2,'Hubballi City PS'),
  (5,105,'Deepa Kulkarni',28,2,'Belagavi Urban PS'),
  (6,106,'Venkatesh Reddy',45,1,'Kalaburagi PS'),
  (7,107,'Radha Bai',60,2,'Shivamogga PS'),
  (8,108,'12 Labourers',35,1,'Tumakuru PS'),
  (9,109,'Minor Girl',14,2,'Mysuru South PS'),
  (10,110,'Saleem Khan',32,1,'Bengaluru Central PS'),
  (11,111,'Suresh (Staff)',30,1,'Mangaluru East PS'),
  (12,112,'Shobha Desai',26,2,'Hubballi City PS'),
  (13,113,'Hussain Khan',40,1,'Belagavi Urban PS'),
  (14,116,'25 Investors',45,1,'Tumakuru PS'),
  (15,117,'Rival Group Member',29,1,'Mysuru South PS');

-- Arrests
INSERT OR IGNORE INTO ArrestSurrender VALUES
  (1,102,1,'2026-01-11',1,1,2,2,2,3,1,0),
  (2,102,1,'2026-01-11',1,1,2,2,2,4,1,0),
  (3,102,1,'2026-01-11',1,1,2,2,2,5,1,0),
  (4,104,1,'2026-01-21',1,4,4,4,4,8,1,0),
  (5,109,1,'2026-03-03',1,2,1,1,1,13,1,0),
  (6,110,1,'2026-03-06',1,1,2,2,2,14,1,0),
  (7,111,1,'2026-03-13',1,3,3,3,3,15,1,0),
  (8,111,1,'2026-03-13',1,3,3,3,3,16,1,0),
  (9,113,1,'2026-03-21',1,5,5,5,5,18,1,0),
  (10,114,1,'2026-04-02',1,6,6,6,6,20,1,0),
  (11,116,1,'2026-04-11',1,8,8,8,8,22,1,0),
  (12,117,1,'2026-04-16',1,2,1,1,1,23,1,0),
  (13,117,1,'2026-04-16',1,2,1,1,1,24,1,0);

-- Act-Section associations
INSERT OR IGNORE INTO ActSectionAssociation VALUES
  (101,1,NULL),(102,1,NULL),(103,1,NULL),(104,1,NULL),
  (105,1,NULL),(106,3,NULL),(107,1,NULL),(108,1,NULL),
  (109,1,NULL),(110,1,NULL),(111,1,NULL),(112,3,NULL),
  (113,1,NULL),(114,1,NULL),(115,1,NULL),(116,1,NULL),
  (117,1,NULL),(118,3,NULL);
"""


def init_database():
    print("Creating tables...")
    with engine.connect() as conn:
        for statement in DDL.strip().split(";"):
            stmt = statement.strip()
            if stmt:
                conn.execute(text(stmt))
        conn.commit()

    print("Seeding data...")
    with engine.connect() as conn:
        # Parse seed statements carefully — split only on ";\n" at the line
        # start to avoid chopping VALUES(...) blocks mid-way.
        import re as _re
        # Normalise line endings, strip comment-only lines
        seed_clean = "\n".join(
            line for line in SEED.splitlines()
            if not line.strip().startswith("--") and line.strip()
        )
        # Split on semicolons that are immediately followed by a newline
        # (or end of string), so multi-line VALUES blocks stay intact.
        statements = _re.split(r";\s*\n", seed_clean)
        for stmt in statements:
            stmt = stmt.strip().rstrip(";")
            if not stmt:
                continue
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"  Warning (likely duplicate): {e}")
        conn.commit()

    print(f"Database initialised at: {os.getenv('DB_PATH', 'ksp_crime.db')}")


if __name__ == "__main__":
    init_database()
