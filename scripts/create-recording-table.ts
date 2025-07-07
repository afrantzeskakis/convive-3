import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createRecordingTable() {
  try {
    console.log('Creating AI Voice Call Logs table...');
    
    // Create AI Voice Call Logs table first (since call_recordings references it)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_voice_call_logs (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        contact_id INTEGER NOT NULL REFERENCES restaurant_contacts(id), 
        session_id INTEGER NOT NULL REFERENCES restaurants(id),
        call_status TEXT NOT NULL,
        reservation_status TEXT,
        call_duration INTEGER,
        reservation_confirmation_code TEXT,
        reservation_details JSONB,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        error_message TEXT
      );
    `);
    
    console.log('Creating Call Recordings table...');
    
    // Create Call Recordings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS call_recordings (
        id SERIAL PRIMARY KEY,
        call_log_id INTEGER NOT NULL REFERENCES ai_voice_call_logs(id),
        recording_url TEXT,
        recording_duration INTEGER,
        recording_format TEXT DEFAULT 'mp3',
        transcription_status TEXT DEFAULT 'pending',
        transcription_text TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Call Recordings table created successfully!');
  } catch (error) {
    console.error('Error creating Call Recordings table:', error);
  } finally {
    process.exit(0);
  }
}

createRecordingTable();