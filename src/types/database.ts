export type RolUsuario = "ADMIN" | "MOZO" | "COCINA" | "BARRA" | "CAJA";

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
  created_at: string;
}

export type EstadoMesa = "LIBRE" | "OCUPADA" | "CUENTA_PEDIDA";

export interface Mesa {
  id: string;
  numero: number;
  estado: EstadoMesa;
  created_at: string;
}

export type DestinoProducto = "COCINA" | "BARRA";

export interface Categoria {
  id: string;
  nombre: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_id: string | null;
  precio: number;
  destino: DestinoProducto;
  activo: boolean;
}

export type EstadoPedido =
  | "ABIERTO"
  | "EN_PREPARACION"
  | "CUENTA_PEDIDA"
  | "CERRADO"
  | "CANCELADO";

export type TipoPedido = "MESA" | "LLEVAR";

export interface Pedido {
  id: string;
  mesa_id: string | null;
  mozo_id: string | null;
  estado: EstadoPedido;
  creado_en: string;
  cerrado_en: string | null;
  tipo_pedido: TipoPedido;
  cliente_nombre: string | null;
}

export interface PedidoParaLlevar {
  id: string;
  estado: EstadoPedido;
  creado_en: string;
  cliente_nombre: string | null;
}

export type EstadoItem = "PENDIENTE" | "EN_PREPARACION" | "LISTO" | "ENTREGADO";

export interface ItemPedido {
  id: string;
  pedido_id: string;
  producto_id: string;
  cantidad: number;
  notas: string | null;
  estado: EstadoItem;
  destino: DestinoProducto;
}

export interface ItemPedidoConProducto extends ItemPedido {
  productos: Producto;
}

export interface ItemPedidoParaCola extends ItemPedido {
  productos: Producto;
  pedidos: Pedido & { mesas: Pick<Mesa, "numero"> | null };
}

export type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

export interface Pago {
  id: string;
  pedido_id: string;
  monto: number;
  metodo_pago: MetodoPago;
  fecha: string;
  turno_id: string | null;
}

export interface PagoConDetalle extends Pago {
  pedidos:
    | (Pedido & {
        mesas: Pick<Mesa, "numero"> | null;
        items_pedido: ItemPedidoConProducto[];
      })
    | null;
}

export interface PedidoParaCaja extends Pedido {
  mesas: Pick<Mesa, "id" | "numero"> | null;
  items_pedido: ItemPedidoConProducto[];
}

export interface ProductoConCategoria extends Producto {
  categorias: Pick<Categoria, "nombre"> | null;
}

export type EstadoTurno = "ABIERTO" | "CERRADO";

export interface TurnoCaja {
  id: string;
  usuario_id: string;
  estado: EstadoTurno;
  monto_inicial: number;
  abierto_en: string;
  cerrado_en: string | null;
  total_efectivo: number | null;
  total_tarjeta: number | null;
  total_transferencia: number | null;
}

export interface TurnoCajaConUsuario extends TurnoCaja {
  usuarios: Pick<Usuario, "nombre"> | null;
}

export interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  created_at: string;
}

export interface RecetaItem {
  id: string;
  producto_id: string;
  insumo_id: string;
  cantidad: number;
}

export interface RecetaItemConInsumo extends RecetaItem {
  insumos: Pick<Insumo, "nombre" | "unidad">;
}

export interface ProductoConReceta extends ProductoConCategoria {
  receta_items: RecetaItemConInsumo[];
}

/** A qué ruta se redirige a cada rol después de loguearse. */
export const RUTA_POR_ROL: Record<RolUsuario, string> = {
  ADMIN: "/admin",
  MOZO: "/mozo",
  COCINA: "/cocina",
  BARRA: "/barra",
  CAJA: "/caja",
};
