// Testa a regra que decide quando pedir novo aceite do consentimento LGPD.
// AsyncStorage é mockado porque o serviço o importa no topo.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { needsReconsent, CONSENT_VERSION } from '../services/onboardingService';

describe('needsReconsent', () => {
  it('não pede aceite sem usuário logado', () => {
    expect(needsReconsent(null)).toBe(false);
  });

  it('não pede aceite enquanto a versão do perfil não foi carregada', () => {
    // Usuário provisório da sessão local, ou perfil que falhou ao carregar.
    expect(needsReconsent({ id: 'u1', name: '' })).toBe(false);
  });

  it('não pede aceite quando a versão aceita é a atual', () => {
    expect(needsReconsent({ id: 'u1', consentVersion: CONSENT_VERSION })).toBe(false);
  });

  it('pede aceite quando a versão aceita é anterior', () => {
    expect(needsReconsent({ id: 'u1', consentVersion: '1.0' })).toBe(true);
  });

  it('pede aceite quando o perfil não tem versão registrada', () => {
    expect(needsReconsent({ id: 'u1', consentVersion: null })).toBe(true);
  });
});
