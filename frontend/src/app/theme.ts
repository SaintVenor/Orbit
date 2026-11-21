import { createTheme, type CSSVariablesResolver } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter Variable, Inter, system-ui, sans-serif',
  headings: { fontFamily: 'PT Serif, Georgia, serif', fontWeight: '400' },
  primaryColor: 'pine',
  primaryShade: 7,
  defaultRadius: 'md',
  colors: {
    pine: ['#eef5ee', '#e3ede4', '#c9ddce', '#a7c9af', '#82b093', '#619579', '#437759', '#285641', '#204835', '#17382a'],
  },
});

export const calendarVariables: CSSVariablesResolver = () => ({
  variables: {
    '--paper': '#F8F6EF',
    '--surface': '#FFFDF8',
    '--line': '#D9DBD0',
    '--ink': '#242C28',
    '--muted': '#5C675F',
    '--pine': '#285641',
    '--event': '#324C73',
    '--event-bg': '#E0E9F5',
    '--event-mark': '#647da5',
    '--deadline': '#7A3D20',
    '--deadline-bg': '#F7E2D3',
    '--deadline-mark': '#a65630',
    '--birthday': '#483C69',
    '--birthday-bg': '#EBE5F4',
    '--birthday-mark': '#806699',
    '--step': '#285641',
    '--step-bg': '#E3EDE4',
    '--step-mark': '#578463',
    '--lesson': '#53451E',
    '--lesson-bg': '#F0E9D0',
  },
  light: {
    '--mantine-color-body': '#F8F6EF',
    '--mantine-color-text': '#242C28',
  },
  dark: {},
});
