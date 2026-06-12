import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const emptyProfile = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  direccion: '',
};

const ProfilePage = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [passwordForm, setPasswordForm] = useState({
    passwordActual: '',
    passwordNueva: '',
    confirmarPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        cedula: user.cedula || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
      });
    }
  }, [user]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const payload = {
        nombre: profileForm.nombre.trim(),
        apellido: profileForm.apellido.trim(),
        telefono: profileForm.telefono.trim(),
        direccion: profileForm.direccion.trim(),
      };

      await updateProfile(payload);
      setMensaje({ tipo: 'success', texto: 'Tu perfil se actualizó correctamente.' });
    } catch (error) {
      setMensaje({
        tipo: 'danger',
        texto: error.response?.data?.message || error.message || 'No se pudo actualizar el perfil',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordForm.passwordNueva !== passwordForm.confirmarPassword) {
      setMensaje({ tipo: 'danger', texto: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }

    setSavingPassword(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      await authService.changePassword(passwordForm.passwordActual, passwordForm.passwordNueva);
      setPasswordForm({ passwordActual: '', passwordNueva: '', confirmarPassword: '' });
      setMensaje({ tipo: 'success', texto: 'Tu contraseña se cambió correctamente.' });
    } catch (error) {
      setMensaje({
        tipo: 'danger',
        texto: error.response?.data?.message || error.message || 'No se pudo cambiar la contraseña',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Mi cuenta';
  const userInitials = [user?.nombre?.[0], user?.apellido?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'MC';

  if (!user) {
    return <LoadingSpinner message="Cargando tu perfil..." />;
  }

  return (
    <Container className="py-4">
      <Row className="g-4 align-items-stretch">
        <Col lg={4}>
          <Card className="h-100 overflow-hidden">
            <div style={{
              background: 'linear-gradient(135deg, var(--red), #ff7a59)',
              color: 'white',
              padding: '2rem',
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div className="d-flex align-items-start justify-content-between gap-3">
                <div>
                  <div className="text-uppercase small opacity-75 mb-2">Mi perfil</div>
                  <h2 className="mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                    {userName}
                  </h2>
                  <div className="opacity-75">{user.email}</div>
                </div>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 800,
                }}>
                  {userInitials}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Badge bg="light" text="dark">{user.rol}</Badge>
                <Badge bg={user.activo ? 'success' : 'secondary'}>{user.activo ? 'Cuenta activa' : 'Cuenta inactiva'}</Badge>
              </div>
            </div>

            <Card.Body>
              <div className="mb-4">
                <div className="small text-muted text-uppercase mb-2">Gestión como usuario</div>
                <p className="mb-0 text-muted">
                  Desde aquí puedes mantener tus datos al día, proteger tu acceso y entrar rápido a tus pedidos.
                </p>
              </div>

              <div className="d-grid gap-2">
                <Button variant="primary" onClick={() => document.getElementById('datos-personales')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  Actualizar datos personales
                </Button>
                <Button variant="outline-primary" onClick={() => document.getElementById('seguridad-cuenta')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  Cambiar contraseña
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/mis-pedidos')}>
                  Ver mis pedidos
                </Button>
                <Button variant="outline-danger" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {mensaje.texto && (
            <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
              {mensaje.texto}
            </Alert>
          )}

          <Card className="mb-4" id="datos-personales">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <div>
                  <div className="text-uppercase small text-muted mb-1">Datos personales</div>
                  <h4 className="mb-0">Actualiza tu información</h4>
                </div>
                <Badge bg="light" text="dark">Editable</Badge>
              </div>

              <Form onSubmit={handleProfileSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Nombre</Form.Label>
                      <Form.Control name="nombre" value={profileForm.nombre} onChange={handleProfileChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Apellido</Form.Label>
                      <Form.Control name="apellido" value={profileForm.apellido} onChange={handleProfileChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Cédula</Form.Label>
                      <Form.Control name="cedula" value={profileForm.cedula} readOnly disabled />
                      <Form.Text className="text-muted">La cédula no se puede modificar desde este perfil.</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control name="telefono" value={profileForm.telefono} onChange={handleProfileChange} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Dirección</Form.Label>
                      <Form.Control name="direccion" value={profileForm.direccion} onChange={handleProfileChange} />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mt-4">
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card className="mb-4" id="seguridad-cuenta">
            <Card.Body>
              <div className="text-uppercase small text-muted mb-1">Seguridad</div>
              <h4 className="mb-3">Cambiar contraseña</h4>

              <Form onSubmit={handlePasswordSubmit}>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Contraseña actual</Form.Label>
                      <Form.Control
                        type="password"
                        name="passwordActual"
                        value={passwordForm.passwordActual}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Nueva contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="passwordNueva"
                        value={passwordForm.passwordNueva}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Confirmar contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmarPassword"
                        value={passwordForm.confirmarPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mt-4">
                  <Button type="submit" variant="outline-primary" disabled={savingPassword}>
                    {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <div className="text-uppercase small text-muted mb-1">Accesos rápidos</div>
              <h4 className="mb-3">Tu gestión diaria</h4>

              <Row className="g-3">
                <Col md={4}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body>
                      <h6 className="mb-2">Mis pedidos</h6>
                      <p className="text-muted small mb-3">Revisa el historial y sigue el estado de tus compras.</p>
                      <Button size="sm" variant="primary" onClick={() => navigate('/mis-pedidos')}>
                        Ir ahora
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body>
                      <h6 className="mb-2">Seguir comprando</h6>
                      <p className="text-muted small mb-3">Vuelve al catálogo y agrega productos a tu carrito.</p>
                      <Button size="sm" variant="outline-primary" onClick={() => navigate('/catalogo')}>
                        Explorar catálogo
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body>
                      <h6 className="mb-2">Estado de cuenta</h6>
                      <p className="text-muted small mb-3">Tu rol actual es {user.rol} y puedes mantener tu perfil al día.</p>
                      <Badge bg={user.activo ? 'success' : 'secondary'}>{user.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;