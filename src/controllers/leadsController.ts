import { Request, Response } from 'express';
import pool from '../config/database.js';
import validator from 'validator';
import { v4 as uuidv4 } from 'uuid';

const sanitizeLeadField = (field: string, value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = validator.trim(value);
  if (trimmed.length === 0) {
    return null;
  }

  switch (field) {
    case 'nombres':
    case 'apellidos':
    case 'ciudad_residencia':
    case 'como_contactarnos':
    case 'programa_interes':
      return validator.escape(trimmed);
    case 'email': {
      if (!validator.isEmail(trimmed)) {
        return null;
      }
      return validator.normalizeEmail(trimmed) || null;
    }
    case 'celular':
      return trimmed;
    default:
      return null;
  }
};

const validateLeadId = (id: string): boolean => validator.isUUID(id);

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nombres,
      apellidos,
      cedula,
      ciudad_residencia,
      area_titulo,
      email,
      celular,
      como_contactarnos,
      aceptar_privacidad,
      programa_interes,
    } = req.body;

    // Validaciones
    if (!nombres || !apellidos || !cedula || !ciudad_residencia || !area_titulo || !email || !celular || !como_contactarnos) {
      res.status(400).json({
        success: false,
        message: 'Todos los campos requeridos deben ser completados',
      });
      return;
    }

    // Validar email
    if (!validator.isEmail(email)) {
      res.status(400).json({
        success: false,
        message: 'El email no es válido',
      });
      return;
    }

    // Validar que acepte privacidad
    if (!aceptar_privacidad) {
      res.status(400).json({
        success: false,
        message: 'Debes aceptar la política de privacidad',
      });
      return;
    }

    // Sanitizar inputs
    const sanitizedData = {
      id: uuidv4(),
      nombres: validator.trim(validator.escape(nombres)),
      apellidos: validator.trim(validator.escape(apellidos)),
      cedula: validator.trim(cedula),
      ciudad_residencia: validator.trim(validator.escape(ciudad_residencia)),
      area_titulo: validator.trim(validator.escape(area_titulo)),
      email: validator.normalizeEmail(email),
      celular: validator.trim(celular),
      como_contactarnos: validator.trim(validator.escape(como_contactarnos)),
      aceptar_privacidad: true,
      programa_interes: programa_interes ? validator.trim(validator.escape(programa_interes)) : null,
    };

    const query = `
      INSERT INTO leads (
        id,
        nombres,
        apellidos,
        cedula,
        ciudad_residencia,
        area_titulo,
        email,
        celular,
        como_contactarnos,
        aceptar_privacidad,
        programa_interes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const values = [
      sanitizedData.id,
      sanitizedData.nombres,
      sanitizedData.apellidos,
      sanitizedData.cedula,
      sanitizedData.ciudad_residencia,
      sanitizedData.area_titulo,
      sanitizedData.email,
      sanitizedData.celular,
      sanitizedData.como_contactarnos,
      sanitizedData.aceptar_privacidad,
      sanitizedData.programa_interes,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Lead creado correctamente',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creando lead:', error);

    // Manejar error de cédula duplicada
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        message: 'Ya existe un registro con esta cédula',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = 'SELECT * FROM leads ORDER BY created_at DESC;';
    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('Error obteniendo leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los leads',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!validateLeadId(id)) {
      res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
      return;
    }

    const query = 'SELECT * FROM leads WHERE id = $1;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Lead no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error obteniendo lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el lead',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!validateLeadId(id)) {
      res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
      return;
    }

    const updates = req.body;

    // Construir query dinámicamente
    const allowedFields = ['nombres', 'apellidos', 'ciudad_residencia', 'email', 'celular', 'como_contactarnos', 'programa_interes'];
    const updateFields: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    for (const field of allowedFields) {
      if (field in updates) {
        const sanitizedValue = sanitizeLeadField(field, updates[field]);
        if (sanitizedValue === null) {
          res.status(400).json({
            success: false,
            message: `El campo ${field} no es válido`,
          });
          return;
        }

        updateFields.push(`${field} = $${valueIndex}`);
        values.push(sanitizedValue);
        valueIndex++;
      }
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
      });
      return;
    }

    updateFields.push(`updated_at = $${valueIndex}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE leads
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Lead no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lead actualizado correctamente',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error actualizando lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el lead',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!validateLeadId(id)) {
      res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
      return;
    }

    const query = 'DELETE FROM leads WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Lead no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lead eliminado correctamente',
    });
  } catch (error: any) {
    console.error('Error eliminando lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el lead',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
