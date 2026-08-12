/**
 * Pantalla de cuenta pestaña 3 tiene 2 metodos
 * no autenticado muestra formulario de login y registro
 * autenticado muestra perfil de usuario con opciones de editar datos
 * acceder al panel admin/aux ver pedidos segun rol
 */

import { useState } from 'react';

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '../../src/context/AuthContext';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

type AuthCtx = {
    user: { nombre?: string, email?: string, rol?: string } | null;
    isAuthenticated: boolean;
    isLoadingSession: boolean;
    login: (email: string, password: string) => Promise<unknown>;
    register: (data: {
        nombre: string,
        apellido: string,
        cedula: string,
        email: string,
        password: string,
        telefono?: string,
        direccion?: string
    }) => Promise<unknown>;
    logout: () => Promise<void>;
    updatePerfil: (data: {
        nombre?: string,
        email?: string,
        password?: string
    }) => Promise<unknown>;
};

const routerPush = (path: string) =>
    (router as unknown as { push: (p: string) => void }).push(path);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function TabTwoScreen() {
    const {
        user,
        isAuthenticated,
        logout,
        login,
        register,
        isLoadingSession,
        updatePerfil
    } = useAuth() as AuthCtx;

    // Estados del formulario de login y registro
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [cedula, setCedula] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Estados de edición de perfil
    const [editMode, setEditMode] = useState(false);
    const [editNombre, setEditNombre] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [savingPerfil, setSavingPerfil] = useState(false);
    const [perfilError, setPerfilError] = useState('');
    const [perfilSuccess, setPerfilSuccess] = useState('');

    const resetFeedback = () => {
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleLogout = async () => {
        await logout();

        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setNombre('');
        setApellido('');
        setCedula('');
        setTelefono('');
        setDireccion('');
        setIsRegisterMode(false);
        setErrorMessage('');
        setSuccessMessage('');
    };

    // ── VALIDACIONES ─────────────────────────────────────────────────────────

    const validateRegister = () => {
        if (!nombre || !apellido || !cedula || !email || !password || !confirmPassword) {
            setErrorMessage('Completa todos los campos obligatorios *. ');
            return false;
        }

        if (!/^\d{6,20}$/.test(cedula)) {
            setErrorMessage('La cédula debe tener solo números y mínimo 6 dígitos');
            return false;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden');
            return false;
        }

        if (password.length < 6) {
            setErrorMessage('La contraseña debe tener al menos 6 caracteres');
            return false;
        }

        if (telefono && !/^3\d{9}$/.test(telefono)) {
            setErrorMessage('Telefono invalido: 10 digitos iniciando con 3');
            return false;
        }

        return true;
    };

    const validateLogin = () => {
        if (!email || !password) {
            setErrorMessage('Ingresa tu correo y contraseña');
            return false;
        }

        return true;
    };

    // ── REGISTRO ─────────────────────────────────────────────────────────────

    const handleRegister = async () => {
        await register({
            nombre,
            apellido,
            cedula,
            email,
            password,
            ...(telefono ? { telefono } : {}),
            ...(direccion ? { direccion } : {}),
        });

        setSuccessMessage('Registro exitoso! Ahora inicia sesion');
        setIsRegisterMode(false);

        setPassword('');
        setConfirmPassword('');
        setNombre('');
        setApellido('');
        setCedula('');
        setTelefono('');
        setDireccion('');
    };

    // ── LOGIN ─────────────────────────────────────────────────────────────────

    const handleLogin = async () => {
        await login(email, password);
        setSuccessMessage('Sesion iniciada correctamente');
    };

    // ── ENVÍO DEL FORMULARIO ──────────────────────────────────────────────────

    const handleSubmit = async () => {
        resetFeedback();

        const isValid = isRegisterMode
            ? validateRegister()
            : validateLogin();

        if (!isValid) {
            return;
        }

        setLoadingSubmit(true);

        try {
            if (isRegisterMode) {
                await handleRegister();
            } else {
                await handleLogin();
            }
        } catch (error: unknown) {
            setErrorMessage(
                (error as { message?: string })?.message ||
                'No fue posible completar la accion'
            );
        } finally {
            setLoadingSubmit(false);
        }
    };

    // ── ACTUALIZAR PERFIL ────────────────────────────────────────────────────

    const handleGuardarPerfil = async () => {
        setPerfilError('');
        setPerfilSuccess('');

        if (!editNombre.trim() && !editEmail.trim() && !editPassword.trim()) {
            setPerfilError('Modifica al menos un campo');
            return;
        }

        setSavingPerfil(true);

        try {
            const data: {
                nombre?: string;
                email?: string;
                password?: string;
            } = {};

            if (editNombre.trim()) {
                data.nombre = editNombre.trim();
            }

            if (editEmail.trim()) {
                data.email = editEmail.trim();
            }

            if (editPassword.trim()) {
                data.password = editPassword.trim();
            }

            await updatePerfil(data);

            setPerfilSuccess('perfil actualizado correctamente');
            setEditMode(false);

            setEditNombre('');
            setEditEmail('');
            setEditPassword('');
        } catch (error: unknown) {
            setPerfilError(
                (error as { message?: string })?.message ||
                'no fue posible actualizar el perfil'
            );
        } finally {
            setSavingPerfil(false);
        }
    };

    // ── RENDER PRINCIPAL ─────────────────────────────────────────────────────

    if (isLoadingSession) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return (
            <AuthForm
                isRegisterMode={isRegisterMode}
                setIsRegisterMode={setIsRegisterMode}
                nombre={nombre}
                setNombre={setNombre}
                apellido={apellido}
                setApellido={setApellido}
                cedula={cedula}
                setCedula={setCedula}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                telefono={telefono}
                setTelefono={setTelefono}
                direccion={direccion}
                setDireccion={setDireccion}
                loadingSubmit={loadingSubmit}
                errorMessage={errorMessage}
                successMessage={successMessage}
                handleSubmit={handleSubmit}
                resetFeedback={resetFeedback}
            />
        );
    }

    return (
        <ProfileView
            user={user}
            editMode={editMode}
            setEditMode={setEditMode}
            editNombre={editNombre}
            setEditNombre={setEditNombre}
            editEmail={editEmail}
            setEditEmail={setEditEmail}
            editPassword={editPassword}
            setEditPassword={setEditPassword}
            savingPerfil={savingPerfil}
            perfilError={perfilError}
            perfilSuccess={perfilSuccess}
            setPerfilError={setPerfilError}
            setPerfilSuccess={setPerfilSuccess}
            handleGuardarPerfil={handleGuardarPerfil}
            handleLogout={handleLogout}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA DE CARGA
// ─────────────────────────────────────────────────────────────────────────────

function LoadingScreen() {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <ThemedText>Cargando sesion...</ThemedText>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMULARIO LOGIN / REGISTRO
// ─────────────────────────────────────────────────────────────────────────────

type AuthFormProps = {
    isRegisterMode: boolean;
    setIsRegisterMode: React.Dispatch<React.SetStateAction<boolean>>;

    nombre: string;
    setNombre: React.Dispatch<React.SetStateAction<string>>;

    apellido: string;
    setApellido: React.Dispatch<React.SetStateAction<string>>;

    cedula: string;
    setCedula: React.Dispatch<React.SetStateAction<string>>;

    email: string;
    setEmail: React.Dispatch<React.SetStateAction<string>>;

    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;

    confirmPassword: string;
    setConfirmPassword: React.Dispatch<React.SetStateAction<string>>;

    telefono: string;
    setTelefono: React.Dispatch<React.SetStateAction<string>>;

    direccion: string;
    setDireccion: React.Dispatch<React.SetStateAction<string>>;

    loadingSubmit: boolean;
    errorMessage: string;
    successMessage: string;

    handleSubmit: () => Promise<void>;
    resetFeedback: () => void;
};

function AuthForm({
    isRegisterMode,
    setIsRegisterMode,
    nombre,
    setNombre,
    apellido,
    setApellido,
    cedula,
    setCedula,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    telefono,
    setTelefono,
    direccion,
    setDireccion,
    loadingSubmit,
    errorMessage,
    successMessage,
    handleSubmit,
    resetFeedback
}: AuthFormProps, Readonly) {
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ThemedView style={styles.formCard}>

                <ThemedText type="title">
                    {isRegisterMode ? 'Registro' : 'Iniciar sesion'}
                </ThemedText>

                {isRegisterMode ? (
                    <>
                        <TextInput
                            placeholder="Nombre *"
                            value={nombre}
                            onChangeText={setNombre}
                            style={styles.input}
                        />

                        <TextInput
                            placeholder="Apellido *"
                            value={apellido}
                            onChangeText={setApellido}
                            style={styles.input}
                        />

                        <TextInput
                            placeholder="Cédula *"
                            keyboardType="numeric"
                            value={cedula}
                            onChangeText={setCedula}
                            maxLength={20}
                            style={styles.input}
                        />
                    </>
                ) : null}

                <TextInput
                    placeholder="Correo *"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                />

                <TextInput
                    placeholder="Contrasena *"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                />

                {isRegisterMode ? (
                    <>
                        <TextInput
                            placeholder="Confirmar contrasena *"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            style={styles.input}
                        />

                        <TextInput
                            placeholder="Telefono (ej: 3001234567)"
                            keyboardType="phone-pad"
                            value={telefono}
                            onChangeText={setTelefono}
                            maxLength={10}
                            style={styles.input}
                        />

                        <TextInput
                            placeholder="Direccion"
                            value={direccion}
                            onChangeText={setDireccion}
                            style={styles.input}
                        />
                    </>
                ) : null}

                {errorMessage ? (
                    <ThemedText style={styles.error}>
                        {errorMessage}
                    </ThemedText>
                ) : null}

                {successMessage ? (
                    <ThemedText style={styles.success}>
                        {successMessage}
                    </ThemedText>
                ) : null}

                <Pressable
                    style={styles.primaryButton}
                    onPress={handleSubmit}
                    disabled={loadingSubmit}
                >
                    {loadingSubmit ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.primaryButtonText}>
                            {isRegisterMode ? 'Crear cuenta' : 'Entrar'}
                        </Text>
                    )}
                </Pressable>

                <Pressable
                    onPress={() => {
                        resetFeedback();
                        setIsRegisterMode((prev) => !prev);
                    }}
                >
                    <ThemedText type="link">
                        {isRegisterMode
                            ? 'Ya tengo cuenta, iniciar sesion'
                            : 'No tengo cuenta, registrarme'}
                    </ThemedText>
                </Pressable>

            </ThemedView>
        </KeyboardAvoidingView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFIL
// ─────────────────────────────────────────────────────────────────────────────

type ProfileViewProps = {
    user: AuthCtx['user'];

    editMode: boolean;
    setEditMode: React.Dispatch<React.SetStateAction<boolean>>;

    editNombre: string;
    setEditNombre: React.Dispatch<React.SetStateAction<string>>;

    editEmail: string;
    setEditEmail: React.Dispatch<React.SetStateAction<string>>;

    editPassword: string;
    setEditPassword: React.Dispatch<React.SetStateAction<string>>;

    savingPerfil: boolean;
    perfilError: string;
    perfilSuccess: string;

    setPerfilError: React.Dispatch<React.SetStateAction<string>>;
    setPerfilSuccess: React.Dispatch<React.SetStateAction<string>>;

    handleGuardarPerfil: () => Promise<void>;
    handleLogout: () => Promise<void>;
};

function ProfileView({
    user,
    editMode,
    setEditMode,
    editNombre,
    setEditNombre,
    editEmail,
    setEditEmail,
    editPassword,
    setEditPassword,
    savingPerfil,
    perfilError,
    perfilSuccess,
    setPerfilError,
    setPerfilSuccess,
    handleGuardarPerfil,
    handleLogout
}: ProfileViewProps, Readonly) {
    const rolColor = (r?: string) => {
        switch (r) {
            case 'administrador':
                return '#F44444';
            case 'auxiliar':
                return '#06b6d4';
            default:
                return '#10b981';
        }
    };

    const rolLabel = (r?: string) => {
        switch (r) {
            case 'administrador':
                return 'Administrador';
            case 'auxiliar':
                return 'Auxiliar';
            default:
                return 'Cliente';
        }
    };

    const rolIcon = (r?: string): keyof typeof Ionicons.glyphMap => {
        switch (r) {
            case 'administrador':
                return 'shield-checkmark';
            case 'auxiliar':
                return 'construct';
            default:
                return 'person';
        }
    };

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
        >

            {/* ENCABEZADO DE PERFIL */}

            <View
                style={[
                    styles.profileHeader,
                    { backgroundColor: rolColor(user?.rol) }
                ]}
            >
                <View style={styles.avatarCircle}>
                    <Ionicons
                        name={rolIcon(user?.rol)}
                        size={40}
                        color={rolColor(user?.rol)}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>
                        {user?.nombre || 'Usuario'}
                    </Text>

                    <Text style={styles.profileEmail}>
                        {user?.email || '-'}
                    </Text>

                    <View style={styles.roleBadge}>
                        <Ionicons
                            name={rolIcon(user?.rol)}
                            size={12}
                            color="#fff"
                        />

                        <Text style={styles.roleBadgeText}>
                            {rolLabel(user?.rol)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* MENSAJE DE ÉXITO */}

            {perfilSuccess ? (
                <View style={styles.successBanner}>
                    <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10b981"
                    />

                    <Text style={styles.successText}>
                        {perfilSuccess}
                    </Text>
                </View>
            ) : null}

            {/* EDICIÓN DE PERFIL */}

            {editMode ? (
                <EditProfileForm
                    user={user}
                    editNombre={editNombre}
                    setEditNombre={setEditNombre}
                    editEmail={editEmail}
                    setEditEmail={setEditEmail}
                    editPassword={editPassword}
                    setEditPassword={setEditPassword}
                    savingPerfil={savingPerfil}
                    perfilError={perfilError}
                    setEditMode={setEditMode}
                    setPerfilError={setPerfilError}
                    handleGuardarPerfil={handleGuardarPerfil}
                />
            ) : (
                <Pressable
                    style={[
                        styles.btn,
                        { backgroundColor: '#00dada' }
                    ]}
                    onPress={() => {
                        setEditMode(true);
                        setPerfilSuccess('');
                    }}
                >
                    <Ionicons
                        name="create-outline"
                        size={17}
                        color="#ffffff"
                    />

                    <Text
                        style={[
                            styles.btnTextOutline,
                            { color: '#ffffff' }
                        ]}
                    >
                        Editar perfil
                    </Text>
                </Pressable>
            )}

            {/* PANEL DE ADMINISTRACIÓN */}

            <AdminButton rol={user?.rol} />

            {/* MIS PEDIDOS */}

            <Pressable
                style={[
                    styles.btn,
                    { backgroundColor: '#0a7ea4' }
                ]}
                onPress={() => routerPush('/mis-pedidos')}
            >
                <Ionicons
                    name="receipt-outline"
                    size={17}
                    color="#fff"
                />

                <Text style={styles.btnTextWhite}>
                    Mis Pedidos
                </Text>
            </Pressable>

            {/* CERRAR SESIÓN */}

            <Pressable
                style={[
                    styles.btn,
                    { backgroundColor: '#ef4444' }
                ]}
                onPress={handleLogout}
            >
                <Ionicons
                    name="log-out-outline"
                    size={17}
                    color="#fff"
                />

                <Text style={styles.btnTextWhite}>
                    Cerrar sesión
                </Text>
            </Pressable>

        </ScrollView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDICIÓN DE PERFIL
// ─────────────────────────────────────────────────────────────────────────────

type EditProfileFormProps = {
    user: AuthCtx['user'];

    editNombre: string;
    setEditNombre: React.Dispatch<React.SetStateAction<string>>;

    editEmail: string;
    setEditEmail: React.Dispatch<React.SetStateAction<string>>;

    editPassword: string;
    setEditPassword: React.Dispatch<React.SetStateAction<string>>;

    savingPerfil: boolean;
    perfilError: string;

    setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    setPerfilError: React.Dispatch<React.SetStateAction<string>>;

    handleGuardarPerfil: () => Promise<void>;
};

function EditProfileForm({
    user,
    editNombre,
    setEditNombre,
    editEmail,
    setEditEmail,
    editPassword,
    setEditPassword,
    savingPerfil,
    perfilError,
    setEditMode,
    setPerfilError,
    handleGuardarPerfil
}: EditProfileFormProps, Readonly) {
    return (    
        <View style={styles.card}>

            <View style={styles.cardHeader}>
                <Ionicons
                    name="create-outline"
                    size={18}
                    color="#6366f1"
                />

                <Text style={styles.cardTitle}>
                    Editar perfil
                </Text>
            </View>

            <TextInput
                placeholder={`Nombre actual: ${user?.nombre || ''}`}
                value={editNombre}
                onChangeText={setEditNombre}
                style={styles.input}
            />

            <TextInput
                placeholder={`Email actual: ${user?.email || ''}`}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
            />

            <TextInput
                placeholder="Nueva contrasena (dejar vacio para no cambiar)"
                value={editPassword}
                onChangeText={setEditPassword}
                secureTextEntry
                style={styles.input}
            />

            {perfilError ? (
                <View style={styles.errorBanner}>
                    <Ionicons
                        name="alert-circle"
                        size={15}
                        color="#ef4444"
                    />

                    <Text style={styles.errorText}>
                        {perfilError}
                    </Text>
                </View>
            ) : null}

            <View style={styles.editActions}>

                <Pressable
                    style={[
                        styles.btn,
                        styles.btnPrimary,
                        { flex: 1 }
                    ]}
                    onPress={handleGuardarPerfil}
                    disabled={savingPerfil}
                >
                    {savingPerfil ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnTextWhite}>
                            Guardar
                        </Text>
                    )}
                </Pressable>

                <Pressable
                    style={[
                        styles.btn,
                        styles.btnOutline,
                        { flex: 1 }
                    ]}
                    onPress={() => {
                        setEditMode(false);
                        setPerfilError('');
                    }}
                >
                    <Text style={styles.btnTextOutline}>
                        Cancelar
                    </Text>
                </Pressable>

            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTÓN ADMINISTRACIÓN
// ─────────────────────────────────────────────────────────────────────────────

type AdminButtonProps = {
    rol?: string;
};

function AdminButton({ rol }: Readonly<AdminButtonProps>) {
    const hasAdminAccess =
        rol === 'administrador' || rol === 'auxiliar';

    if (!hasAdminAccess) {
        return null;
    }

    return (
        <Pressable
            style={[
                styles.btn,
                { backgroundColor: '#44A2FF' }
            ]}
            onPress={() => routerPush('/admin/dashboard')}
        >
            <Ionicons
                name="speedometer-outline"
                size={17}
                color="#fff"
            />

            <Text style={styles.btnTextWhite}>
                Panel de Administración
            </Text>
        </Pressable>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

    scroll: {
        flex: 1
    },

    container: {
        flex: 1
    },

    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
    },

    formCard: {
        borderRadius: 12,
        padding: 16,
        gap: 12,
        margin: 20
    },

    editSection: {
        borderRadius: 10,
        padding: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#e0eaf3'
    },

    editActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4
    },

    editBtn: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#0a7ea4',
        paddingVertical: 10,
        alignItems: 'center'
    },

    editBtnText: {
        color: '#0a7ea4',
        fontWeight: '600'
    },

    meta: {
        color: '#666',
        fontSize: 13
    },

    primaryButton: {
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D92B2B'
    },

    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    },

    secondaryButton: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D92B2B',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },

    logoutButton: {
        borderRadius: 10,
        backgroundColor: '#B01F1F',
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8
    },

    ordersButton: {
        borderRadius: 10,
        backgroundColor: '#D92B2B',
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8
    },

    adminBtn: {
        borderRadius: 10,
        backgroundColor: '#B01F1F',
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8
    },

    adminBtnText: {
        color: '#fff',
        fontWeight: '700'
    },

    ordersText: {
        color: '#fff',
        fontWeight: '700'
    },

    logoutText: {
        color: '#fff',
        fontWeight: '700'
    },

    content: {
        padding: 16,
        gap: 12,
        paddingBottom: 32
    },

    profileHeader: {
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },

    avatarCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    },

    profileName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff'
    },

    profileEmail: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2
    },

    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: 'flex-start'
    },

    roleBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600'
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e8e8e8',
        padding: 14,
        gap: 10
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4
    },

    cardTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: '#222'
    },

    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        paddingVertical: 14
    },

    btnPrimary: {
        backgroundColor: '#D92B2B'
    },

    btnOutline: {
        borderWidth: 2,
        borderColor: '#D92B2B',
        backgroundColor: '#fff'
    },

    btnTextWhite: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15
    },

    btnTextOutline: {
        color: '#D92B2B',
        fontWeight: '700',
        fontSize: 15
    },

    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff1f1',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FECACA'
    },

    successText: {
        color: '#B01F1F',
        fontSize: 13,
        fontWeight: '500'
    },

    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#fecaca'
    },

    errorText: {
        color: '#b91c1c',
        fontSize: 13
    },

    input: {
        borderWidth: 1,
        borderColor: '#d5d5d5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff'
    },

    error: {
        color: '#d64545'
    },

    success: {
        color: '#218f4c'
    }
});