import { Pool } from "pg";

// Validate DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error(
    "❌ ERROR: DATABASE_URL environment variable is not set. Cannot connect to database.",
  );
  console.error(
    "Please ensure DATABASE_URL is configured in your environment variables.",
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Connection pool settings for better reliability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
});

pool.on("connect", () => {
  console.log("✅ New database connection established");
});

pool.on("remove", () => {
  console.log("📊 Database connection removed from pool");
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error("❌ Database query error", {
      text,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    throw error;
  }
}

export async function getClient() {
  return pool.connect();
}

export async function initializeDatabase() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS restok_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        low_stock INTEGER NOT NULL,
        note TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS restok_sub_items (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL REFERENCES restok_items(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        low_stock INTEGER NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      -- Ensure low_stock column exists in restok_sub_items (migration)
      ALTER TABLE IF EXISTS restok_sub_items ADD COLUMN IF NOT EXISTS low_stock INTEGER NOT NULL DEFAULT 0;

      -- Ensure order_index column exists in restok_items (migration)
      ALTER TABLE IF EXISTS restok_items ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS job_works (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS machine_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        letter TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS path_steps (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        machine_type TEXT,
        external_unit_name TEXT,
        status TEXT NOT NULL,
        active_machines INTEGER NOT NULL DEFAULT 0,
        quantity_done INTEGER NOT NULL DEFAULT 0,
        step_index INTEGER NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS work_orders (
        id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        current_step_index INTEGER NOT NULL,
        parent_id TEXT
      );

      CREATE TABLE IF NOT EXISTS job_work_assignments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        job_work_id TEXT NOT NULL REFERENCES job_works(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        pickup_date BIGINT NOT NULL,
        completion_date BIGINT,
        status TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS parallel_machine_groups (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
        step_index INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS parallel_group_machines (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL REFERENCES parallel_machine_groups(id) ON DELETE CASCADE,
        machine_index INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS roadmaps (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS roadmap_items (
        id TEXT PRIMARY KEY,
        roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
        model_id TEXT NOT NULL,
        model_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        added_at BIGINT NOT NULL,
        item_index INTEGER NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_restok_sub_items_item_id ON restok_sub_items(item_id);
      CREATE INDEX IF NOT EXISTS idx_path_steps_order_id ON path_steps(order_id);
      CREATE INDEX IF NOT EXISTS idx_job_work_assignments_order_id ON job_work_assignments(order_id);
      CREATE INDEX IF NOT EXISTS idx_parallel_machine_groups_order_id ON parallel_machine_groups(order_id);
      CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap_id ON roadmap_items(roadmap_id);
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database", error);
    throw error;
  }
}
