// database for map info, disabilities, etc.

// 1. Create the bases -- update with more bases in the VB area and use GS
const BASES = [
    {
        id: "norfolk", name: "Naval Station Norfolk, VA",
        lat: 36.950, lng: -76.333,
        mtf: "Naval Medical Center Portsmouth",
        mtfphone: "(757) 318-4000",
        efmpoffice: "Naval Station Norfolk EFMP, Personnel Office",
        efmpphone: "(757) 318-4000",
        efmpnote: "Update EFMP enrollment within 30 days of arrival."
    }
];

// 2. Create the categories -- update with more categories as needed -- these are just the federally recognized categories of disabilities for children in the US
const CATEGORIES = [
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

// 3. These are the areas they will live in -- need A LOT per base, but for now just a few to get started.  Each area has an id, a baseId (which base it belongs to), a name, and lat/lng coordinates for the center of the area.  The lat/lng coordinates are used to center the map on that area when the user selects it.  The id is used to link the area to the base and to the schools in that area.  The name is used to display the area name in the UI.
const AREAS = [
    { id: "nf1", baseId: "norfolk", name: "Ghent (Norfolk)", lat: 36.862, lng: -76.297 },
    { id: "nf2", baseId: "norfolk", name: "Kempsville (Virginia Beach)", lat: 36.8, lng: -76.17 },
    { id: "nf3", baseId: "norfolk", name: "Greenbrier (Chesapeake)", lat: 36.777, lng: -76.24 },
    { id: "nf4", baseId: "norfolk", name: "Ocean View (Norfolk)", lat: 36.941, lng: -76.253 },
];

// 4. These are the schools per area
const SCHOOLS = [
    { id: "s11", baseId: "norfolk", name: "Maury High School", type: "public", lat: 36.863, lng: -76.295, grades: "9-12", categories: ["sld", "ohi", "sli", "ed"], notes: "Norfolk Public Schools special education services." },
    { id: "s12", baseId: "norfolk", name: "Norfolk Collegiate", type: "private", lat: 36.88, lng: -76.26, grades: "K-12", categories: ["sld"], notes: "Academic support center." },
    { id: "s13", baseId: "norfolk", name: "Kempsville Elementary", type: "public", lat: 36.803, lng: -76.175, grades: "K-5", categories: ["asd", "dd", "sli", "sld", "oi"], notes: "VB Schools inclusion model; accessible campus." },
    { id: "s14", baseId: "norfolk", name: "Chesapeake Bay Academy", type: "private", lat: 36.84, lng: -76.19, grades: "K-12", categories: ["sld", "asd", "ohi", "sli"], notes: "Entire school dedicated to students who learn differently." },
    { id: "s15", baseId: "norfolk", name: "Greenbrier Intermediate", type: "public", lat: 36.775, lng: -76.235, grades: "3-5", categories: ["asd", "id", "md", "vi", "hi"], notes: "Regional sensory-impairment services." }
];

// 5. Providers, the doctors and hospitals and stuff
const PROVIDERS = [
    { id: "p11", baseId: "norfolk", name: "Naval Medical Center Portsmouth", kind: "hospital", onBase: true, prime: true, select: true, lat: 36.848, lng: -76.303, categories: ["ohi", "oi", "tbi", "md", "hi", "vi"], notes: "Regional MTF, developmental peds dept." },
    { id: "p12", baseId: "norfolk", name: "CHKD Children's Hospital", kind: "hospital", onBase: false, prime: true, select: true, lat: 36.862, lng: -76.302, categories: ["ohi", "oi", "tbi", "md", "hi", "vi", "db", "asd", "dd"], notes: "Only freestanding children's hospital in Virginia." },
    { id: "p13", baseId: "norfolk", name: "Tidewater Speech & Language", kind: "therapy", onBase: false, prime: false, select: true, lat: 36.8, lng: -76.18, categories: ["sli", "hi", "dd"], notes: "Pediatric speech; AAC evaluations." },
    { id: "p14", baseId: "norfolk", name: "Hampton Roads ABA Partners", kind: "therapy", onBase: false, prime: true, select: true, lat: 36.78, lng: -76.24, categories: ["asd"], notes: "ABA; school-collaboration program." },
    { id: "p15", baseId: "norfolk", name: "Bayview Developmental Pediatrics", kind: "doctor", onBase: false, prime: false, select: true, lat: 36.94, lng: -76.26, categories: ["dd", "asd", "id", "ed", "ohi"], notes: "Developmental evaluations; ~8 week wait (sample)." }
];

// 6. These are checklists specific to the area / disability / etc
const CHECKLISTS = {
    everyMove: {
        title: "Every PCS — do these no matter where you live",
        items: [
            "Update {child}'s EFMP enrollment at {base} within 30 days of arrival",
            "Hand-carry (do not ship) the IEP/504 plan, latest evaluations, and medical records",
            "Request records transfer from the current school district in writing",
            "Contact the School Liaison Officer at {base} before choosing a school",
            "If TRICARE Prime: transfer enrollment region and pick a PCM at {mtf}",
            "If TRICARE Select: confirm specialty referrals are still authorized in the new region",
            "Refill all prescriptions for 90 days before the move"
        ]
    },
    publicSchool: {
        title: "Enrolling in a public school (IEP transfer)",
        items: [
            "Submit proof of residence + military orders (districts must enroll immediately under the Interstate Compact)",
            "Provide the current IEP, the new school must give comparable services while it reviews",
            "Request an IEP transfer meeting within the first 30 days",
            "Ask whether {child}'s programs are at this campus or a regional site"
        ]
    },
    privateSchool: {
        title: "Applying to a private school",
        items: [
            "Ask directly what accommodations they can and cannot provide (private schools are not bound by IDEA)",
            "Submit application + records release form",
            "Schedule a shadow day / interview for {child}",
            "Ask about military tuition assistance or state scholarship programs"
        ]
    },
    therapy: {
        title: "Applying to a therapy provider",
        items: [
            "Get a referral from the PCM (required for Prime; smart for Select)",
            "If ABA: confirm TRICARE Autism Care Demonstration enrollment and a diagnosis letter within 2 years",
            "Send the provider intro PDF from your profile",
            "Ask to join the waitlist NOW, good clinics run 4 to 12 weeks out",
            "Confirm the provider is in network for your plan before the first visit"
        ]
    },
    doctorHospital: {
        title: "Setting up medical care",
        items: [
            "Register {child} at the hospital's pediatric records office",
            "Transfer specialty referrals through the new regional TRICARE contractor",
            "Book the developmental pediatrician early — they book out farthest",
            "Ask the EFMP office which specialists other families use"
        ]
    }
};
