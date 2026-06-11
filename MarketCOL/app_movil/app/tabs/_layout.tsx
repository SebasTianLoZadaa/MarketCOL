/**
 * Define la barra de navegacion inferior (tab bar) de app
 * expo router usa este archivo como el contenedor de todas las pantallas que viven de la carpeta (tabs)
 */

//tabs componente de expo router que genera la barra de pestañas inferior
import { Tabs } from 'expo-router';
//react necesario para q JSX funcione correctamente
import React from 'react';
//hapticTab version personalizada del boton de la pestaña que agrega vibracion tactil (haptic feddback) al precionar el tab
import { HapticTab } from '../../components/haptic-tab';
//IconoSymbols componente que muestra iconos SF Symbols IOS y material de android
import { IconSymbol } from '../../components/ui/icon-symbol';
// colors objetos de colores del tema de app modo claro y oscuro
import { getThemeColor } from '../../constants/theme';
// useColorShema hook que detecta si el dispositivo está en modo claro u oscuro
import { useColorScheme } from '../../hooks/use-color-scheme';

// TabLayout componente principal que configura toda la barra de navegacion
//expo Router lo exporta como default y lo monta automaticamente 
export default function TabLayout() {
    //ColorShema valor 'light' o 'dark' segun la preferencia del sistema
    const colorSheme = useColorScheme();
    const isDark = colorSheme === 'dark';

    return (
        // tabs renderiza la barra de pestañas inferior y gestiona que la pantalla este activa en cada momento
        <Tabs
            screenOptions={{
                //tabbarActiveTintColor color del icono y texto de la pestaña activa
                tabBarActiveTintColor: getThemeColor('tint', isDark),
                //headerShown false oculta el encabezado superior en todas las pantallas 
                headerShown: false,
                //tabBarButton remplaza el boton estandar por hapticTab con vibracion
                tabBarButton: HapticTab,
            }}>

            {/** pestaña 1 tienda
             * name=index -> apunta al archivo /index.tsx (pantalla principal)
             */}
            <Tabs.Screen
                name="index"
                options={{
                    // texto que aparece debajo del icono de la barra
                    title: 'Tienda Adso',
                    //tabBarIcon funcion q recibe el color activo o incativo y devuelve el icono
                    //house.fill = icono de casa rellena (representa e icono de la tienda)
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color}/>,
                }}
                />

                {/** pestaña 2 carrito
             * name=carrito -> apunta al archivo /carrito.tsx 
             */}
            <Tabs.Screen
                name="carrito"
                options={{
                    // texto que aparece debajo del icono de la barra
                    title: 'Carrito',
                    //tabBarIcon funcion q recibe el color activo o incativo y devuelve el icono
                    //house.fill = icono de casa rellena (representa e icono de la tienda)
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color}/>,
                }}
                />

                {/** pestaña 3 cuenta
             * name=explore -> apunta al archivo /explore.tsx 
             */}
            <Tabs.Screen
                name="explore"
                options={{
                    // texto que aparece debajo del icono de la barra
                    title: 'Cuenta',
                    //tabBarIcon funcion q recibe el color activo o incativo y devuelve el icono
                    //house.fill = icono de casa rellena (representa e icono de la tienda)
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color}/>,
                }}
                />


            </Tabs>
    )
}