#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

// ---- WiFi Credentials ----
#define WIFI_SSID "JioFiber-106"
#define WIFI_PASSWORD "9687968569#"

// ---- Firebase Credentials ----
#define FIREBASE_HOST "iiot-bb042-default-rtdb.firebaseio.com"   // without https://
#define FIREBASE_AUTH "IxR84eLvCbrjqvyrEI3thyBIksN8UtPOQL5bY9NH"                     // found in Firebase > Project Settings > Service Accounts > Database Secret

// ---- Create Firebase & WiFi objects ----
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// ---- Ultrasonic Sensor Pins ----
#define TRIG1 D5
#define ECHO1 D6
#define TRIG2 D7
#define ECHO2 D8

// ---- Threshold Distance (cm) ----
#define OCCUPIED_DIST 15  // distance less than this = occupied

void setup() {
  Serial.begin(115200);

  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Wi-Fi connected!");
  Serial.print("IP: "); Serial.println(WiFi.localIP());

  // Firebase setup
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// Function to read distance from HC-SR04
long readDistanceCM(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  long distance = duration * 0.034 / 2;
  if (distance == 0) distance = 999; // if no echo, treat as free
  return distance;
}

void loop() {
  // Read distances
  long dist1 = readDistanceCM(TRIG1, ECHO1);
  long dist2 = readDistanceCM(TRIG2, ECHO2);

  int slot1 = (dist1 < OCCUPIED_DIST) ? 1 : 0; // 1 = Occupied, 0 = Free
  int slot2 = (dist2 < OCCUPIED_DIST) ? 1 : 0;

  Serial.printf("Slot1: %s (%ld cm) | Slot2: %s (%ld cm)\n",
                slot1 ? "Occupied" : "Free", dist1,
                slot2 ? "Occupied" : "Free", dist2);

  // Push to Firebase
  if (Firebase.setInt(firebaseData, "/Current/slot1", slot1)) {
    Serial.println("✅ Slot1 updated");
  } else {
    Serial.println("❌ Slot1 Error: " + firebaseData.errorReason());
  }

  if (Firebase.setInt(firebaseData, "/Current/slot2", slot2)) {
    Serial.println("✅ Slot2 updated");
  } else {
    Serial.println("❌ Slot2 Error: " + firebaseData.errorReason());
  }

  // Use millis() as timestamp
  unsigned long timestamp = millis() / 1000;
  Firebase.setInt(firebaseData, "/Current/timestamp", timestamp);

  delay(1000); // Update every 5 seconds
}





// #include <ESP8266WiFi.h>

// #define WIFI_SSID "JioFiber-106"
// #define WIFI_PASSWORD "9687968569#"

// void setup() {
//   Serial.begin(115200);
//   delay(1000);

//   Serial.println();
//   Serial.println("🔹 Connecting to Wi-Fi...");

//   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

//   int retryCount = 0;
//   while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
//     delay(500);
//     Serial.print(".");
//     retryCount++;
//   }

//   if (WiFi.status() == WL_CONNECTED) {
//     Serial.println("\n✅ Wi-Fi Connected Successfully!");
//     Serial.print("📶 SSID: ");
//     Serial.println(WiFi.SSID());
//     Serial.print("🌐 IP Address: ");
//     Serial.println(WiFi.localIP());
//     Serial.print("📡 Signal Strength (RSSI): ");
//     Serial.print(WiFi.RSSI());
//     Serial.println(" dBm");
//   } else {
//     Serial.println("\n❌ Failed to connect to Wi-Fi!");
//   }
// }

// void loop() {
//   // Monitor connection status
//   if (WiFi.status() != WL_CONNECTED) {
//     Serial.println("⚠️ Wi-Fi Disconnected! Trying to reconnect...");
//     WiFi.disconnect();
//     WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
//     int retryCount = 0;
//     while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
//       delay(500);
//       Serial.print(".");
//       retryCount++;
//     }

//     if (WiFi.status() == WL_CONNECTED) {
//       Serial.println("\n✅ Reconnected Successfully!");
//       Serial.print("🌐 New IP: ");
//       Serial.println(WiFi.localIP());
//     } else {
//       Serial.println("\n❌ Still not connected!");
//     }
//   }

//   delay(5000); // Check every 5 seconds
// }
