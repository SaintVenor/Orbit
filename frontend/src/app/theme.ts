import { createTheme, type CSSVariablesResolver } from '@mantine/core';

export const theme = createTheme({
  fontFamily: 'Inter Variable, Inter, system-ui, sans-serif',
  headings: { fontFamily: 'PT Serif, Georgia, serif', fontWeight: '400' },
  primaryColor: 'indigo',
  primaryShade: { light: 8, dark: 4 },
  autoContrast: true,
  defaultRadius: 'sm',
  colors: {
    indigo: ['#f6f1fc', '#eae1f4', '#d9c7ed', '#c5abdf', '#b996d9', '#a47fc7', '#8865ab', '#735190', '#594077', '#443058'],
  },
});

const light = {
  '--paper': '#f4f2e9', '--surface': '#fffef8', '--panel-alt': '#eae8dc',
  '--line': '#cfcdbf', '--ink': '#24242a', '--muted': '#626155', '--pine': '#584279',
  '--selected': '#554079', '--selected-ink': '#ffffff', '--copper': '#69408b',
  '--event': '#293b78', '--event-bg': '#e6e9fc', '--event-mark': '#5065ac',
  '--deadline': '#843c2c', '--deadline-bg': '#f8e0d9', '--deadline-mark': '#ac5943',
  '--birthday': '#713963', '--birthday-bg': '#f3e1f0', '--birthday-mark': '#a25992',
  '--step': '#15556a', '--step-bg': '#daf0f4', '--step-mark': '#28788b',
  '--lesson': '#674e19', '--lesson-bg': '#f6ebce',
  '--mantine-color-body': '#f4f2e9', '--mantine-color-text': '#24242a',
};
const dark = {
  '--paper': '#1a1920', '--surface': '#24222b', '--panel-alt': '#302c39',
  '--line': '#49444f', '--ink': '#f6f1e7', '--muted': '#c4bfc7', '--pine': '#d8c1ff',
  '--selected': '#dcc3ff', '--selected-ink': '#291d39', '--copper': '#dec3fa',
  '--event': '#dce1ff', '--event-bg': '#2e3d70', '--event-mark': '#9baaf2',
  '--deadline': '#ffe1d6', '--deadline-bg': '#624237', '--deadline-mark': '#e5a590',
  '--birthday': '#ffe0f6', '--birthday-bg': '#55334f', '--birthday-mark': '#e7a0d5',
  '--step': '#d8fbff', '--step-bg': '#274939', '--step-mark': '#8bd6e2',
  '--lesson': '#f6dda1', '--lesson-bg': '#473a25',
  '--mantine-color-body': '#1a1920', '--mantine-color-text': '#f6f1e7',
};

export const calendarVariables: CSSVariablesResolver = () => ({ variables: {}, light, dark });
