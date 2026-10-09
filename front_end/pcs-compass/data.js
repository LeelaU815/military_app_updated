// database for map info, disabilities, etc.
//
// Every place in here is real and was checked online in September 2026 -- `source` is where the info came from.
// lat/lng come from geocoding the street address (U.S. Census geocoder, or OpenStreetMap where noted).
// Phone numbers and programs change, so re-check them before a big release.

const ALL_CATEGORIES = ["sld", "ohi", "sli", "asd", "dd", "id", "ed", "md", "hi", "oi", "vi", "tbi", "db"];

// 1. The bases -- `complete: true` means we have areas, schools, providers, and contacts for it.
// shortName is what older saved profiles stored as "installation", so keep it stable.
// lat/lng for bases are from each base's Wikipedia article.
export const BASES = [
    {
        id: "norfolk", shortName: "Norfolk", name: "Naval Station Norfolk",
        city: "Norfolk", state: "VA", region: "hampton-roads", complete: true,
        lat: 36.945, lng: -76.3131,
        mtf: "Naval Medical Center Portsmouth",
        mtfPhone: "(757) 953-5008",
        efmpOffice: "Fleet & Family Support Center Norfolk (EFMP)",
        efmpPhone: "(757) 444-2102"
    },
    { id: "little-creek", shortName: "Little Creek", name: "Joint Expeditionary Base Little Creek", city: "Virginia Beach", state: "VA", region: "hampton-roads", complete: false, lat: 36.917, lng: -76.164 },
    { id: "oceana", shortName: "Oceana", name: "Naval Air Station Oceana", city: "Virginia Beach", state: "VA", region: "hampton-roads", complete: false, lat: 36.8206, lng: -76.0333 },
    { id: "dam-neck", shortName: "Dam Neck", name: "Dam Neck Annex", city: "Virginia Beach", state: "VA", region: "hampton-roads", complete: false, lat: 36.7833, lng: -75.9583 },
    { id: "yorktown", shortName: "Yorktown", name: "Naval Weapons Station Yorktown", city: "Yorktown", state: "VA", region: "hampton-roads", complete: false, lat: 37.2359, lng: -76.5492 },
    { id: "portsmouth", shortName: "Portsmouth", name: "Naval Medical Center Portsmouth", city: "Portsmouth", state: "VA", region: "hampton-roads", complete: false, lat: 36.8475, lng: -76.3047 },
    { id: "pentagon", shortName: "Pentagon", name: "The Pentagon", city: "Arlington", state: "VA", region: "northern-va", complete: false, lat: 38.8708, lng: -77.055 },
    { id: "quantico", shortName: "Quantico", name: "Marine Corps Base Quantico", city: "Quantico", state: "VA", region: "northern-va", complete: false, lat: 38.5019, lng: -77.3058 }
];

// 2. The categories -- the 13 federally recognized (IDEA) disability categories for kids in the US
export const CATEGORIES = [
    { id: "sld", label: "Specific Learning Disability (SLD)" },
    { id: "ohi", label: "Other Health Impairment (OHI)" },
    { id: "sli", label: "Speech or Language Impairment" },
    { id: "asd", label: "Autism Spectrum Disorder (ASD)" },
    { id: "dd", label: "Developmental Delay" },
    { id: "id", label: "Intellectual Disability" },
    { id: "ed", label: "Emotional Disturbance" },
    { id: "md", label: "Multiple Disabilities" },
    { id: "hi", label: "Hearing Impairment" },
    { id: "oi", label: "Orthopedic Impairment" },
    { id: "vi", label: "Visual Impairment (incl. blindness)" },
    { id: "tbi", label: "Traumatic Brain Injury (TBI)" },
    { id: "db", label: "Deaf-Blindness" }
];

// 3. The areas they could live in. lat/lng is the neighborhood center from OpenStreetMap
// (Great Neck isn't mapped as one place, so it's the average of its 4 schools).
export const AREAS = [
    { id: "nf1", baseId: "norfolk", name: "Ghent (Norfolk)", district: "Norfolk Public Schools", lat: 36.8639, lng: -76.2939 },
    { id: "nf2", baseId: "norfolk", name: "Kempsville (Virginia Beach)", district: "Virginia Beach City Public Schools", lat: 36.8268, lng: -76.1602 },
    { id: "nf3", baseId: "norfolk", name: "Greenbrier (Chesapeake)", district: "Chesapeake Public Schools", lat: 36.779, lng: -76.2312 },
    { id: "nf4", baseId: "norfolk", name: "Ocean View (Norfolk)", district: "Norfolk Public Schools", lat: 36.9501, lng: -76.2465 },
    { id: "nf5", baseId: "norfolk", name: "Larchmont (Norfolk)", district: "Norfolk Public Schools", lat: 36.8979, lng: -76.3027 },
    { id: "nf6", baseId: "norfolk", name: "Great Neck (Virginia Beach)", district: "Virginia Beach City Public Schools", lat: 36.8848, lng: -76.0429 },
    { id: "nf7", baseId: "norfolk", name: "Western Branch (Chesapeake)", district: "Chesapeake Public Schools", lat: 36.8274, lng: -76.4246 },
    { id: "nf8", baseId: "norfolk", name: "Churchland (Portsmouth)", district: "Portsmouth Public Schools", lat: 36.8646, lng: -76.3966 }
];

// 4. Schools per area.
// categories: public schools have to serve every IDEA category (some services may be at a regional site,
// ask the district), so they get all 13. Private schools only list what their own website says they support.
// iep504: public schools must follow IEPs/504s; private schools don't have to (true / "limited").
// specialized: the whole school is built for kids with these needs, so limited IEP rules matter less.
const VDOE = "https://schoolquality.virginia.gov/schools/";
export const SCHOOLS = [
    // Ghent
    { id: "s11", baseId: "norfolk", areaId: "nf1", name: "Maury High School", type: "public", grades: "9-12", address: "322 Shirley Ave, Norfolk, VA 23517", phone: "(757) 628-3344", lat: 36.8646, lng: -76.2907, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "matthew-fontaine-maury-high" },
    { id: "s16", baseId: "norfolk", areaId: "nf1", name: "W.H. Taylor Elementary", type: "public", grades: "PK-5", address: "1122 W Princess Anne Rd, Norfolk, VA 23507", phone: "(757) 628-2525", lat: 36.8683, lng: -76.3042, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "walter-herron-taylor-elementary" },
    { id: "s17", baseId: "norfolk", areaId: "nf1", name: "Blair Middle School", type: "public", grades: "6-8", address: "730 Spotswood Ave, Norfolk, VA 23517", phone: "(757) 628-2400", lat: 36.8684, lng: -76.2966, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "blair-middle" },
    // Kempsville
    { id: "s13", baseId: "norfolk", areaId: "nf2", name: "Kempsville Elementary", type: "public", grades: "PK-5", address: "570 Kempsville Rd, Virginia Beach, VA 23464", phone: "(757) 648-2720", lat: 36.8225, lng: -76.1614, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "kempsville-elementary" },
    { id: "s18", baseId: "norfolk", areaId: "nf2", name: "Kempsville Middle School", type: "public", grades: "6-8", address: "860 Churchill Dr, Virginia Beach, VA 23464", phone: "(757) 648-4700", lat: 36.811, lng: -76.1561, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "kempsville-middle" },
    { id: "s19", baseId: "norfolk", areaId: "nf2", name: "Kempsville High School", type: "public", grades: "9-12", address: "5194 Chief Trl, Virginia Beach, VA 23464", phone: "(757) 648-5450", lat: 36.8213, lng: -76.1583, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "kempsville-high" },
    { id: "s14", baseId: "norfolk", areaId: "nf2", name: "Chesapeake Bay Academy", type: "private", grades: "K-12", address: "821 Baker Rd, Virginia Beach, VA 23462", phone: "(757) 497-6200", lat: 36.8668, lng: -76.1802, categories: ["sld", "ohi", "sli", "dd", "asd"], iep504: "limited", specialized: true, notes: "Independent school for students with learning differences: dyslexia, dysgraphia, dyscalculia, ADHD, language-based learning differences, developmental delays, and high-functioning autism.", source: "https://en.wikipedia.org/wiki/Chesapeake_Bay_Academy" },
    // Greenbrier
    { id: "s20", baseId: "norfolk", areaId: "nf3", name: "Greenbrier Primary", type: "public", grades: "PK-2", address: "1551 Eden Way S, Chesapeake, VA 23320", phone: "(757) 436-3428", lat: 36.7662, lng: -76.222, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "greenbrier-primary" },
    { id: "s15", baseId: "norfolk", areaId: "nf3", name: "Greenbrier Intermediate", type: "public", grades: "3-5", address: "1701 River Birch Run N, Chesapeake, VA 23320", phone: "(757) 578-7080", lat: 36.7867, lng: -76.2208, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "greenbrier-intermediate" },
    { id: "s21", baseId: "norfolk", areaId: "nf3", name: "Greenbrier Middle School", type: "public", grades: "6-8", address: "1016 Greenbrier Pkwy, Chesapeake, VA 23320", phone: "(757) 548-5309", lat: 36.7581, lng: -76.224, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "greenbrier-middle" },
    { id: "s22", baseId: "norfolk", areaId: "nf3", name: "Oscar F. Smith High School", type: "public", grades: "9-12", address: "1994 Tiger Dr, Chesapeake, VA 23320", phone: "(757) 548-0696", lat: 36.7392, lng: -76.2565, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "oscar-f-smith-high" },
    // Ocean View
    { id: "s23", baseId: "norfolk", areaId: "nf4", name: "Ocean View Elementary", type: "public", grades: "K-5", address: "350 W Government Ave, Norfolk, VA 23503", phone: "(757) 531-3105", lat: 36.9547, lng: -76.2612, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "ocean-view-elementary" },
    { id: "s24", baseId: "norfolk", areaId: "nf4", name: "Granby High School", type: "public", grades: "9-12", address: "7101 Granby St, Norfolk, VA 23505", phone: "(757) 451-4110", lat: 36.9066, lng: -76.2763, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "granby-high" },
    // Larchmont
    { id: "s25", baseId: "norfolk", areaId: "nf5", name: "Larchmont Elementary", type: "public", grades: "PK-5", address: "1145 Bolling Ave, Norfolk, VA 23508", phone: "(757) 451-4180", lat: 36.8912, lng: -76.3023, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "larchmont-elementary" },
    { id: "s12", baseId: "norfolk", areaId: "nf5", name: "Norfolk Collegiate", type: "private", grades: "PK-12", address: "7336 Granby St, Norfolk, VA 23505", phone: "(757) 480-2885", lat: 36.9113, lng: -76.2739, categories: ["sld"], iep504: "limited", notes: "Learning Resource Program: individual and small-group academic support for K-12. Grades 6-12 are at this campus; the lower school (PK-5) is at 5429 Tidewater Dr, (757) 625-0471.", source: "https://www.norfolkcollegiate.org/academics/learning-resources" },
    // Great Neck
    { id: "s26", baseId: "norfolk", areaId: "nf6", name: "Alanton Elementary", type: "public", grades: "PK-5", address: "1441 Stephens Rd, Virginia Beach, VA 23454", phone: "(757) 648-2000", lat: 36.8825, lng: -76.0304, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "alanton-elementary" },
    { id: "s27", baseId: "norfolk", areaId: "nf6", name: "Great Neck Middle School", type: "public", grades: "6-8", address: "1848 N Great Neck Rd, Virginia Beach, VA 23454", phone: "(757) 648-4550", lat: 36.8947, lng: -76.0592, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "great-neck-middle" },
    { id: "s28", baseId: "norfolk", areaId: "nf6", name: "Frank W. Cox High School", type: "public", grades: "9-12", address: "2425 Shorehaven Dr, Virginia Beach, VA 23454", phone: "(757) 648-5250", lat: 36.8857, lng: -76.0511, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "frank-w-cox-high" },
    { id: "s29", baseId: "norfolk", areaId: "nf6", name: "Cape Henry Collegiate", type: "private", grades: "PK-12", address: "1320 Mill Dam Rd, Virginia Beach, VA 23454", phone: "(757) 481-2446", lat: 36.8761, lng: -76.031, categories: ["sld"], iep504: "limited", notes: "Academic Center for extra support in reading, writing, and math; learning plans when families share outside testing.", source: "https://www.capehenrycollegiate.org/academics/learning-support-services" },
    // Western Branch
    { id: "s30", baseId: "norfolk", areaId: "nf7", name: "Western Branch Primary", type: "public", grades: "PK-2", address: "4122 Terry Dr, Chesapeake, VA 23321", phone: "(757) 638-7951", lat: 36.8454, lng: -76.4022, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "western-branch-primary" },
    { id: "s31", baseId: "norfolk", areaId: "nf7", name: "Western Branch Middle School", type: "public", grades: "6-8", address: "4201 Hawksley Dr, Chesapeake, VA 23321", phone: "(757) 638-7920", lat: 36.8521, lng: -76.4039, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "western-branch-middle" }, // lat/lng from OpenStreetMap
    { id: "s32", baseId: "norfolk", areaId: "nf7", name: "Western Branch High School", type: "public", grades: "9-12", address: "1968 Bruin Pl, Chesapeake, VA 23321", phone: "(757) 638-7900", lat: 36.8479, lng: -76.4081, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "western-branch-high" },
    // Churchland
    { id: "s33", baseId: "norfolk", areaId: "nf8", name: "Churchland Elementary", type: "public", grades: "K-6", address: "5601 Michael Ln, Portsmouth, VA 23703", phone: "(757) 686-2523", lat: 36.859, lng: -76.3849, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "churchland-elementary" },
    { id: "s34", baseId: "norfolk", areaId: "nf8", name: "Churchland Middle School", type: "public", grades: "7-8", address: "4051 River Shore Rd, Portsmouth, VA 23703", phone: "(757) 686-2512", lat: 36.8792, lng: -76.3816, categories: ALL_CATEGORIES, iep504: true, notes: "", source: "https://www.ppsk12.us/o/cms/page/contact-us" },
    { id: "s35", baseId: "norfolk", areaId: "nf8", name: "Churchland High School", type: "public", grades: "9-12", address: "4301 Cedar Ln, Portsmouth, VA 23703", phone: "(757) 686-2500", lat: 36.8814, lng: -76.3748, categories: ALL_CATEGORIES, iep504: true, notes: "", source: VDOE + "churchland-high" }
];

// 5. Providers, the doctors and hospitals and stuff.
// kind: "hospital" | "clinic" | "doctor" | "therapy" | "respite" | "state"
// tricare: "mtf" (military treatment facility), "accepted" (the provider or a provider directory lists TRICARE --
// still confirm in-network for your plan), "efmp" (paid for by the Navy EFMP), "free", or null (not listed).
// categories: which needs the services they offer cover. Speech or occupational therapy counts for autism (asd).
// aba: true if they offer ABA therapy (adds the Autism Care Demonstration task when chosen).
export const PROVIDERS = [
    { id: "p11", baseId: "norfolk", areaId: null, name: "Naval Medical Center Portsmouth", kind: "hospital", onBase: true, tricare: "mtf", address: "620 John Paul Jones Cir, Portsmouth, VA 23708", phone: "(757) 953-5008", lat: 36.8434, lng: -76.305, categories: ALL_CATEGORIES, notes: "Regional military hospital. Primary MTF for EFMP enrollment updates and specialty referrals.", source: "https://www.tricare.mil/GettingCare/FindDoctor/MTF/Facilities/Naval-Medical-Center-Portsmouth" },
    { id: "p16", baseId: "norfolk", areaId: null, name: "Branch Health Clinic Naval Station Norfolk", kind: "clinic", onBase: true, tricare: "mtf", address: "1721 Admiral Taussig Blvd, Norfolk, VA 23511", phone: "(757) 953-9000", lat: 36.9439, lng: -76.3155, categories: [], notes: "On-base clinic (Sewells Point), Mon-Fri 7am-4pm. Call to confirm pediatric appointments.", source: "https://www.tricare.mil/GettingCare/FindDoctor/MTF/Facilities/Branch-Health-Clinic-Naval-Station-Norfolk" },
    { id: "p12", baseId: "norfolk", areaId: "nf1", name: "CHKD Children's Hospital", kind: "hospital", onBase: false, tricare: "accepted", address: "601 Children's Ln, Norfolk, VA 23507", phone: "(757) 668-7000", lat: 36.8613, lng: -76.3017, categories: ALL_CATEGORIES, notes: "Freestanding children's hospital (ages 0-21). TRICARE needs a non-availability statement for inpatient stays; CHKD helps with it.", source: "https://www.chkd.org/patient-family-resources/billing-and-insurance/insurance-information/" },
    { id: "p13", baseId: "norfolk", areaId: "nf1", name: "CHKD Developmental Pediatrics", kind: "doctor", onBase: false, tricare: "accepted", address: "601 Children's Ln, Norfolk, VA 23507", phone: "(757) 668-7400", lat: 36.8613, lng: -76.3017, categories: ["dd", "asd", "id", "ohi", "md"], notes: "Developmental evaluations. Also has offices at Concert Drive (Virginia Beach) and Harbour View (Suffolk).", source: "https://www.chkd.org/our-care/specialty-care/developmental-pediatrics/" },
    { id: "p14", baseId: "norfolk", areaId: "nf1", name: "CHKD Audiology", kind: "therapy", onBase: false, tricare: "accepted", address: "601 Children's Ln, Norfolk, VA 23507", phone: "(757) 668-9343", lat: 36.8613, lng: -76.3017, categories: ["hi", "db"], notes: "Hearing testing and hearing aids, birth to 21.", source: "https://www.chkd.org/our-care/programs-clinics-and-centers/audiology-program/" },
    { id: "p24", baseId: "norfolk", areaId: "nf1", name: "CHKD Mental Health (Children's Pavilion)", kind: "hospital", onBase: false, tricare: "accepted", address: "401 Gresham Dr, Norfolk, VA 23507", phone: "(757) 668-4673", lat: 36.8607, lng: -76.3053, categories: ["ed"], notes: "Inpatient and outpatient child and teen mental health, therapy, and a partial hospitalization program.", source: "https://www.chkd.org/our-care/mental-health-care/" },
    { id: "p25", baseId: "norfolk", areaId: "nf3", name: "CHKD Health Center at Oakbrooke", kind: "therapy", onBase: false, tricare: "accepted", address: "500 Discovery Dr, Chesapeake, VA 23320", phone: "(757) 668-2415", lat: 36.7361, lng: -76.2233, categories: ["sli", "oi", "dd", "md", "tbi", "asd"], notes: "Physical, occupational, and speech therapy; aquatic therapy. Main line (757) 668-2311.", source: "https://www.chkd.org/locations/health-center-at-oakbrooke/" },
    { id: "p26", baseId: "norfolk", areaId: null, name: "CHKD Health and Surgery Center at Concert Drive", kind: "therapy", onBase: false, tricare: "accepted", address: "2021 Concert Dr, Virginia Beach, VA 23456", phone: "(757) 668-2740", lat: 36.777, lng: -76.1005, categories: ["oi", "tbi", "md"], notes: "Physical therapy line listed; main line (757) 668-2711.", source: "https://www.chkd.org/locations/health-and-surgery-center-at-concert-drive/" },
    { id: "p27", baseId: "norfolk", areaId: "nf3", name: "MySpot - Greenbrier", kind: "therapy", onBase: false, tricare: "accepted", address: "709 Quince Pl, Chesapeake, VA 23320", phone: "(757) 277-9874", lat: 36.7409, lng: -76.2132, aba: true, categories: ["asd", "sli", "dd", "oi"], notes: "ABA, speech, occupational, physical, and music therapy; diagnostic evaluations.", source: "https://beaminghealth.com/providers/myspot-greenbrier-chesapeake-va" }, // lat/lng is the street (OpenStreetMap)
    { id: "p28", baseId: "norfolk", areaId: "nf2", name: "MySpot - Kempsville", kind: "therapy", onBase: false, tricare: "accepted", address: "5151 Bonney Rd, Virginia Beach, VA 23462", phone: "(757) 222-1315", lat: 36.8294, lng: -76.1588, aba: true, categories: ["asd", "sli", "dd", "oi"], notes: "ABA, speech, occupational, physical, and music therapy; diagnostic evaluations.", source: "https://beaminghealth.com/providers/myspot-kempsville-virginia-beach-va" },
    { id: "p29", baseId: "norfolk", areaId: null, name: "The Planning Council (Navy EFMP Respite Care)", kind: "respite", onBase: false, tricare: "efmp", address: "2551 Eltham Ave, Suite I, Norfolk, VA 23513", phone: "(757) 622-9268", lat: 36.8781, lng: -76.2218, categories: ALL_CATEGORIES, notes: "Hires and trains respite caregivers for Navy and Air Force EFMP families in Hampton Roads. Eligibility goes through Child Care Aware: 1-800-424-2246 ext. 317.", source: "https://theplanningcouncil.org/military-family-respite-care/" },
    { id: "p30", baseId: "norfolk", areaId: null, name: "Virginia Dept. for the Blind and Vision Impaired - Norfolk Regional Office", kind: "state", onBase: false, tricare: "free", address: "6325 N Center Dr, Suite 131, Norfolk, VA 23502", phone: "(757) 466-4162", lat: 36.848, lng: -76.1894, categories: ["vi", "db"], notes: "State services for blind, vision impaired, and deafblind residents, including kids.", source: "https://www.dbvi.virginia.gov/staff.htm" },
    { id: "p32", baseId: "norfolk", areaId: null, name: "Sinkinson Dyslexia Foundation", kind: "therapy", onBase: false, tricare: "free", address: "3701 Pacific Ave, Suite 500, Virginia Beach, VA 23451", phone: "(757) 437-0733", lat: 36.865, lng: -75.9808, categories: ["sld"], notes: "Orton-Gillingham dyslexia tutoring, free for low to low-middle income families.", source: "https://sinkinsondyslexiafoundation.org/tutoring" }
];

// 6. Key contacts (who to call about what). baseId null = works for every base.
export const CONTACTS = [
    { id: "c1", baseId: "norfolk", group: "EFMP Office", name: "Fleet & Family Support Center Norfolk (EFMP)", address: "7928 14th St, Suite 102, Norfolk, VA 23505", phone: "(757) 444-2102", website: null, notes: "EFMP family support for Naval Station Norfolk.", source: "https://www.military.com/base-guide/hampton-roads-military-bases/contact/fleet--family-support-center/1231" },
    { id: "c2", baseId: "norfolk", group: "School Liaison Officer", name: "Naval Station Norfolk School Liaison Officer", address: "9475 Bacon Ave, Bldg C-9, Norfolk, VA 23511", phone: "(757) 445-0350", website: null, notes: "Help with school choice, IEP transfers, and enrollment.", source: "https://www.npsk12.com/departments/interagency-collaboration-and-wraparound-services/support-for-military-connected-students-and-families/naval-station-norfolk-school-liaison-officer-slo-program" },
    { id: "c3", baseId: "norfolk", group: "Medical", name: "Naval Medical Center Portsmouth", address: "620 John Paul Jones Cir, Portsmouth, VA 23708", phone: "(757) 953-5008", website: "https://portsmouth.tricare.mil", notes: "Main military hospital for the Norfolk area.", source: "https://www.tricare.mil/GettingCare/FindDoctor/MTF/Facilities/Naval-Medical-Center-Portsmouth" },
    { id: "c4", baseId: "norfolk", group: "Respite", name: "Navy EFMP Respite Care (Child Care Aware of America)", address: null, phone: "1 (800) 424-2246 ext. 317", website: null, notes: "Checks eligibility for Navy EFMP respite hours.", source: "https://theplanningcouncil.org/military-family-respite-care/" },
    { id: "c5", baseId: "norfolk", group: "Hearing", name: "Endependence Center (Deaf & Hard of Hearing Outreach)", address: "6300 E Virginia Beach Blvd, Norfolk, VA 23502", phone: "(757) 461-8007", website: "https://endependence.org/services/hearing-outreach/", notes: "State-funded deaf and hard of hearing outreach for Norfolk, Virginia Beach, Chesapeake, and Portsmouth. TTY (757) 461-7527.", source: "https://endependence.org/services/hearing-outreach/" },
    { id: "c6", baseId: null, group: "TRICARE", name: "TRICARE East Region (Humana Military)", address: null, phone: "1 (800) 444-5445", website: "https://www.humanamilitary.com", notes: "Enrollment changes, referrals, and authorizations (including ABA).", source: "https://tricare.mil/ContactUs/CallUs" },
    { id: "c7", baseId: null, group: "Support", name: "Military OneSource", address: null, phone: "1 (800) 342-9647", website: "https://www.militaryonesource.mil", notes: "24/7 support, including special needs and EFMP consultations.", source: "https://www.militaryonesource.mil/contact-us/" },
    { id: "c8", baseId: null, group: "Deaf-Blindness", name: "Virginia Deafblind Project (VCU)", address: null, phone: "1 (877) 295-7799", website: "https://vadeafblindproject.partnership.vcu.edu/", notes: "Statewide help for families of kids who are deafblind. Office line (804) 828-2052.", source: "https://www.nationaldb.org/state-deaf-blind-projects/va/" }
];

// 7. Checklist tasks. The Checklists tab builds each family's list from these.
// stage: "pre" (before the move) | "arrival" (first ~30 days) | "onboarding" (after you're settled)
// days: when it's due, counted from the PCS date (-60 = 60 days before, 14 = 2 weeks after)
// Only shows up when it matches the family:
//   plan: "Prime" | "Select"        efmp: "Enrolled" | "Pending" | "Not Enrolled"
//   respite: true (only if respite care matters to them, 3+ out of 5)
//   place: "public" | "private" | "provider" | "respite" | "aba" -- repeated for each chosen place of that kind
// topic: "efmp" | "school" | "medical" | "move" (place tasks are grouped under the place instead)
// details: shown when you tap a task to expand it.
// {child}, {base}, {mtf}, {efmpPhone}, {sloPhone}, {place} get filled in.
// source: where the rule or advice comes from (checked October 2026).
const SRC = {
    efmp: "https://ffr.cnic.navy.mil/Family-Readiness/Fleet-And-Family-Support-Program/Work-and-Family-Life/Exceptional-Family-Member-Program/EFMP-Enrollment-Process/",
    forms: "https://ffr.cnic.navy.mil/Portals/76/Family_Readiness/Documents/DD%20Form%202792%20Instructions.pdf",
    pcsGuide: "https://www.mynavyhr.navy.mil/Portals/55/Documents/MyNavy%20HR%20PCS%20Guide%202026.pdf",
    tricarePcs: "https://tricare.mil/FAQs/general/GEN_pcs",
    referrals: "https://www.dha.mil/News/2025/08/26/16/22/Unlock-Your-Health-by-Understanding-the-TRICARE-Prime-Referral-Process",
    compact: "https://www.militaryonesource.mil/education-employment/for-children-youth/interstate-compact-for-military-children/",
    iepMove: "https://militaryonesource.mil/special-needs/educational-needs/moving-with-an-individualized-education-program",
    iepLaw: "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-III/part-300/subpart-D/subject-group-ECFR28b07e67452ed7a/section-300.323",
    slo: "https://www.npsk12.com/departments/interagency-collaboration-and-wraparound-services/support-for-military-connected-students-and-families/naval-station-norfolk-school-liaison-officer-slo-program",
    autism: "https://www.tricare.mil/autism",
    respite: "https://theplanningcouncil.org/military-family-respite-care/"
};

export const CHECKLIST_TASKS = [
    // Every move
    { id: "efmp-update", topic: "efmp", stage: "pre", days: -90, efmp: "Enrolled", title: "Start updating {child}'s EFMP enrollment (the Navy says begin up to 12 months before a PCS)", source: SRC.efmp, details: "If your sponsor could PCS in the next 12 months, the Navy recommends updating EFMP enrollment now so screening for the new duty station isn't delayed. Your EFMP coordinator can tell you which forms need updating." },
    { id: "slo", topic: "school", stage: "pre", days: -60, title: "Contact the School Liaison Officer at {base} about schools and IEP services", source: SRC.slo, details: "School Liaison Officers help military families choose schools, transfer IEPs, and understand enrollment rules. The School Liaison Officer at {base}: {sloPhone}." },
    { id: "records", topic: "school", stage: "pre", days: -45, title: "Get copies of {child}'s school records, IEP or 504 plan, and latest evaluations to hand-carry", source: SRC.iepMove, details: "Military OneSource recommends bringing copies of your child's records, including the IEP or 504 plan, to the new school. The new school can use them until the official records arrive." },
    { id: "referrals", topic: "medical", stage: "pre", days: -30, title: "Call your TRICARE contractor to move active referrals to the new region (don't disenroll before you move)", source: SRC.tricarePcs, details: "TRICARE says not to disenroll before you move. Your coverage continues until your enrollment transfer is done. Call your current regional contractor before the move and ask them to send active referrals to the new region." },
    { id: "refills", topic: "medical", stage: "pre", days: -14, title: "Ask {child}'s doctors for enough prescription refills to get through the move", details: "Ask each prescriber how to get enough medication to cover the trip and your first weeks at the new base, before you have a new doctor there." },
    { id: "binder", topic: "move", stage: "pre", days: -7, title: "Pack a PCS binder to hand-carry: orders, medical and school records, EFMP forms", source: SRC.pcsGuide, details: "The MyNavy HR PCS Guide recommends a binder with orders, medical, dental, and school records, and EFMP forms that you carry with you instead of shipping." },
    { id: "deers", topic: "medical", stage: "arrival", days: 3, title: "Update your new home address in DEERS (milConnect or 1-800-538-9552)", source: SRC.tricarePcs, details: "Use your physical address, not a P.O. box. Updating DEERS doesn't transfer your TRICARE enrollment by itself, so do that step too." },
    { id: "efmp-checkin", topic: "efmp", stage: "arrival", days: 7, title: "Check in with the EFMP office at {base}: {efmpPhone}", source: SRC.efmp, details: "The Fleet & Family Support Center runs EFMP family support at {base}. They can connect you with local resources and respite care." },
    { id: "prime-transfer", topic: "medical", stage: "arrival", days: 14, plan: "Prime", title: "Transfer TRICARE Prime enrollment and pick a primary care manager at {mtf} (you have 90 days after the move)", source: SRC.tricarePcs, details: "TRICARE gives you 90 days from the move to update your enrollment. Call the regional contractor to transfer Prime and choose a new primary care manager." },
    { id: "select-network", topic: "medical", stage: "arrival", days: 14, plan: "Select", title: "Update TRICARE Select enrollment and find network providers near your new home (you have 90 days after the move)", source: SRC.tricarePcs, details: "TRICARE gives you 90 days from the move to update your enrollment. Network providers cost less with TRICARE Select than non-network ones." },
    { id: "iep-adopted", topic: "school", stage: "onboarding", days: 45, title: "Check that {child}'s new school has adopted the IEP or scheduled a new IEP meeting", source: SRC.iepLaw, details: "Under federal law (IDEA), the new school has to provide services comparable to the old IEP until it adopts that IEP or writes a new one, within a reasonable amount of time." },
    { id: "respite", topic: "efmp", stage: "onboarding", days: 60, respite: true, title: "Ask the EFMP office about Navy EFMP respite care hours", source: SRC.respite, details: "The Navy EFMP Respite Care Program gives eligible families respite care hours. Child Care Aware of America checks eligibility: 1-800-424-2246 ext. 317." },

    // EFMP still pending
    { id: "efmp-followup", topic: "efmp", stage: "pre", days: -75, efmp: "Pending", title: "Follow up with your EFMP coordinator on {child}'s pending enrollment", source: SRC.efmp, details: "Ask your EFMP coordinator what's still missing from the enrollment packet so it doesn't hold up the move." },
    { id: "efmp-forms-check", topic: "efmp", stage: "pre", days: -60, efmp: "Pending", title: "Make sure the doctor finished DD Form 2792 and the school finished DD Form 2792-1", source: SRC.forms, details: "A doctor fills out the medical sections of DD Form 2792, and the school fills out DD Form 2792-1. The 2792-1 needs a current IEP attached." },

    // Not enrolled in EFMP yet
    { id: "efmp-start", topic: "efmp", stage: "pre", days: -90, efmp: "Not Enrolled", title: "Ask your EFMP coordinator how to enroll {child}", source: SRC.efmp, details: "EFMP enrollment is how the Navy checks that your next duty station can support {child}'s needs. Your EFMP coordinator will walk you through the forms." },
    { id: "dd2792", topic: "efmp", stage: "pre", days: -75, efmp: "Not Enrolled", title: "Have {child}'s doctor fill out DD Form 2792 (medical summary)", source: SRC.forms, details: "You fill in the family information. A doctor, physician assistant, or nurse practitioner completes the medical sections." },
    { id: "dd2792-1", topic: "efmp", stage: "pre", days: -75, efmp: "Not Enrolled", title: "Have {child}'s school fill out DD Form 2792-1 and attach the current IEP", source: SRC.forms, details: "You fill in items 1 to 7. School or early intervention staff complete the rest. Attach a current IEP (or IFSP for younger kids)." },
    { id: "efmp-submit", topic: "efmp", stage: "pre", days: -60, efmp: "Not Enrolled", title: "Turn in the EFMP enrollment packet to your EFMP coordinator", source: SRC.efmp, details: "Turn in both forms to your EFMP coordinator. They'll tell you if anything else is needed." },

    // For each place they choose on the map
    { id: "send-school", stage: "pre", days: -21, place: "public", title: "Send {child}'s records and IEP to {place}", source: SRC.compact, details: "Ask the school how they want records sent, and keep your hand-carried copies." },
    { id: "enroll-public", stage: "arrival", days: 3, place: "public", title: "Enroll at {place} using your hand-carried records (the Interstate Compact allows this)", source: SRC.compact, details: "Under the Interstate Compact for military children, schools can enroll your child using unofficial, hand-carried records while the official ones are on the way." },
    { id: "comparable", stage: "onboarding", days: 30, place: "public", title: "Ask {place} how they'll provide services comparable to the current IEP until a new one is in place", source: SRC.iepLaw, details: "Under federal law (IDEA), the school has to provide services comparable to the current IEP until it adopts that IEP or writes a new one." },
    { id: "private-ask", stage: "pre", days: -60, place: "private", title: "Ask {place} what support they can offer (private schools don't have to follow IEPs)", source: SRC.iepMove, details: "Private schools don't have to follow IEPs. Ask what accommodations and support they offer before you apply." },
    { id: "private-apply", stage: "pre", days: -45, place: "private", title: "Ask {place} about applications, tuition, and a visit day", details: "Ask about application deadlines, tuition, and whether they offer a visit or shadow day." },
    { id: "send-private", stage: "pre", days: -21, place: "private", title: "Send {child}'s records to {place}", details: "Ask the school which records they need for the application." },
    { id: "provider-call", stage: "pre", days: -30, place: "provider", title: "Call {place}: ask if they're taking new patients and how long the wait is", details: "Ask whether they accept your TRICARE plan, if they're taking new patients, and how long the wait is for a first visit." },
    { id: "send-provider", stage: "pre", days: -21, place: "provider", title: "Send records packet to {place}", details: "Ask which records they need before the first visit, like evaluations, care plans, and a medication list." },
    { id: "provider-referral", stage: "arrival", days: 10, place: "provider", plan: "Prime", title: "Make sure a referral is on file for {place} (Prime needs referrals for specialty care)", source: SRC.referrals, details: "TRICARE Prime needs a referral from your primary care manager for most specialty care. Referrals from your old region can be moved over before you PCS." },
    { id: "aba-referral", stage: "pre", days: -30, place: "aba", title: "For ABA at {place}: ask {child}'s diagnosing provider for an Autism Care Demonstration referral (renewed every 2 years)", source: SRC.autism, details: "TRICARE's Autism Care Demonstration needs a referral from the provider who diagnosed autism. A new referral is needed every 2 years, and ABA is approved 6 months at a time." },
    { id: "respite-call", stage: "pre", days: -45, place: "respite", title: "Call {place} about Navy EFMP respite care (eligibility: Child Care Aware, 1-800-424-2246 ext. 317)", source: SRC.respite, details: "The Planning Council hires and trains respite caregivers for Navy and Air Force EFMP families in Hampton Roads." }
];
