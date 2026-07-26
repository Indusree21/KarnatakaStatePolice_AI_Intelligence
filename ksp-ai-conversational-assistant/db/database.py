"""
db/database.py — SQLAlchemy engine, session factory, and helper utilities.
"""
import os
from contextlib import contextmanager
from typing import Any, Dict, List

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "ksp_crime.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db() -> Session:
    """Yield a database session and ensure it is closed afterward."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_query(sql: str, params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
    """
    Execute a raw SQL SELECT and return results as a list of dicts.
    Raises ValueError on non-SELECT statements to prevent mutation.
    """
    clean = sql.strip().upper()
    if not clean.startswith("SELECT"):
        raise ValueError("Only SELECT queries are permitted through this helper.")

    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        columns = list(result.keys())
        return [dict(zip(columns, row)) for row in result.fetchall()]


def get_schema_summary() -> str:
    """
    Return a compact schema description used as context for the Text-to-SQL LLM prompt.
    """
    return """
SQLite database: ksp_crime.db

Tables and columns:
- CaseMaster(CaseMasterID PK, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID FK, PoliceStationID FK,
  CaseCategoryID FK, GravityOffenceID FK, CrimeMajorHeadID FK, CrimeMinorHeadID FK, CaseStatusID FK,
  CourtID FK, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts,
  IsConfidential INTEGER DEFAULT 0)
- ComplainantDetails(ComplainantID PK, CaseMasterID FK, ComplainantName, AgeYear, OccupationID FK,
  ReligionID FK, CasteID FK, GenderID)
- Accused(AccusedMasterID PK, CaseMasterID FK, AccusedName, AgeYear, GenderID, PersonID)
- Victim(VictimMasterID PK, CaseMasterID FK, VictimName, AgeYear, GenderID, VictimPolice)
- ArrestSurrender(ArrestSurrenderID PK, CaseMasterID FK, ArrestSurrenderTypeID, ArrestSurrenderDate,
  ArrestSurrenderStateId, ArrestSurrenderDistrictId, PoliceStationID, IOID FK, CourtID FK,
  AccusedMasterID FK, IsAccused, IsComplainantAccused)
- Act(ActCode PK, ActDescription, ShortName, Active)
- Section(ActCode FK, SectionCode, SectionDescription, Active)
- ActSectionAssociation(CaseMasterID FK, ActID FK, SectionID FK)
- CrimeHead(CrimeHeadID PK, CrimeGroupName)
- CrimeSubHead(CrimeSubHeadID PK, CrimeHeadID FK, CrimeHeadName)
- Unit(UnitID PK, UnitName, DistrictID, StateID)
- Employee(EmployeeID PK, KGID, FirstName, RankID, DesignationID, UnitID)
- Rank(RankID PK, RankName, Hierarchy)
- CaseStatusMaster(CaseStatusID PK, CaseStatusName)
- District(DistrictID PK, DistrictName)
- State(StateID PK, StateName)

Notes:
- GravityOffenceID 3 = HIGH gravity (classified). IsConfidential = 1 means restricted.
- Join CaseMaster -> District via Unit -> Employee for station/district context.
- ArrestSurrender links accused arrests to cases.
"""
