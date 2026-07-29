// js making a local database -- no need for a real database for this app, just a local database in the browser
// real apps never store data like this, but for this app it's fine -- the data is not sensitive and it's just a demo
// "in the future we will deploy in app store and have a real working backend"

function loadUsers() {
    return JSON.parse(localStorage.getItem("bc-users") || "{}");
}

function saveUsers(users) {
    localStorage.setItem("bc-users", JSON.stringify(users));
}

// not going to put preferences here -- too much in one place -- going to spread it out into another part of the app
function blankProfile() {
    return {
        parentName: "", childName: "", dob: "", grade: "", phone: "", email: "",
        baseId: "norfolk",
        insurance: "prime", // "prime" or "select"
        categories: [], // IDEA category ids
        medicalHistory: "", careTeam: "", communication: "",
        sensory: "", physical: "", scheduling: ""
    };
}

function signUp(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) return "Enter a username and a password.";
    const users = loadUsers();
    if (users[username]) return "That username is already taken.";
    users[username] = { password: password, profile: blankProfile() };
    saveUsers(users);
    return "";
}

function logIn(username, password) {
    username = username.trim().toLowerCase();
    const users = loadUsers();
    if (!users[username]) return "No account with that username.";
    if (users[username].password !== password) return "Wrong password.";
    localStorage.setItem("bc-current", username);
    return "";
}

function logOut() {
    localStorage.removeItem("bc-current");
}

function currentUser() {
    return localStorage.getItem("bc-current") || null;
}

function loadProfile() {
    const users = loadUsers();
    const name = currentUser();
    if (!name || !users[name]) return blankProfile();
    return Object.assign(blankProfile(), users[name].profile);
}

function saveProfile(profile) {
    const users = loadUsers();
    const name = currentUser();
    if (!name || !users[name]) return;
    users[name].profile = profile;
    saveUsers(users);
}

