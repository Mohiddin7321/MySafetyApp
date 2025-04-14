const firebaseConfig = {
  apiKey: "AIzaSyBdG9kA4lBH4Edjw-nI9i4FuvXHwvLbvQQ",
  authDomain: "map-safety-app.firebaseapp.com",
  projectId: "map-safety-app",
  storageBucket: "map-safety-app.firebasestorage.app",
  messagingSenderId: "178491555595",
  appId: "1:178491555595:web:3022738d7dd7c4be766c0e",
  measurementId: "G-05JRJ8SDYK"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let map;


function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 13,
  });

  // Load saved locations
  db.collection("locations").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const marker = new google.maps.Marker({
        position: { lat: data.lat, lng: data.lng },
        map: map,
        icon: data.safe
          ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
      });
  
      const infoWindow = new google.maps.InfoWindow({
        content: `<strong>${data.safe ? "Safe" : "Unsafe"} Location</strong><br>${data.comment || "No comment"}`
      });
  
      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  });
  map.addListener("click", (e) => {
    placeMarker(e.latLng);
  });
  
  loadTips();
}

function placeMarker(location) {
  const isSafe = confirm("Mark this location as SAFE?\nClick Cancel for UNSAFE.");
  
  // Ask for a comment
  const comment = prompt("Add a comment for this location (optional):");
  if (comment === null) return; // user pressed "Cancel" in prompt

  // Create marker
  const marker = new google.maps.Marker({
    position: location,
    map: map,
    icon: isSafe
      ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
  });

  // Add info window with comment
  const infoWindow = new google.maps.InfoWindow({
    content: `<strong>${isSafe ? "Safe" : "Unsafe"} Location</strong><br>${comment || "No comment"}`
  });

  marker.addListener("click", () => {
    infoWindow.open(map, marker);
  });

  // Save data
  saveToFirebase(location, isSafe, comment);
  loadTips();
}


function saveToFirebase(location, isSafe, comment) {
  db.collection("locations").add({
    lat: location.lat(),
    lng: location.lng(),
    safe: !!isSafe,
    comment: comment || "",
    timestamp: new Date()
  }).then(() => {
    console.log("Location saved!");
  }).catch((error) => {
    console.error("Error saving to Firebase:", error);
  });
}


function submitTip() {
  const tip = document.getElementById("tipText").value;
  if (!tip.trim()) return alert("Please enter a tip.");
  db.collection("tips").add({
    tip: tip,
    timestamp: new Date()
  });
  document.getElementById("tipText").value = "";
  alert("Tip submitted. Thank you!");
  loadTips();
}

function panic() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    alert(`Panic alert! Your location: https://maps.google.com/?q=${latitude},${longitude}`);

    // You can integrate EmailJS or Twilio here to send an SMS or email
  });
}

function loadTips() {
const tipsList = document.getElementById("tipsList");
tipsList.innerHTML = ""; // Clear old tips

db.collection("tips")
  .orderBy("timestamp", "desc")
  .limit(10) // Show latest 10 tips
  .get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = data.tip;
      tipsList.appendChild(li);
    });
  })
  .catch((error) => {
    console.error("Error fetching tips:", error);
  });
}
