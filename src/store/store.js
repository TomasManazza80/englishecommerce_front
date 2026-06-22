import { Axios } from 'axios';
import { createContext } from 'react';

const authContext = createContext({
  token: null,
  role: null,
  setToken: () => { },
  setRole: () => { },
  getToken: () => { },
});

export default authContext;
