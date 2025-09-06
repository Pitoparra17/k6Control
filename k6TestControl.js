import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // 50 usuarios virtuales simultáneos
  duration: '30s', // prueba durante 30 segundos
};

// Login una sola vez antes de que los VUs comiencen
export function setup() {
  const loginPayload = JSON.stringify({
    user: {
      email: 'random06@dominio.com',
      password: 'random06',
    },
  });

  const loginHeaders = {
    'Content-Type': 'application/json',
  };

  const loginRes = http.post('http://127.0.0.1:3000/api/users/login', loginPayload, {
    headers: loginHeaders,
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'token exists': (r) => JSON.parse(r.body).user?.token !== undefined,
  });

  const token = JSON.parse(loginRes.body).user.token;
  return { token }; // se pasa a default()
}

// Cada Virtual User (VU) usa el token para consultar el feed
export default function (data) {
  const authHeaders = {
    Authorization: `Token ${data.token}`,
    'Content-Type': 'application/json',
  };

  const feedRes = http.get('http://127.0.0.1:3000/api/articles?limit=10&offset=0', {
    headers: authHeaders,
  });

  check(feedRes, {
    'feed status is 200': (r) => r.status === 200,
    'articles received': (r) => JSON.parse(r.body).articles?.length > 0,
  });

  sleep(1); // espera entre peticiones
}

