import { DevolucionProducto } from '../models/index.js';

const devolucionProductosService = {
    // Aquí irían otras funciones del servicio como crear o buscar...

    /**
     * Elimina una devolución y sus items asociados.
     * @param {number} id - El ID de la devolución a eliminar (DevolucionId).
     */
    async deleteDevolucion(id) {
        // Buscamos la devolución por su clave primaria.
        const devolucion = await DevolucionProducto.findByPk(id);

        if (!devolucion) {
            // Si no se encuentra, lanzamos un error que el controlador capturará.
            throw new Error('DEVOLUCION_NO_ENCONTRADA');
        }

        // Opcional: Si tienes items asociados en otra tabla (ej: DevolucionProductoItem),
        // también deberías eliminarlos para mantener la integridad de la base de datos.
        // await DevolucionProductoItem.destroy({ where: { devolucionId: id } });

        // Si se encuentra, la eliminamos.
        // Sequelize usará soft-delete si 'paranoid: true' está en tu modelo.
        await devolucion.destroy();

        return { message: 'Devolución eliminada con éxito.' };
    }
};

export default devolucionProductosService;