const firebaseConfig = {
  apiKey: 'AIzaSyBwvu__CbEtGBGaiEeOj9n0lBepzWaXdYA',
  authDomain: 'educationworldtravel-bbf1e.firebaseapp.com',
  projectId: 'educationworldtravel-bbf1e',
  storageBucket: 'educationworldtravel-bbf1e.firebasestorage.app',
  messagingSenderId: '283228279772',
  appId: '1:283228279772:web:254f4564449c5b961f7519'
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore(firebaseApp);
