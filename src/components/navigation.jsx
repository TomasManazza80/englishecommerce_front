import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const buttonStyle = {
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  padding: '10px 15px', // Reducido el padding horizontal
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  borderRadius: '5px', // Agregado bordes redondeados
  fontSize: '0.9em', // Reducido el tamaño de la fuente
  marginLeft: '5px', // Agregado margen izquierdo para separar los botones
};

const buttonHoverStyle = {
  backgroundColor: '#0056b3'
};

const RedirectSingUp = () => {
  const navigate = useNavigate();
  const [hover, setHover] = React.useState(false);

  const handleRedirect = () => {
    navigate("/SingUp");
  };

  return (
    <button
      style={hover ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleRedirect}
    >
      Registro
    </button>
  );
};

const RedirectLogin = () => {
  const navigate = useNavigate();
  const [hover, setHover] = React.useState(false);

  const handleRedirect = () => {
    navigate("/login");
  };

  return (
    <button
      style={hover ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleRedirect}
    >
      Login
    </button>
  );
};

const LogoutButton = () => {
  const navigate = useNavigate();
  const [hover, setHover] = React.useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <button
      style={hover ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleLogout}
    >
      Cerrar Sesión
    </button>
  );
};

export const Navigation = (props) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <nav
      id="menu"
      className="navbar navbar-default navbar-fixed-top navBarMain"
      style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        padding: '15px 0',
        height: 'auto',
      }}
    >
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
            style={{
              borderColor: '#007bff',
            }}
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar" style={{ backgroundColor: '#007bff' }}></span>
            <span className="icon-bar" style={{ backgroundColor: '#007bff' }}></span>
            <span className="icon-bar" style={{ backgroundColor: '#007bff' }}></span>
          </button>
          <a
            className="navbar-brand center-text"
            href="#page-top"
            style={{
              color: '#343a40',
              fontWeight: '600',
              fontSize: '1.2em',
            }}
          >
           IPHONE ADICTT
          </a>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            {/* ... (rest of the navigation links) ... */}
            <li>
              <a
                href="#Header"
                className="page-scroll"
                style={{
                  color: '#343a40',
                  transition: 'color 0.3s ease',
                }}
                onMouseOver={(e) => (e.target.style.color = '#007bff')}
                onMouseOut={(e) => (e.target.style.color = '#343a40')}
              >
                Inicio
              </a>
            </li>
            <li>
              <a
                href="#features"
                className="page-scroll"
                style={{
                  color: '#343a40',
                  transition: 'color 0.3s ease',
                }}
                onMouseOver={(e) => (e.target.style.color = '#007bff')}
                onMouseOut={(e) => (e.target.style.color = '#343a40')}
              >
                Cirugías
              </a>
            </li>
            <li>
              <a
                href="#team"
                className="page-scroll"
                style={{
                  color: '#343a40',
                  transition: 'color 0.3s ease',
                }}
                onMouseOver={(e) => (e.target.style.color = '#007bff')}
                onMouseOut={(e) => (e.target.style.color = '#343a40')}
              >
                Doctores
              </a>
            </li>
            <li>
              <a
                href="#about"
                className="page-scroll"
                style={{
                  color: '#343a40',
                  transition: 'color 0.3s ease',
                }}
                onMouseOver={(e) => (e.target.style.color = '#007bff')}
                onMouseOut={(e) => (e.target.style.color = '#343a40')}
              >
                Información
              </a>
            </li>
            <li>
              <a
                href="#services"
                className="page-scroll"
                style={{
                  color: '#343a40',
                  transition: 'color 0.3s ease',
                }}
                onMouseOver={(e) => (e.target.style.color = '#007bff')}
                onMouseOut={(e) => (e.target.style.color = '#343a40')}
              >
                Servicios
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="page-scroll"
                style={{
                  color: '#343a40',
                  transition: 'color 0.3s ease',
                }}
                onMouseOver={(e) => (e.target.style.color = '#007bff')}
                onMouseOut={(e) => (e.target.style.color = '#343a40')}
              >
                Contacto
              </a>
            </li>
            {isAuthenticated ? (
              <li>
                <LogoutButton />
              </li>
            ) : (
              <>
                <li>
                  <RedirectLogin />
                </li>
                <li>
                  <RedirectSingUp />
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};