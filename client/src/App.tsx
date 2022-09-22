import "./App.css";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";

import Navbar from "./components/Navbar";

function App() {
    return (
        <div className="App">
            <Router>
                <Navbar />
                <div className="container">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                    </Routes>
                </div>
            </Router>
        </div>
    );
}

export default App;
