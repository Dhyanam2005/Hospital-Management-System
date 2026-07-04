'use strict';

const db = require('./config/db');

// ---------------------------------------------------------------------------
// Steps run sequentially via the run() chain below.
// Each entry: [sqlString, labelString]
// ---------------------------------------------------------------------------
const steps = [
  // ── 1. TOKEN_COUNTER_MASTER ──────────────────────────────────────────────
  [
    `CREATE TABLE IF NOT EXISTS TOKEN_COUNTER_MASTER (
      COUNTER_ID           INT           AUTO_INCREMENT PRIMARY KEY,
      COUNTER_CODE         VARCHAR(20)   NOT NULL UNIQUE,
      COUNTER_NAME         VARCHAR(100)  NOT NULL,
      DEPARTMENT_ID        INT,
      DOCTOR_ID            INT           NULL,
      TOKEN_PREFIX         VARCHAR(10)   NOT NULL,
      CURRENT_TOKEN_NO     INT           NOT NULL DEFAULT 0,
      AVG_CONSULT_TIME_MIN INT           NOT NULL DEFAULT 10,
      STATUS               ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      CREATED_BY           INT,
      CREATED_DATE         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UPDATED_BY           INT,
      UPDATED_DATE         DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    'Create TABLE TOKEN_COUNTER_MASTER'
  ],

  // ── 2. PATIENT_QUEUE ─────────────────────────────────────────────────────
  [
    `CREATE TABLE IF NOT EXISTS PATIENT_QUEUE (
      QUEUE_ID       BIGINT   AUTO_INCREMENT PRIMARY KEY,
      TOKEN_NO       VARCHAR(20),
      TOKEN_DATE     DATE,
      COUNTER_ID     INT,
      PATIENT_ID     INT,
      REG_ID         INT,
      APPOINTMENT_ID INT      NULL,
      DOCTOR_ID      INT,
      DEPARTMENT_ID  INT,
      QUEUE_STATUS   ENUM('WAITING','CALLED','WITH_DOCTOR','COMPLETED',
                          'SKIPPED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'WAITING',
      GENERATED_TIME DATETIME,
      CALLED_TIME    DATETIME,
      START_TIME     DATETIME,
      END_TIME       DATETIME,
      EST_WAIT_MIN   INT,
      CREATED_BY     INT,
      CREATED_DATE   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token_date   (TOKEN_DATE),
      INDEX idx_counter_id   (COUNTER_ID),
      INDEX idx_doctor_id    (DOCTOR_ID),
      INDEX idx_patient_id   (PATIENT_ID),
      INDEX idx_queue_status (QUEUE_STATUS),
      CONSTRAINT fk_pq_counter FOREIGN KEY (COUNTER_ID)
        REFERENCES TOKEN_COUNTER_MASTER(COUNTER_ID),
      CONSTRAINT fk_pq_patient FOREIGN KEY (PATIENT_ID)
        REFERENCES patient(patient_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    'Create TABLE PATIENT_QUEUE'
  ],

  // ── 3. Menu M507 — Queue Management under Doctor (M005) ─────────────────
  [
    `INSERT IGNORE INTO MENU_MASTER
       (MENU_ID, MENU_TYPE, MENU_CODE, MENU_NAME, MENU_URL, PARENT_MENU_ID, DISPLAY_ORDER, STATUS)
     VALUES ('M507','MENU','QUEUE_MGMT','Queue Management','/queue-management','M005',
       (SELECT COALESCE(MAX(DISPLAY_ORDER),0)+1 FROM (SELECT DISPLAY_ORDER FROM MENU_MASTER WHERE PARENT_MENU_ID='M005') t),
       'ACTIVE')`,
    'Insert MENU M507 (Queue Management under Doctor M005)'
  ],

  // ── 4. RMM for M507 — role R005 ──────────────────────────────────────────
  [
    `INSERT INTO rmm_role_menu_mapping (RMM_ID, ROLE_ID, MENU_ID, STATUS)
     SELECT CONCAT('RMM', LPAD(
              COALESCE(MAX(CAST(SUBSTRING(RMM_ID, 4) AS UNSIGNED)), 0) + 1,
              4, '0')),
            'R005', 'M507', 'ACTIVE'
     FROM rmm_role_menu_mapping`,
    'Insert RMM mapping — M507 / R005'
  ],

  // ── 5. Menu M110 — Queue Management under Reports (M007) ─────────────────
  [
    `INSERT IGNORE INTO MENU_MASTER
       (MENU_ID, MENU_TYPE, MENU_CODE, MENU_NAME, MENU_URL, PARENT_MENU_ID, DISPLAY_ORDER, STATUS)
     VALUES ('M110','MENU','QUEUE_RPT','Queue Management','/queue-management','M007',
       (SELECT COALESCE(MAX(DISPLAY_ORDER),0)+1 FROM (SELECT DISPLAY_ORDER FROM MENU_MASTER WHERE PARENT_MENU_ID='M007') t),
       'ACTIVE')`,
    'Insert MENU M110 (Queue Management under Reports M007)'
  ],

  // ── 6. RMM for M110 — role R005 ──────────────────────────────────────────
  [
    `INSERT INTO rmm_role_menu_mapping (RMM_ID, ROLE_ID, MENU_ID, STATUS)
     SELECT CONCAT('RMM', LPAD(
              COALESCE(MAX(CAST(SUBSTRING(RMM_ID, 4) AS UNSIGNED)), 0) + 1,
              4, '0')),
            'R005', 'M110', 'ACTIVE'
     FROM rmm_role_menu_mapping`,
    'Insert RMM mapping — M110 / R005'
  ]
];

// ---------------------------------------------------------------------------
// Sequential executor — mirrors the working pattern in the project
// ---------------------------------------------------------------------------
function run(i) {
  if (i >= steps.length) {
    console.log('\nAll done. Queue & Token Management module setup complete.');
    process.exit(0);
  }

  const [sql, label] = steps[i];

  db.query(sql, (err, result) => {
    if (err) {
      console.error(`\n[FAILED] Step ${i + 1} — ${label}`);
      console.error('  Error:', err.message);
      process.exit(1);
    }

    const affected = result && result.affectedRows !== undefined
      ? `  (affectedRows: ${result.affectedRows})`
      : '';
    console.log(`[OK]  Step ${i + 1} — ${label}${affected}`);
    run(i + 1);
  });
}

console.log('=== Queue & Token Management — Database Setup ===\n');
run(0);
