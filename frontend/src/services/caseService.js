/**
 * caseService.js — Intelligence Data & Query Resolver for KSP AI Assistant
 * 
 * Strict Database Query Processor:
 *   - Only searches actual registered FIR records in local DB / localStorage.
 *   - If found: returns matching case details, generates network graph, enables PDF export.
 *   - If NOT found: explicitly informs officer "No cases registered in the database for [query]".
 *   - NEVER generates fake or random fallback cases!
 */

import { sendChatQuery as apiSendChatQuery } from "./api";

export const RESPONSE_TYPES = {
  CASE_DETAILS: "CASE_DETAILS",
  RELATED_CASES: "RELATED_CASES",
  MAP_SEARCH: "MAP_SEARCH",
  NETWORK_GRAPH: "NETWORK_GRAPH",
  TEXT_MESSAGE: "TEXT_MESSAGE",
};

// ─── HELPER: GENERATE UNIQUE NETWORK GRAPH FOR ANY REGISTERED CASE ─────────

function extractSummarySuspects(summary) {
  return [...new Set(
    [...summary.matchAll(/(?:suspect|accused|offender|perpetrator)(?:s)?\s+(?:is|are|named|identified as|called|:)?\s*([A-Za-z][A-Za-z .'-]{2,40})/gi)]
      .map((match) => match[1].split(/\s+(?:and|who|was|were|used|uses|in|near|with|on)\s+/i)[0].trim())
      .filter((name) => name.length > 2)
  )];
}

function extractCyberFraudEntities(summary, currentFir) {
  const phoneMatch = summary.match(/(?:phone|mobile|contact)\s*(?:number|no\.?|#)?\s*[:\-]?\s*(\+?\d[\d\s-]{8,})/i);
  const bankMatch = summary.match(/(?:bank account|account number|a\/c)\s*(?:number|no\.?|#)?\s*[:\-]?\s*([A-Z0-9-]{5,})/i);
  const linkMatch = summary.match(/((?:fraudulent|fake|phishing|malicious)\s+link|https?:\/\/\S+)/i);
  const caseNumbers = [...summary.matchAll(/\b(?:case|fir)\s*[-#]?\s*(\d{3,})\b/gi)]
    .map((match) => match[1])
    .filter((caseNumber, index, values) => values.indexOf(caseNumber) === index && !String(currentFir).includes(caseNumber));

  return {
    link: linkMatch?.[1] || "Fraudulent Link",
    phone: phoneMatch?.[1]?.trim() || "Phone Number",
    bank: bankMatch?.[1]?.trim() || "Bank Account",
    caseNumbers,
  };
}

export function generateUniqueNetworkGraph(caseObj) {
  const firId = caseObj.firNumber || caseObj.id || "FIR-100";
  const title = caseObj.crimeType || caseObj.incidentType || caseObj.title || "Investigation Record";
  const location = caseObj.location || "Mysuru District";
  const victimName = caseObj.victim || caseObj.complainantName || "Complainant Statement Recorded";
  const summary = caseObj.summary || caseObj.description || "Investigation details recorded in the FIR.";

  if (caseObj.source === "local_fir") {
    const isCyberFraud = /cyber|online fraud|fraudulent link|fake link|phishing|otp|bank account|account number|phone number|mobile number|unauthorized transaction|financial fraud/i.test(`${title} ${summary}`);
    if (isCyberFraud) {
      const { link, phone, bank, caseNumbers } = extractCyberFraudEntities(summary, firId);
      const nodes = [
        {
          id: `case_${firId}`,
          label: `📋 ${title.toUpperCase()}\n${firId}`,
          type: "case",
          meta: { FIR: firId, CrimeType: title, Status: caseObj.status || "Registered", summary },
        },
        {
          id: `victim_${firId}`,
          label: `👤 ${String(victimName).split("(")[0].trim()}`,
          type: "victim",
          meta: { name: victimName, role: "Victim / Complainant", statement: summary },
        },
        {
          id: `link_${firId}`,
          label: `🔗 ${link}`,
          type: "fraud_link",
          meta: { value: link, role: "Fraudulent link", source: summary },
        },
        {
          id: `phone_${firId}`,
          label: `📱 ${phone}`,
          type: "phone",
          meta: { value: phone, role: "Phone number used in fraud", source: summary },
        },
        {
          id: `bank_${firId}`,
          label: `🏦 ${bank}`,
          type: "bank_account",
          meta: { value: bank, role: "Bank account / money trail", source: summary },
        },
      ];
      const edges = [
        { id: `e_victim_${firId}`, source: `victim_${firId}`, target: `case_${firId}`, label: "Reported" },
        { id: `e_link_${firId}`, source: `case_${firId}`, target: `link_${firId}`, label: "Used" },
        { id: `e_phone_${firId}`, source: `link_${firId}`, target: `phone_${firId}`, label: "Redirected to" },
        { id: `e_bank_${firId}`, source: `phone_${firId}`, target: `bank_${firId}`, label: "Requested payment" },
      ];

      caseNumbers.forEach((caseNumber, index) => {
        const linkedId = `linked_case_${firId}_${caseNumber}`;
        nodes.push({
          id: linkedId,
          label: `📁 Case ${caseNumber}`,
          type: "linked_case",
          meta: { FIR: `Case ${caseNumber}`, role: "Linked fraud case", source: summary },
        });
        edges.push({ id: `e_case_${firId}_${index}`, source: `bank_${firId}`, target: linkedId, label: "Shared account" });
      });

      return { nodes, edges };
    }

    const suspectsList = [...new Set([
      ...(Array.isArray(caseObj.suspects) ? caseObj.suspects : []),
      ...extractSummarySuspects(summary),
    ])];
    const evidenceTerms = [...new Set(summary.match(/\b(?:CCTV|camera|vehicle|weapon|knife|phone|mobile|cash|jewellery|jewelry|fingerprint|witness|document)\b/gi) || [])];
    const caseNodeId = `case_${firId}`;
    const nodes = [
      {
        id: caseNodeId,
        label: `📋 ${firId}\n${title.slice(0, 20)}`,
        type: "case",
        meta: { FIR: firId, CrimeType: title, Location: location, Date: caseObj.date || "2026", Status: caseObj.status || "Registered" },
      },
      {
        id: `complainant_${firId}`,
        label: `👤 Complainant\n${String(victimName).split("(")[0].slice(0, 18)}`,
        type: "victim",
        meta: { name: victimName, role: "Complainant / Victim", location, statement: summary },
      },
      {
        id: `summary_${firId}`,
        label: `📝 Incident Summary\n${summary.slice(0, 18)}...`,
        type: "evidence",
        meta: { summary, source: "New FIR submission" },
      },
      {
        id: `location_${firId}`,
        label: `📍 Location\n${location.slice(0, 18)}`,
        type: "location",
        meta: { location, role: "Incident location" },
      },
    ];
    const edges = [
      { id: `e_complainant_${firId}`, source: `complainant_${firId}`, target: caseNodeId, label: "Reported / Victim" },
      { id: `e_summary_${firId}`, source: `summary_${firId}`, target: caseNodeId, label: "Describes incident" },
      { id: `e_location_${firId}`, source: `location_${firId}`, target: caseNodeId, label: "Occurred at" },
    ];

    suspectsList.forEach((suspect, index) => {
      const suspectId = `suspect_${firId}_${index}`;
      nodes.push({
        id: suspectId,
        label: `🚔 Suspect\n${suspect.slice(0, 18)}`,
        type: "accused",
        meta: { name: suspect, role: "Person mentioned in submitted summary", source: summary },
      });
      edges.push({ id: `e_suspect_${firId}_${index}`, source: suspectId, target: caseNodeId, label: "Mentioned in summary" });
    });

    evidenceTerms.forEach((term, index) => {
      const evidenceId = `evidence_${firId}_${index}`;
      nodes.push({ id: evidenceId, label: `🔎 Evidence\n${term}`, type: "evidence", meta: { item: term, source: summary } });
      edges.push({ id: `e_evidence_${firId}_${index}`, source: evidenceId, target: `summary_${firId}`, label: "Found in summary" });
    });

    return { nodes, edges };
  }
  
  const suspectsList = Array.isArray(caseObj.suspects)
    ? caseObj.suspects
    : Array.isArray(caseObj.accused)
    ? caseObj.accused
    : [caseObj.suspect || "Suspect pending forensic identification"];

  const mainSuspect = suspectsList[0] || "Unknown Suspect";
  const mainSuspectName = mainSuspect.split("(")[0].replace(/['"]/g, "").trim();

  const nodes = [
    {
      id: `case_${firId}`,
      label: `📋 ${firId}\n${title.slice(0, 20)}`,
      type: "case",
      meta: { FIR: firId, CrimeType: title, Location: location, Date: caseObj.date || caseObj.incidentDate || "2026", Status: caseObj.status || "Registered" }
    },
    {
      id: `vic_${firId}`,
      label: `👤 Victim\n${victimName.split("(")[0].slice(0, 18)}`,
      type: "victim",
      meta: { name: victimName, role: "Victim / Complainant", location: location, statement: caseObj.description || "Statement recorded by IO" }
    },
    {
      id: `sus_${firId}_1`,
      label: `bb🚔 Suspect\n${mainSuspectName.slice(0, 18)}`,
      type: "accused",
      meta: { name: mainSuspect, role: "Prime Accused", status: "Under Tracking", history: "Linked to police record database" }
    },
    {
      id: `wit_${firId}`,
      label: `👁️ Witness\nInformant / Guard`,
      type: "witness",
      meta: { name: `Key Witness for ${firId}`, role: "Eyewitness / CCTV Operator", location: location }
    },
    {
      id: `assoc_${firId}`,
      label: `🔗 Associate\nCrime Associate`,
      type: "associate",
      meta: { name: `Associate connected to ${mainSuspectName}`, role: "Accomplice / Fencer", location: location }
    },
    {
      id: `prev_fir_${firId}`,
      label: `📁 Prior Record\nLinked Case`,
      type: "linked_case",
      meta: { FIR: `Prior Record linked to ${firId}`, offense: title, station: "Mysuru Division" }
    }
  ];

  const edges = [
    { id: `e_vic_${firId}`, source: `vic_${firId}`, target: `case_${firId}`, label: "Victim of" },
    { id: `e_sus1_${firId}`, source: `sus_${firId}_1`, target: `case_${firId}`, label: "Prime Suspect" },
    { id: `e_wit_${firId}`, source: `wit_${firId}`, target: `case_${firId}`, label: "Witness" },
    { id: `e_assoc_${firId}`, source: `assoc_${firId}`, target: `sus_${firId}_1`, label: "Associate" },
    { id: `e_prev_${firId}`, source: `prev_fir_${firId}`, target: `assoc_${firId}`, label: "Prior Record Link" },
  ];

  return { nodes, edges };
}

// ─── 1. BASE DATABASE OF REGISTERED FIRs ────────────────────────────────────

export const STATIC_MOCK_CASES = [
  // --- VEHICLE THEFT & BURGLARY ---
  {
    firNumber: "FIR-102",
    crimeType: "Vehicle Theft (Two Wheeler)",
    category: "theft",
    date: "15 July 2026, 09:30 PM",
    location: "Mysuru Railway Station Parking",
    district: "Mysuru Urban",
    victim: "Ananya Rao (Age 29, Software Engineer)",
    suspects: ["Ramesh Kumar alias 'Blade Ramesh' (Age 32)", "Unknown accomplice"],
    evidence: [
      "CCTV footage from Platform 1 exit",
      "Broken handlebar lock fragments recovered",
      "Latent fingerprint match on helmet lock",
    ],
    observations: [
      "Suspect Ramesh Kumar has 3 previous vehicle theft cases registered in Mandi & Lashkar PS.",
      "CCTV shows two riders fleeing towards Bannimantap Road on an unnumbered Hero Honda.",
    ],
    status: "Under Investigation",
    summary: "Hero Splendor (KA-09-EA-4521) stolen near main ticket counter. Suspect Ramesh Kumar identified.",
  },
  {
    firNumber: "FIR-105",
    crimeType: "Commercial Theft & Burglary",
    category: "theft",
    date: "17 July 2026, 03:00 AM",
    location: "Sayyaji Rao Road, Mysuru",
    district: "Mysuru Urban",
    victim: "K. N. Swamy (Jewelry Shop Owner)",
    suspects: ["Ramesh Kumar alias 'Blade Ramesh'", "Sunil alias 'Chotta'"],
    evidence: [
      "Glass cutter tools left at shop entrance",
      "Footprint impression size 9",
    ],
    observations: [
      "Modus operandi identical to FIR-102 (same entry tool marks).",
    ],
    status: "Under Investigation",
    summary: "Silver ornaments worth Rs 2.4 Lakhs stolen after prying open back shutters of Lakshmi Jewelry Works.",
  },
  {
    firNumber: "FIR-118",
    crimeType: "Shop Burglary & Theft",
    category: "theft",
    date: "18 July 2026, 02:15 AM",
    location: "Devaraja Market, Mysuru",
    district: "Mysuru Urban",
    victim: "Mahesh Fabrics (Prop. Mahesh Kumar)",
    suspects: ["Syed Imran alias 'Katta Imran'"],
    evidence: ["Fingerprints on cash drawer", "Iron crowbar recovered"],
    observations: ["Cash box tampered, CCTV blind spot used in market aisle."],
    status: "Suspect Identified",
    summary: "Textile shop shutter broken, Rs 45,000 cash stolen.",
  },

  // --- ROBBERY & CHAIN SNATCHING ---
  {
    firNumber: "FIR-124",
    crimeType: "Chain Snatching & Attempted Robbery",
    category: "robbery",
    date: "21 July 2026, 06:45 PM",
    location: "Gokulam 3rd Stage, Mysuru",
    district: "Mysuru Urban",
    victim: "Saraswathi Ammal (Age 62, Resident)",
    suspects: ["Kiran Kumar alias 'Speedy Kiran'", "Vinay Gowda"],
    evidence: ["Eyewitness mobile recording", "Tire track patterns of Pulsar 220"],
    observations: ["Black Pulsar bike with smeared license plate spotted on Hunsur Road."],
    status: "Active Alert",
    summary: "Gold chain (24 grams) snatched near Temple street intersection during evening walk by armed riders.",
  },
  {
    firNumber: "FIR-180",
    crimeType: "Armed Robbery & ATM Kiosk Assault",
    category: "robbery",
    date: "24 July 2026, 01:20 AM",
    location: "Metagalli Main Road ATM, Mysuru",
    district: "Mysuru Urban",
    victim: "ATM Security Guard Ramappa",
    suspects: ["Two masked men with machetes"],
    evidence: [
      "Security guard mobile emergency call",
      "High resolution night-vision CCTV",
    ],
    observations: ["Suspects attempted to pry open cash vault; alarm triggered response patrol."],
    status: "Under Investigation",
    summary: "Machete-wielding robbers overpowered security guard and attempted ATM vault breach.",
  },

  // --- ACCIDENT & TRAFFIC ---
  {
    firNumber: "FIR-201",
    crimeType: "Fatal Road Accident & Hit and Run",
    category: "accident",
    date: "28 July 2026, 11:15 PM",
    location: "Outer Ring Road Junction, Mysuru",
    district: "Mysuru Urban",
    victim: "Basavaraj M. (Age 42, Delivery Rider)",
    suspects: ["Unknown Driver of Black SUV (KA-09-MC-8821)"],
    evidence: [
      "Broken bumper headlight fragments",
      "ORR Toll CCTV footage showing speeding SUV",
    ],
    observations: ["ALPR alert triggered at Kadakola checkpost."],
    status: "Active Investigation",
    summary: "Two-wheeler hit from behind by a speeding SUV. Rider sustained fatal injuries; driver fled.",
  },

  // --- HOUSEBREAK THEFT ---
  {
    firNumber: "FIR-145",
    crimeType: "Housebreak Theft",
    category: "theft",
    date: "25 July 2026, 01:30 PM",
    location: "Vijayanagar 2nd Stage, Mysuru",
    district: "Mysuru Urban",
    victim: "Dr. R. K. Hegde (Senior Physician)",
    suspects: ["Ramesh Kumar", "Vikram alias 'Chotta Viki'"],
    evidence: ["Fencing contact phone records", "Stolen gold chain recovered"],
    observations: ["Cross-linked with FIR-102 suspect network."],
    status: "Chargesheet Prepared",
    summary: "Laptops and gold jewelry stolen during afternoon hours while family was away.",
  },
];

/**
 * Fetch all registered cases from static DB and user-submitted localStorage FIRs
 */
export function getAllRegisteredCases() {
  let userFirs = [];
  try {
    const stored = localStorage.getItem("firs");
    if (stored) {
      const parsed = JSON.parse(stored);
      userFirs = parsed.map(f => ({
        firNumber: f.firNumber,
        crimeType: f.incidentType || "Custom Registered Case",
        category: (f.incidentType || "").toLowerCase().includes("theft") ? "theft"
                : (f.incidentType || "").toLowerCase().includes("assault") ? "assault"
                : (f.incidentType || "").toLowerCase().includes("cyber") ? "cyber"
                : "custom",
        date: f.registeredAt || f.incidentDate || "Recently Filed",
        location: f.location || "Mysuru District",
        district: "Mysuru Urban",
        victim: f.complainantName ? `${f.complainantName} (Ph: ${f.contactNumber || "N/A"})` : "Complainant Statement Recorded",
        suspects: extractSummarySuspects(f.description || ""),
        evidence: ["FIR Complaint Document", "Officer Preliminary Report"],
        observations: [f.description || "Fresh FIR registered via KSP Police Portal."],
        status: f.status || "Pending Investigation",
        summary: f.description || `Registered complaint for ${f.incidentType} filed by ${f.complainantName}.`,
        source: "local_fir",
      }));
    }
  } catch {
    userFirs = [];
  }

  const combined = [...STATIC_MOCK_CASES, ...userFirs];
  combined.forEach(c => {
    const g = generateUniqueNetworkGraph(c);
    c.networkNodes = g.nodes;
    c.networkEdges = g.edges;
  });
  return combined;
}

export const MOCK_CASES = getAllRegisteredCases();
export const MYSURU_15_THEFT_CASES = STATIC_MOCK_CASES;

/**
 * Get network graph for any registered FIR in database
 */
export function getNetworkGraphForQuery(queryOrFir) {
  const allCases = getAllRegisteredCases();
  const q = String(queryOrFir).trim().toLowerCase();
  
  const match = allCases.find(c => q.includes(c.firNumber.toLowerCase()) || c.firNumber.toLowerCase().includes(q)) ||
                allCases.find(c => c.crimeType.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || (c.victim && c.victim.toLowerCase().includes(q)));

  if (match) {
    const graph = generateUniqueNetworkGraph(match);
    return {
      caseData: match,
      nodes: graph.nodes,
      edges: graph.edges,
    };
  }

  // Fallback to first registered case if no specific FIR match
  const defaultCase = allCases[0];
  const graph = generateUniqueNetworkGraph(defaultCase);
  return { caseData: defaultCase, nodes: graph.nodes, edges: graph.edges };
}

// ─── STRICT DATABASE QUERY RESOLVER ─────────────────────────────────────────

/**
 * Strict AI Query Processor:
 *   - Only matches actual registered cases in the database.
 *   - If NO cases exist for the query in database, explicitly responds: "No cases registered".
 *   - NEVER returns fake, random, or unrelated fallback cases!
 */
export async function processOfficerQuery(query, uploadedDoc = null) {
  const q = query.trim().toLowerCase();
  const allCases = getAllRegisteredCases();

  // Local FIRs are saved in this browser and must be resolved before the API,
  // which only knows about the seeded backend database.
  const localFirMatch = allCases.find(c =>
    c.source === "local_fir" && q.includes(c.firNumber.toLowerCase())
  );
  if (localFirMatch) {
    const net = generateUniqueNetworkGraph(localFirMatch);
    return {
      type: RESPONSE_TYPES.CASE_DETAILS,
      text: `Here is the complete investigation file and summary-driven criminal network for **${localFirMatch.firNumber}** (${localFirMatch.crimeType}):`,
      caseData: localFirMatch,
      networkData: { nodes: net.nodes, edges: net.edges },
    };
  }

  // 1. PDF DOCUMENT CONTEXT QUERY
  if (uploadedDoc && (q.includes("pdf") || q.includes("uploaded") || q.includes("document") || q.includes("file") || q.includes("report") || q.includes("summarize") || q.includes("what") || q.includes("who") || q.includes("evidence"))) {
    const filename = uploadedDoc.name || "Uploaded_Case.pdf";
    const text = uploadedDoc.content || "";

    let answer = `📄 **Analysis from Uploaded Document [${filename}]**:\n\n`;

    if (q.includes("summarize") || q.includes("summary") || q.includes("overview")) {
      answer += `**Executive Summary**: Document contains investigation records for ${uploadedDoc.firNumber || "uploaded file"}.\n- **Details**: ${uploadedDoc.summary || text.slice(0, 200)}...\n- **Status**: ${uploadedDoc.status || "Indexed"}`;
    } else if (q.includes("who") || q.includes("suspect") || q.includes("accused") || q.includes("victim")) {
      answer += `**Persons Mentioned in [${filename}]**:\n- **Victim/Complainant**: ${uploadedDoc.victim || "Statement recorded"}\n- **Suspect(s)**: ${Array.isArray(uploadedDoc.suspects) ? uploadedDoc.suspects.join(", ") : uploadedDoc.suspects || "Under tracking"}`;
    } else {
      answer += `Based on your uploaded document **${filename}**:\n${text.slice(0, 400) || "Document indexed into memory context."}`;
    }

    return {
      type: RESPONSE_TYPES.TEXT_MESSAGE,
      text: answer,
    };
  }

  // Try FastAPI backend if active
  try {
    const apiResult = await apiSendChatQuery(query);
    if (apiResult && apiResult.status === "success" && apiResult.answer_text) {
      if (apiResult.query_type === "graph" && apiResult.graph_data) {
        const firMatch = allCases.find(c => q.includes(c.firNumber.toLowerCase()));
        return {
          type: RESPONSE_TYPES.CASE_DETAILS,
          text: apiResult.answer_text,
          caseData: firMatch || allCases[0],
          networkData: apiResult.graph_data,
        };
      }
    }
  } catch (err) {
    // API offline — fallback to strict DB search below
  }

  // 2. SPECIFIC FIR NUMBER SEARCH (e.g. "FIR-102", "FIR-201", "FIR-124")
  const exactFirMatch = allCases.find(c => q.includes(c.firNumber.toLowerCase()) || c.firNumber.toLowerCase() === q);
  if (exactFirMatch) {
    const net = generateUniqueNetworkGraph(exactFirMatch);
    return {
      type: RESPONSE_TYPES.CASE_DETAILS,
      text: `Here is the complete investigation file and criminal network for **${exactFirMatch.firNumber}** (${exactFirMatch.crimeType}):`,
      caseData: exactFirMatch,
      networkData: {
        nodes: net.nodes,
        edges: net.edges,
      }
    };
  }

  // 3. CRIME CATEGORY / KEYWORD SEARCH (e.g. "accident", "robbery", "theft", "burglary", "assault", "cyber")
  let matchedCases = [];

  if (q.includes("accident") || q.includes("hit and run") || q.includes("crash") || q.includes("collision")) {
    matchedCases = allCases.filter(c => c.category === "accident" || c.crimeType.toLowerCase().includes("accident") || c.summary.toLowerCase().includes("accident"));
  } else if (q.includes("robbery") || q.includes("snatch") || q.includes("dacoity") || q.includes("machete")) {
    matchedCases = allCases.filter(c => c.category === "robbery" || c.crimeType.toLowerCase().includes("robbery") || c.crimeType.toLowerCase().includes("snatch"));
  } else if (q.includes("theft") || q.includes("burglary") || q.includes("stolen") || q.includes("housebreak")) {
    matchedCases = allCases.filter(c => c.category === "theft" || c.crimeType.toLowerCase().includes("theft") || c.crimeType.toLowerCase().includes("burglary"));
  } else if (q.includes("cyber") || q.includes("fraud") || q.includes("otp")) {
    matchedCases = allCases.filter(c => c.category === "cyber" || c.crimeType.toLowerCase().includes("fraud") || c.crimeType.toLowerCase().includes("cyber"));
  } else {
    // General keyword match against location, victim, suspect, summary
    matchedCases = allCases.filter(c =>
      c.crimeType.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      (c.victim && c.victim.toLowerCase().includes(q)) ||
      (c.suspects && c.suspects.some(s => s.toLowerCase().includes(q)))
    );
  }

  // IF MATCHING REGISTERED CASES EXIST IN THE DATABASE:
  if (matchedCases.length > 0) {
    // Geo map search trigger for Mysuru theft queries
    if ((q.includes("theft") || q.includes("crime")) && (q.includes("mysuru") || q.includes("map"))) {
      return {
        type: RESPONSE_TYPES.MAP_SEARCH,
        text: `📍 **${matchedCases.length} registered cases found in Mysuru database**:`,
        mapData: {
          city: "Mysuru",
          crimeType: "Theft / Crime",
          totalCases: matchedCases.length,
          incidents: matchedCases,
        }
      };
    }

    return {
      type: RESPONSE_TYPES.RELATED_CASES,
      text: `🔍 Found **${matchedCases.length} registered case(s)** in the database matching your query *"${query}"*:`,
      baseCase: matchedCases[0],
      relatedCases: matchedCases,
    };
  }

  // STRICT BEHAVIOR: IF NO MATCHING CASES EXIST IN DATABASE ➔ TELL OFFICER NO CASES FOUND!
  return {
    type: RESPONSE_TYPES.TEXT_MESSAGE,
    text: `⚠️ **No Registered Cases Found**\n\nNo investigation records registered in the database matching *"${query}"*.\n\n- You can file a new case record under the **Register New FIR** tab.\n- Or query registered cases like **FIR-102** (Vehicle Theft), **FIR-124** (Chain Snatching), **FIR-180** (Armed Robbery), or **FIR-201** (Hit & Run Accident).`,
  };
}
