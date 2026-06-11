/**
 * es el contexto global del carrito de compras
 * funciona en dos modos segun si el usuario esta autenticado 
 * sin session lee y escribe en asyncStorage (carrito local)
 * con session lee y escribe en el backend via api rest
 * al iniciar sesion funciona automaticamente el carrito local al backend para que el usuario
 * no pierda sesion productos agregados sin cuenta
 * expone items totales y las acciones: agregar, cambiar cantidad, eliminar, limpiar 
 */

import { createContext , useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from './AuthContext';
import carritoService from '../services/carritoService';

const CarritoContext = createContext();

export function CarritoProvider({ children }) {
    // lee isAuthenticated e isLoadingSession del contexto de autenticacion
    const { isAuthenticated, isLoadingSession } = useAuth();

    // estado del carrito
    const [items, setItems] = useState([]); // lista de productos en el carrito
    const [totalItems, setTotalItems] = useState(0); // suma de cantidades
    const [total, setTotal] = useState(0); //precio total del carrito
    const [loading, setLoading] = useState(true); //true mientras carga el carrito

    //rastrea si el usuario estaba autenticado en el render anterior para detectar en el momento exacto de inicio de sesion
    const prevAuthenticated = useRef(false);

    /**
     * hydrate
     * carga o recarga el carrito desde el otro origen correcto local o backend
     * se llama al montar el provider y despues de cada operacion de escritura
     */

    const hydrate = useCallback(async () => {
        // espera a que authcontext termine de restaurar la sesion guardada
        if (isLoadingSession) {
            return;
        }
        /**
         * funsion al iniciar sesion 
         * si el usuario acaba de iniciar sesion de false a true
         * sube los items de carrito local al backend antes de leerlo
         * asi no se pierden los productos agregados sin cuenta
         */

        if (isAuthenticated && !prevAuthenticated.current) {
            try {
                await carritoService.mergeLocalToBackend();
            } catch {
                // si la funcion falla continua sin bloquear
            }
        }

        //actualiza la referencia para el proximo render
        prevAuthenticated.current = isAuthenticated;


        setLoading(true);
        try {
            //getCarrito decide internamente si consulta el backend o asyncStorage
            const snapshot = await carritoService.getCarrito(isAuthenticated);
            setItems(snapshot.items ?? []);
            setTotalItems(snapshot.totalItems ?? 0);
            setTotal(snapshot.total ?? 0);
        } catch {
            // si falla muestra carrito vacio sin productos
            setItems([]);
            setTotalItems(0);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isLoadingSession]);

    // se ejecuta cada vez que cambia isAuthenticated o isLoadingSession 
    useEffect(() => {
        hydrate();
    }, [hydrate]);

    // Polling: recarga el carrito periódicamente para reflejar cambios externos
    // (por ejemplo peticiones hechas desde Postman). Llama a `hydrate()` cada 10s.
    useEffect(() => {
        const intervalId = setInterval(() => {
            hydrate();
        }, 10000); // 10000ms = 10s

        return () => clearInterval(intervalId);
    }, [hydrate]);

    /** @
     * agregar producto
     * agregar producto al carrito (local o backend) y recarga el estado 
     */

    const agregarProducto = useCallback(
        async (producto, cantidad = 1) => {
            await carritoService.addToCarrito({
                isAuthenticated, producto, cantidad
            });
            await hydrate();
        }, 
        [hydrate, isAuthenticated]
    );

    /**
     * cambiar cantidad
     * modifica la cantidad de un item ya existente en el carrito
     */
    const cambiarCantidad = useCallback(
        async (itemId, cantidad) => {
            await carritoService.updateCantidad({
                isAuthenticated, itemId, cantidad });
            await hydrate();
        },
        [hydrate, isAuthenticated]
    );

    /**
     * elimina un item por su id
     */

    const eliminarItem = useCallback(
        async (itemId) => {
            await carritoService.removeItem({
                isAuthenticated, itemId });
            await hydrate();
        },
        [hydrate, isAuthenticated]
    );

    /**
     * vaciar carrito
     * elimina todos los items del carrito de una vez
     */

    const vaciarCarrito = useCallback(async () => {
        await carritoService.clearCarrito(isAuthenticated);
        await hydrate();
    }, [hydrate, isAuthenticated]);

    /** useMemo evita recrear el objeto en cada render innecesario */
    const value = useMemo(
        () => ({
            items, //array de items normalizados
            totalItems, //cantidad totoal de unidades
            total, //precio total del carrito
            loading, //true mientras se carga
            refreshCarrito: hydrate, //permite forzar una recarga manual
            agregarProducto,
            cambiarCantidad,
            eliminarItem,
            vaciarCarrito,
        }),
        [items, totalItems, total, loading, hydrate, agregarProducto, cambiarCantidad, eliminarItem, vaciarCarrito]
    );

    return <CarritoContext.Provider value={value}>
        {children}</CarritoContext.Provider>;  
}

/**
 * HOOk
 * simplifica acceso al contexto y lanza un error descriptivo si se usa fuera del arbol de carrito CarritoProvider
 */

export function useCarrito() {
    const context = useContext(CarritoContext);
    if (!context) {
        throw new Error ('useCarrito debe usarse dentro de un CarritoProvider');
    }

    return context;
}

