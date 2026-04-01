import pool from '../config/database.js';

const createLeadsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombres VARCHAR(255) NOT NULL,
      apellidos VARCHAR(255) NOT NULL,
      cedula VARCHAR(20) NOT NULL UNIQUE,
      ciudad_residencia VARCHAR(255) NOT NULL,
      area_titulo VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      celular VARCHAR(20) NOT NULL,
      como_contactarnos VARCHAR(255) NOT NULL,
      aceptar_privacidad BOOLEAN DEFAULT false,
      programa_interes VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
    CREATE INDEX IF NOT EXISTS idx_leads_cedula ON leads(cedula);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
  `;

  try {
    const client = await pool.connect();
    await client.query(query);
    client.release();
    console.log('✓ Tabla leads creada correctamente');
  } catch (err) {
    console.error('Error creando tabla:', err);
    throw err;
  }
};

export default createLeadsTable;
