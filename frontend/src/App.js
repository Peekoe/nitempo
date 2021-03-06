import React from "react";
import Home from "./pages/home/Home";
import Profile from "./pages/profile/Profile";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import SpotifyLogin from "./pages/spotifyLogin/SpotifyLogin";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

const code = new URLSearchParams(window.location.search).get('code')

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/spotifyLogin" element={code ? <Navigate to="/" /> : <SpotifyLogin/>}>
        </Route>
        <Route exact path="/" element={<Home code={code}/>}>
        </Route>
        <Route exact path="/login" element={<Login/>}>
        </Route>
        <Route exact path="/register" element={<Register/>}>
        </Route>
        <Route exact path="/profile/:username" element={<Profile/>}>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
