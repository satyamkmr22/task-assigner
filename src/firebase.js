import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
    apiKey: "AIzaSyBP3EaAccrf4rizKWvkgLNvTiEkW8liWfU",
    authDomain: "auth-dev-task-assigner.firebaseapp.com",
    projectId: "auth-dev-task-assigner",
    storageBucket: "auth-dev-task-assigner.appspot.com",
    messagingSenderId: "227650093902",
    appId: "1:227650093902:web:b4d646aa59d2b84027d41f"
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth=getAuth();
export {auth,db};
export default app;
