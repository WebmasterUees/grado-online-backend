import createLeadsTable from './createLeadsTable.js';

const runMigrations = async () => {
  try {
    console.log('🔄 Ejecutando migraciones...');
    await createLeadsTable();
    console.log('✅ Migraciones completadas');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en migraciones:', err);
    process.exit(1);
  }
};

runMigrations();
