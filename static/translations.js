const translations = {

    en: {

        dashboard:
            "Dashboard",

        profile:
            "Profile",

        requests:
            "Requests",

        chat:
            "Chat",

        logout:
            "Logout",

        available:
            "Available for Donation",

        search:
            "Search",

        find_heroes:
            "Find Blood Heroes",

        welcome:
            "Welcome back",

        your_profile:
            "Your Profile",

        full_name:
            "Full Name",

        blood_group:
            "Blood Group",

        city:
            "City",

        pincode:
            "Pincode",

        availability:
            "Availability Status",

        save_changes:
            "Save Changes",

        language:
            "Language",

        recent_life_savers:
            "Recent Life Savers",

        available_heroes:
            "Available Heroes",

        no_recent_activity:
            "No recent donor activity.",

        no_available_heroes:
            "No available heroes yet.",

        no_donors:
            "No donors found.",

        placeholder_blood:
            "e.g. O+, A-",

        placeholder_city:
            "Partial city name",

        placeholder_pincode:
            "e.g. 560001",
        unable_chat:
            "Unable to start chat.",
        availability_failed:
            "Failed to update availability",

        something_wrong:
            "Something went wrong",
        availability_updated:
            "Availability updated",
        emergency_requests:
            "Emergency Blood Requests",

        history:
            "History",

        home:
            "Home",

        patient_name:
            "Patient Name",

        select_blood_group:
            "Select Blood Group",

        units_required:
            "Units Required",

        hospital_name:
            "Hospital Name",

        contact_phone:
            "Contact Phone",

        create_request:
            "Create Request",

        no_requests:
            "No Requests Found",

        units:
            "Units",

        hospital:
            "Hospital",

        phone:
            "Phone",

        status:
            "Status",

        created:
            "Created",

        resolve_request:
            "Resolve Request",

        fill_all_fields:
            "Please fill all fields",

        phone_validation:
            "Phone number must be 10 digits",

        request_created:
            "Request Created Successfully",

        server_error:
            "Server error",

        enter_donor_name:
            "Enter donor/helper name exactly as registered.",

        resolved_success:
            "Request Resolved Successfully",

        failed_resolve:
            "Failed to resolve request",

        failed:
            "Failed"
    },

    te: {

        dashboard:
            "డాష్‌బోర్డ్",

        profile:
            "ప్రొఫైల్",

        requests:
            "రక్త అభ్యర్థనలు",

        chat:
            "చాట్",

        logout:
            "లాగౌట్",

        available:
            "రక్తదానానికి అందుబాటులో",

        search:
            "వెతకండి",

        find_heroes:
            "రక్త వీరులను కనుగొనండి",

        welcome:
            "తిరిగి స్వాగతం",

        your_profile:
            "మీ ప్రొఫైల్",

        full_name:
            "పూర్తి పేరు",

        blood_group:
            "రక్త గ్రూప్",

        city:
            "నగరం",

        pincode:
            "పిన్ కోడ్",

        availability:
            "అందుబాటు స్థితి",

        save_changes:
            "మార్పులను సేవ్ చేయండి",

        language:
            "భాష",

        recent_life_savers:
            "ఇటీవలి రక్త వీరులు",

        available_heroes:
            "అందుబాటులో ఉన్న వీరులు",

        no_recent_activity:
            "ఇటీవలి దాతల కార్యకలాపాలు లేవు.",

        no_available_heroes:
            "అందుబాటులో ఉన్న వీరులు లేరు.",

        no_donors:
            "దాతలు కనబడలేదు.",

        placeholder_blood:
            "ఉదా: O+, A-",

        placeholder_city:
            "నగరం పేరు నమోదు చేయండి",

        placeholder_pincode:
            "ఉదా: 560001",

        unable_chat:
            "చాట్ ప్రారంభించలేకపోయాం.",

        availability_failed:
            "అందుబాటు స్థితి అప్డేట్ కాలేదు",

        something_wrong:
            "ఏదో తప్పు జరిగింది",

        availability_updated:
            "అందుబాటు స్థితి అప్డేట్ అయింది",
        emergency_requests:
            "అత్యవసర రక్త అభ్యర్థనలు",
        history:
            "చరిత్ర",

        home:
            "హోమ్",

        patient_name:
            "రోగి పేరు",

        select_blood_group:
            "రక్త గ్రూప్ ఎంచుకోండి",

        units_required:
            "అవసరమైన యూనిట్లు",

        hospital_name:
            "హాస్పిటల్ పేరు",

        contact_phone:
            "సంప్రదింపు ఫోన్",

        create_request:
            "అభ్యర్థన సృష్టించండి",

        no_requests:
            "ఎటువంటి అభ్యర్థనలు లేవు",

        units:
            "యూనిట్లు",

        hospital:
            "హాస్పిటల్",

        phone:
            "ఫోన్",

        status:
            "స్థితి",

        created:
            "సృష్టించిన సమయం",

        resolve_request:
            "అభ్యర్థన పరిష్కరించండి",

        fill_all_fields:
            "అన్ని వివరాలు నమోదు చేయండి",

        phone_validation:
            "ఫోన్ నంబర్ 10 అంకెలు ఉండాలి",

        request_created:
            "అభ్యర్థన విజయవంతంగా సృష్టించబడింది",

        server_error:
            "సర్వర్ లో లోపం వచ్చింది",

        enter_donor_name:
            "సహాయం చేసిన వ్యక్తి పేరు నమోదు చేయండి",

        resolved_success:
            "అభ్యర్థన విజయవంతంగా పరిష్కరించబడింది",

        failed_resolve:
            "అభ్యర్థన పరిష్కరించలేకపోయాం",

        failed:
            "విఫలమైంది"
    }
};

function applyTranslations(){

    const lang =
        localStorage.getItem(
            "language"
        ) || "en";

    document
    .querySelectorAll(
        "[data-translate]"
    )
    .forEach(el => {

        const key =
            el.getAttribute(
                "data-translate"
            );

        if(
            translations[lang] &&
            translations[lang][key]
        ){

            el.innerText =
                translations[lang][key];
        }
    });

    document
    .querySelectorAll(
        "[data-placeholder]"
    )
    .forEach(el => {

        const key =
            el.getAttribute(
                "data-placeholder"
            );

        if(
            translations[lang] &&
            translations[lang][key]
        ){

            el.placeholder =
                translations[lang][key];
        }
    });
}

window.addEventListener(
    "DOMContentLoaded",
    applyTranslations
);

function t(key){

    const lang =
        localStorage.getItem(
            "language"
        ) || "en";

    return (
        translations[lang]?.[key]
        || key
    );
}
/* =========================
   ADMIN REQUEST STATS
========================= */

.admin-stats-grid{

  width: 92%;

  margin: 28px auto;

  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(180px, 1fr));

  gap: 18px;
}

.admin-stat-card{

  border-radius: 22px;

  padding: 24px 16px;

  text-align: center;

  color: white;

  box-shadow:
    0 8px 24px rgba(0,0,0,0.25);
}

.admin-stat-card h2{

  font-size: 38px;

  font-weight: 800;

  margin-bottom: 8px;
}

.admin-stat-card p{

  font-size: 17px;

  font-weight: 600;
}

/* TOTAL */

.admin-stat-card{

  background: #2563eb;
}

/* PENDING */

.pending-card{

  background: #facc15;

  color: #111827;
}

/* RESOLVED */

.resolved-card{

  background: #22c55e;
}

/* EXPIRED */

.expired-card{

  background: #ef4444;
}