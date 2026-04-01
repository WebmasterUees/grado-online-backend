import express from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
} from '../controllers/leadsController.js';
import { requireAdminApiKey } from '../middleware/auth.js';

const router = express.Router();

// POST - Crear nuevo lead
router.post('/', createLead);

// GET - Obtener todos los leads
router.get('/', requireAdminApiKey, getLeads);

// GET - Obtener un lead por ID
router.get('/:id', requireAdminApiKey, getLeadById);

// PUT - Actualizar un lead
router.put('/:id', requireAdminApiKey, updateLead);

// DELETE - Eliminar un lead
router.delete('/:id', requireAdminApiKey, deleteLead);

export default router;
