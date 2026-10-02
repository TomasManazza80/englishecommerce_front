import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MisCursos from '../pages/MisCursos/MisCursos';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import authContext from '../store/store';

// Mocks
vi.mock('axios');

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({ email: 'test@test.com', role: 'user' }))
}));

vi.mock('../components/EditableText/EditableText.jsx', () => ({
  __esModule: true,
  default: ({ defaultText }) => <span dangerouslySetInnerHTML={{ __html: defaultText }} />
}));

const mockCourses = [
  {
    nombre: 'Curso de Inglés Básico',
    descripcion: 'Aprende lo básico ✅\nHabla fluído ✅',
    archivos: [{ name: 'video1.mp4', fileType: 'video', url: 'http://test.com/v.mp4' }]
  },
  {
    nombre: 'Advanced Grammar',
    descripcion: 'Advanced concepts',
    archivos: []
  }
];

describe('MisCursos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithContext = (token = 'fake-token') => {
    return render(
      <authContext.Provider value={{ token, role: 'user', user: { email: 'test@test.com' } }}>
        <BrowserRouter>
          <MisCursos />
        </BrowserRouter>
      </authContext.Provider>
    );
  };

  it('renders loading state initially', () => {
    // Return a never-resolving promise so loading stays true
    axios.get.mockImplementation(() => new Promise(() => {}));
    
    renderWithContext();
    
    expect(screen.queryByText(/You haven't acquired any courses yet/i)).not.toBeInTheDocument();
  });

  it('renders empty state when user has no courses', async () => {
    axios.get.mockResolvedValue({ data: [] });
    
    renderWithContext();
    
    await waitFor(() => {
      expect(screen.getByText(/You haven't acquired any courses yet/i)).toBeInTheDocument();
    });
  });

  it('renders a list of courses when API returns data', async () => {
    axios.get.mockResolvedValue({ data: mockCourses });
    
    renderWithContext();
    
    await waitFor(() => {
      expect(screen.getByText('Curso de Inglés Básico')).toBeInTheDocument();
      expect(screen.getByText('Advanced Grammar')).toBeInTheDocument();
    });
  });

  it('opens a course viewer when a course is clicked', async () => {
    axios.get.mockResolvedValue({ data: mockCourses });
    
    renderWithContext();
    
    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Curso de Inglés Básico')).toBeInTheDocument();
    });

    // Click the course card
    fireEvent.click(screen.getByText('Curso de Inglés Básico'));

    // Check if viewer opened
    await waitFor(() => {
      expect(screen.getByText(/Volver/i)).toBeInTheDocument();
      expect(screen.getAllByText('video1.mp4').length).toBeGreaterThan(0);
      expect(screen.getByText(/Solo Lectura - Protección Anti-Descarga/i)).toBeInTheDocument();
    });
  });
});
