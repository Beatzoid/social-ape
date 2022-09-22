import { AppBar, Toolbar, Button } from "@mui/material";

import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        <AppBar>
            <Toolbar className="nav-container">
                <Button color="inherit" component={Link} to="/">
                    Home
                </Button>
                <Button color="inherit" component={Link} to="/login">
                    Login
                </Button>
                <Button color="inherit" component={Link} to="/signup">
                    Sign Up
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
