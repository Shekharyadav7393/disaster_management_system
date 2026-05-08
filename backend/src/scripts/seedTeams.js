/**
 * Seed script: Creates rescue teams near major Indian cities with phone numbers.
 * Run: node src/scripts/seedTeams.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';

dotenv.config();

const TEAMS = [
  {
    name: "Alpha Rescue Unit",
    capacity: 8,
    status: "AVAILABLE",
    memberCount: 5,
    memberNames: ["Capt. Rajesh Kumar", "Priya Sharma", "Vikram Singh", "Anita Verma", "Deepak Yadav"],
    memberPhones: ["+91-9876543210", "+91-9876543211", "+91-9876543212", "+91-9876543213", "+91-9876543214"],
    leadPhone: "+91-9876543210",
    currentLocation: { type: "Point", coordinates: [80.9462, 26.8467] } // Lucknow
  },
  {
    name: "Bravo Fire Response",
    capacity: 6,
    status: "AVAILABLE",
    memberCount: 4,
    memberNames: ["Lt. Suresh Patel", "Kavita Mishra", "Rohit Gupta", "Neha Pandey"],
    memberPhones: ["+91-9988776601", "+91-9988776602", "+91-9988776603", "+91-9988776604"],
    leadPhone: "+91-9988776601",
    currentLocation: { type: "Point", coordinates: [80.9100, 26.9500] } // Near Lucknow
  },
  {
    name: "Charlie Medical Squad",
    capacity: 10,
    status: "AVAILABLE",
    memberCount: 6,
    memberNames: ["Dr. Amit Joshi", "Dr. Sunita Das", "Ravi Tiwari", "Meena Agarwal", "Sanjay Dubey", "Pooja Saxena"],
    memberPhones: ["+91-9112233401", "+91-9112233402", "+91-9112233403", "+91-9112233404", "+91-9112233405", "+91-9112233406"],
    leadPhone: "+91-9112233401",
    currentLocation: { type: "Point", coordinates: [77.2090, 28.6139] } // Delhi
  },
  {
    name: "Delta Flood Unit",
    capacity: 12,
    status: "AVAILABLE",
    memberCount: 7,
    memberNames: ["Cmdr. Arun Nair", "Sneha Reddy", "Manoj Pillai", "Geeta Kumari", "Karan Malhotra", "Divya Chauhan", "Ajay Rana"],
    memberPhones: ["+91-8800112201", "+91-8800112202", "+91-8800112203", "+91-8800112204", "+91-8800112205", "+91-8800112206", "+91-8800112207"],
    leadPhone: "+91-8800112201",
    currentLocation: { type: "Point", coordinates: [72.8777, 19.0760] } // Mumbai
  },
  {
    name: "Echo SAR Team",
    capacity: 8,
    status: "AVAILABLE",
    memberCount: 5,
    memberNames: ["Sgt. Vinod Chauhan", "Rekha Bhatia", "Pankaj Srivastava", "Shweta Jain", "Nitin Rawat"],
    memberPhones: ["+91-7700998801", "+91-7700998802", "+91-7700998803", "+91-7700998804", "+91-7700998805"],
    leadPhone: "+91-7700998801",
    currentLocation: { type: "Point", coordinates: [80.3319, 26.4499] } // Kanpur
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/disaster_management_system');
    console.log("[SEED] Connected to MongoDB");

    await Team.deleteMany({});
    console.log("[SEED] Cleared existing teams");

    const result = await Team.insertMany(TEAMS);
    console.log(`[SEED] ✅ Inserted ${result.length} rescue teams:`);
    result.forEach(t => console.log(`  🚐 ${t.name} (${t.memberCount} members) Lead: ${t.leadPhone}`));

    await Team.collection.createIndex({ currentLocation: '2dsphere' });
    console.log("[SEED] ✅ 2dsphere index created");

    process.exit(0);
  } catch (err) {
    console.error("[SEED] Error:", err.message);
    process.exit(1);
  }
}

seed();
