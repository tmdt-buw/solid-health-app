//index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { markSafariBrowser } from './safariDetection';


import "./standalone/shell.css";
import "./standalone/layout.css";
document.body.classList.add("dataspace-standalone");

markSafariBrowser();

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="445131822551-cpfah56jkslkhf771vfmjfkmibupvlsc.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);


reportWebVitals();
serviceWorkerRegistration.register();


