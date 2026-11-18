import { request } from './httpClient';

export const Autenticar = (email, senha) =>
  request('/login', { method: 'POST', body: { email, login: email, senha } });