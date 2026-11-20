import '@mantine/core/styles.css';
import '@fontsource-variable/inter';
import '@fontsource/pt-serif/cyrillic-400.css';
import '@fontsource/pt-serif/latin-400.css';
import './styles.css';
import { MantineProvider } from '@mantine/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { Header } from './Header';
import { calendarVariables, theme } from './theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} cssVariablesResolver={calendarVariables} forceColorScheme="light">
      <BrowserRouter>
        <Routes>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/plans/*" element={<><Header /><main className="shell content">
            <h1>Планы</h1><p>Работа с планами появится в следующей версии.</p>
          </main></>} />
          <Route path="*" element={<Navigate replace to="/calendar" />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);
