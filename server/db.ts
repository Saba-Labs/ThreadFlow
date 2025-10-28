import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Database query error", { text, error });
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

      CREATE INDEX IF NOT EXISTS idx_restok_sub_items_item_id ON restok_sub_items(item_id);
      CREATE INDEX IF NOT EXISTS idx_path_steps_order_id ON path_steps(order_id);
      CREATE INDEX IF NOT EXISTS idx_job_work_assignments_order_id ON job_work_assignments(order_id);
      CREATE INDEX IF NOT EXISTS idx_parallel_machine_groups_order_id ON parallel_machine_groups(order_id);
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database", error);
    throw error;
  }
}
